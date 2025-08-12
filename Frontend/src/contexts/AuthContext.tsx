import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, userData: any) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<{ token: string; user: User }>;
  resendVerification: (email: string) => Promise<any>;
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
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const signup = async (email: string, password: string, userData: any) => {
    setLoading(true);
    try {
      const response = await api.registerUser({
        email,
        password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber
      });
      
      // Store user ID for verification
      localStorage.setItem('pendingUserId', response.userId);
      
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.loginUser({ email, password });
      
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
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      const response = await api.forgotPassword(email);
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
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    verifyEmail,
    resendVerification
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};