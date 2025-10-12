import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as api from '../services/api';
import { clearAnonymousId } from '../utils/anonymousId';
import { emailService } from '../services/emailService';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, userData: any) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  handleTokenExpiration: () => void;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<{ token: string; user: User }>;
  resendVerification: (email: string) => Promise<any>;
  updateCurrentUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for stored user data and token
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const signup = async (email: string, password: string, userData: any) => {
    setLoading(true);
    try {
      // Check if this is an admin registration
      if (userData.isAdminRegistration && userData.passKey) {
        // Use admin creation API
        const response = await api.createAdminAccount({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email,
          password,
          phoneNumber: userData.phoneNumber,
          secretCode: userData.passKey
        });
        
        // For admin accounts, we don't need email verification
        // Return success immediately
        return response;
      } else {
        // Regular user registration
        const response = await api.registerUser({
          email,
          password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber
        });
        
        // Store user ID for verification
        localStorage.setItem('pendingUserId', response.userId);
        
        // Send verification email using EmailJS
        console.log('📧 Checking email sending conditions:', {
          hasOtp: !!response.otp,
          hasEmail: !!response.email,
          hasFirstName: !!response.firstName,
          otp: response.otp,
          email: response.email,
          firstName: response.firstName
        });
        
        if (response.otp && response.email && response.firstName) {
          try {
            console.log('📧 Calling emailService.sendVerificationOTP...');
            const emailResult = await emailService.sendVerificationOTP(
              response.email,
              response.otp,
              response.firstName
            );
            
            console.log('📧 Email result:', emailResult);
            
            if (!emailResult.success) {
              console.error('Failed to send verification email:', emailResult.error);
              // Don't throw error - user can still verify manually
            } else {
              console.log('✅ Verification email sent successfully!');
            }
          } catch (emailError) {
            console.error('EmailJS error:', emailError);
            // Don't throw error - user can still verify manually
          }
        } else {
          console.error('❌ Missing required fields for email sending');
        }
        
        return response;
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('🔐 AuthContext: login function called with:', { email });
    setLoading(true);
    try {
      const response = await api.loginUser({ email, password });
      
      // Check if email verification is required
      console.log('🔐 Login response:', response);
      console.log('🔐 Verification check:', {
        requiresVerification: response.requiresVerification,
        hasOtp: !!response.otp,
        hasEmail: !!response.email,
        hasFirstName: !!response.firstName
      });
      
      if (response.requiresVerification && response.otp && response.email && response.firstName) {
        console.log('📧 Login: Sending verification email...');
        // Send verification email using EmailJS
        try {
          const emailResult = await emailService.sendVerificationOTP(
            response.email,
            response.otp,
            response.firstName
          );
          
          console.log('📧 Login: Email result:', emailResult);
          
          if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            // Don't throw error - user can still verify manually
          } else {
            console.log('✅ Login: Verification email sent successfully!');
          }
        } catch (emailError) {
          console.error('EmailJS error:', emailError);
          // Don't throw error - user can still verify manually
        }
        
        // Return the verification response
        return response;
      }
      
      // Store token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Clear anonymous ID when user logs in
      clearAnonymousId();
      
      setCurrentUser(response.user);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('pendingUserId');
    
    // Redirect to root route if not already there
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      const response = await api.forgotPassword(email);
      
      // Send password reset email using EmailJS
      if (response.otp && response.email && response.firstName) {
        try {
          const emailResult = await emailService.sendPasswordResetOTP(
            response.email,
            response.otp,
            response.firstName
          );
          
          if (!emailResult.success) {
            console.error('Failed to send password reset email:', emailResult.error);
            // Don't throw error - user can still reset manually
          }
        } catch (emailError) {
          console.error('EmailJS error:', emailError);
          // Don't throw error - user can still reset manually
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email: string, otp: string): Promise<{ token: string; user: User }> => {
    setLoading(true);
    try {
      const response = await api.verifyEmail(email, otp);
      
      // Store token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.removeItem('pendingUserId');
      
      // Clear anonymous ID when user verifies email
      clearAnonymousId();
      
      setCurrentUser(response.user);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email: string): Promise<any> => {
    setLoading(true);
    try {
      const response: any = await api.resendVerification(email);
      
      // Send verification email using EmailJS
      if (response.otp && response.email && response.firstName) {
        try {
          const emailResult = await emailService.sendVerificationOTP(
            response.email,
            response.otp,
            response.firstName
          );
          
          if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            // Don't throw error - user can still verify manually
          }
        } catch (emailError) {
          console.error('EmailJS error:', emailError);
          // Don't throw error - user can still verify manually
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleTokenExpiration = () => {
    logout(); // This will handle the redirect to root route
  };

  const updateCurrentUser = (userData: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    handleTokenExpiration,
    resetPassword,
    verifyEmail,
    resendVerification,
    updateCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};