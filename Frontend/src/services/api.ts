import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add token to requests if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Add request interceptor to always include the latest token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Reviews API
export const getReviews = async (params = {}) => {
  try {
    // Build query string with proper encoding
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
    
    const response = await api.get(`/reviews?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('API Error - getReviews:', error);
    return [];
  }
};

export const getTrendingReviews = async () => {
  try {
    console.log('Making API request to:', `${API_BASE_URL}/reviews/trending`);
    const response = await api.get('/reviews/trending');
    console.log('API response:', response);
    return response.data;
  } catch (error: any) {
    console.error('API Error - getTrendingReviews:', error);
    if (error.response) {
      // Server responded with error status
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
    } else {
      // Something else happened
      console.error('Error message:', error.message);
    }
    throw error; // Re-throw to let component handle it
  }
};

export const getReview = async (id: string) => {
  try {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  } catch (error) {
    console.error('API Error - getReview:', error);
    throw error;
  }
};

export const createReview = async (reviewData: any) => {
  try {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  } catch (error) {
    console.error('API Error - createReview:', error);
    throw error;
  }
};

export const upvoteReview = async (id: string) => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.patch(`/reviews/${id}/upvote`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('API Error - upvoteReview:', error);
    throw error;
  }
};

// Categories API
export const getCategories = async () => {
  try {
    const response = await api.get('/categories');
    return response.data;
  } catch (error) {
    console.error('API Error - getCategories:', error);
    return [];
  }
};

export const getTrendingCategories = async () => {
  try {
    const response = await api.get('/categories/trending');
    return response.data;
  } catch (error) {
    console.error('API Error - getTrendingCategories:', error);
    return [];
  }
};

// Upload API
export const uploadMedia = async (formData: FormData) => {
  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Error - uploadMedia:', error);
    throw error;
  }
};

// User Profile API
export const getUserProfile = async (userId: string) => {
  try {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  } catch (error) {
    console.error('API Error - getUserProfile:', error);
    throw error;
  }
};

export const updateUserProfile = async (profileData: any) => {
  try {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('API Error - updateUserProfile:', error);
    throw error;
  }
};

export const uploadProfilePhoto = async (formData: FormData) => {
  try {
    const response = await api.post('/users/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('API Error - uploadProfilePhoto:', error);
    throw error;
  }
};

export const getUserReviews = async (userId: string) => {
  try {
    const response = await api.get(`/users/${userId}/reviews`);
    return response.data;
  } catch (error) {
    console.error('API Error - getUserReviews:', error);
    return [];
  }
};

// Leaderboard API
export const getLeaderboard = async () => {
  try {
    const response = await api.get('/users/leaderboard');
    return response.data;
  } catch (error) {
    console.error('API Error - getLeaderboard:', error);
    return [];
  }
};

// Admin API
export const getSecretCode = async () => {
  try {
    const response = await api.get('/admin/secret-code');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSecretCode = async (newSecretCode: string) => {
  try {
    const response = await api.put('/admin/secret-code', { newSecretCode });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// PassKey Management (Admin)
export const getPassKey = async () => {
  try {
    const response = await api.get('/admin/passkey');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updatePassKey = async (newPassKey: string) => {
  try {
    const response = await api.put('/admin/passkey', { newPassKey });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create Admin Account
export const createAdminAccount = async (adminData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  secretCode: string;
}) => {
  try {
    const response = await api.post('/admin/create-admin', adminData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin Statistics
export const getAdminStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin Reviews
export const getAdminReviews = async () => {
  try {
    const response = await api.get('/admin/reviews');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin Users
export const getAdminUsers = async () => {
  try {
    const response = await api.get('/admin/users');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin Reports
export const getAdminReports = async () => {
  try {
    const response = await api.get('/admin/reports');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Handle Report Action
export const handleReportAction = async (reportId: string, action: 'accept' | 'reject') => {
  try {
    const response = await api.post(`/admin/reports/${reportId}/${action}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete Review (Admin)
export const deleteReview = async (reviewId: string) => {
  try {
    const response = await api.delete(`/admin/reviews/${reviewId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Reports API
export const createReport = async (reportData: {
  reviewId: string;
  reason: string;
  description: string;
}) => {
  try {
    const response = await api.post('/reports', reportData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Auth API
export const registerUser = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyEmail = async (email: string, otp: string) => {
  try {
    const response = await api.post('/auth/verify-email', { email, otp });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resendVerification = async (email: string) => {
  try {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Forgot Password API - Updated for better compatibility
export const forgotPassword = async (email: string) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (resetData: {
  email: string;
  otp: string;
  newPassword: string;
}) => {
  try {
    const response = await api.post('/auth/reset-password', { resetData });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;