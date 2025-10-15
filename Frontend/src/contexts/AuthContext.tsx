import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/api';
import { clearAnonymousId } from '../utils/anonymousId';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
}

interface LoginResponse {
  message: string;
  token?: string;
  user?: User;
  requiresVerification?: boolean;
  email?: string;
  firstName?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, userData: any) => Promise<any>;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  handleTokenExpiration: () => void;
  resetPassword: (email: string) => Promise<any>;
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
        
        // Email is now sent by the backend via SES
        return response;
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    setLoading(true);
    try {
      // Check if this is an admin login attempt
      const ADMIN_EMAIL = 'connect.truview@gmail.com';
      let response;
      
      if (email === ADMIN_EMAIL) {
        // Use admin login endpoint for admin email
        response = await api.adminLogin({ email, password });
      } else {
        // Use regular login endpoint for regular users
        response = await api.loginUser({ email, password });
      }
      
      // Check if email verification is required (only for regular users)
      if (response.requiresVerification) {
        // Email is now sent by the backend via SES
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
    
    // Clear any cached data that might contain user info
    sessionStorage.clear();
    
    // Force a page reload to ensure all state is cleared
    window.location.href = '/';
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      const response = await api.forgotPassword(email);
      
      // Email is now sent by the backend via SES
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
      
      // Email is now sent by the backend via SES
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