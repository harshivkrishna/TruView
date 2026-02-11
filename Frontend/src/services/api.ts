import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getAnonymousId } from '../utils/anonymousId';

// Use environment variable or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased from 10s to 30s
  withCredentials: true, // Enable sending cookies and authorization headers
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Add request interceptor to always include the latest token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // For file uploads, don't set Content-Type - let browser handle it
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

// Add response interceptor for better error handling and logging
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle token expiration and invalid token errors first (more specific)
    if (error.response?.status === 401) {
      // Safely extract message from response data (backend might return different shapes)
      const respData = error.response?.data as any;
      const message = respData?.message ?? respData?.error ?? '';

      if (message === 'Invalid token' || message === 'Token expired') {
        // Only handle token expiration if we're on a protected route
        const currentPath = window.location.pathname;
        const isProtectedRoute = ['/submit', '/profile', '/admin'].some(route =>
          currentPath.startsWith(route)
        );

        if (isProtectedRoute) {
          // Clear token and user data
          localStorage.removeItem('token');
          localStorage.removeItem('user');

          // Redirect to login page
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }

        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401) {
      // Handle generic unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/';
    }

    return Promise.reject(error);
  }
);

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
    return { reviews: [], pagination: { currentPage: 1, totalPages: 1, totalReviews: 0, hasNextPage: false, hasPrevPage: false } };
  }
};

export const getTrendingReviews = async () => {
  try {
    const response = await api.get('/reviews/trending');
    return response.data;
  } catch (error) {
    return [];
  }
};

export const getMostViewedReviewsWeek = async () => {
  try {
    // Temporarily use trending endpoint until backend is deployed
    const response = await api.get('/reviews/trending');
    return response.data;
  } catch (error) {
    return [];
  }
};

export const getReview = async (id: string) => {
  try {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const incrementReviewView = async (id: string) => {
  try {
    // Get anonymous ID for unauthenticated users
    const anonymousId = getAnonymousId();
    
    const response = await api.patch(`/reviews/${id}/view`, {
      anonymousId: anonymousId
    });
    
    return response.data;
  } catch (error: any) {
    // Don't throw error for view increment - it shouldn't break the page
    return null;
  }
};

export const createReview = async (reviewData: any) => {
  try {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  } catch (error) {
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
    throw error;
  }
};

// Categories API
export const getCategories = async () => {
  try {
    const response = await api.get('/categories');
    return response.data;
  } catch (error) {
    return [];
  }
};

export const getCategoriesWithSubcategories = async () => {
  try {
    const response = await api.get('/categories/with-subcategories');
    return response.data;
  } catch (error) {
    return [];
  }
};

export const getSubcategoriesForCategory = async (categorySlug: string) => {
  try {
    const response = await api.get(`/categories/${categorySlug}/subcategories`);
    return response.data.subcategories || [];
  } catch (error) {
    return [];
  }
};

export const getTrendingCategories = async () => {
  try {
    const response = await api.get('/categories/trending');
    return response.data;
  } catch (error) {
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
    return response.data;
  } catch (error) {
    throw error;
  }
};

// User Profile API
export const getUserProfile = async (userId: string) => {
  try {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const updateUserProfile = async (profileData: any) => {
  try {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadProfilePhoto = async (formData: FormData) => {
  try {
    // Don't set Content-Type manually - let the browser set it with the boundary
    const response = await api.post('/users/profile/photo', formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserReviews = async (userId: string) => {
  try {
    const response = await api.get(`/users/${userId}/reviews`);
    return response.data;
  } catch (error) {
    return [];
  }
};

// Leaderboard API
export const getLeaderboard = async () => {
  try {
    const response = await api.get('/users/leaderboard');
    return response.data;
  } catch (error) {
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
// Admin Analytics (optimized)
export const getAdminAnalytics = async (timePeriod = 30) => {
  try {
    const response = await api.get(`/admin/analytics?period=${timePeriod}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    throw error;
  }
};

// Admin Stats (legacy - kept for compatibility)
export const getAdminStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin Reviews (optimized with pagination)
export const getAdminReviews = async (page = 1, limit = 50) => {
  try {
    const response = await api.get(`/admin/reviews?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin Users (optimized with pagination)
export const getAdminUsers = async (page = 1, limit = 50) => {
  try {
    const response = await api.get(`/admin/users?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin Reports (optimized with pagination)
export const getAdminReports = async (page = 1, limit = 50) => {
  try {
    const response = await api.get(`/admin/reports?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Trigger analytics computation
export const computeAnalytics = async (date?: string) => {
  try {
    console.log('Computing analytics with date:', date);
    console.log('Making request to:', `${API_BASE_URL}/admin/analytics/compute`);
    const response = await api.post('/admin/analytics/compute', { date });
    console.log('Analytics computation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Analytics computation error:', error);
    throw error;
  }
};

// Get analytics status
export const getAnalyticsStatus = async () => {
  try {
    const response = await api.get('/admin/analytics/status');
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

// Admin Login API (Hardcoded credentials)
export const adminLogin = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    const response = await api.post('/auth/admin/login', credentials);
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
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;