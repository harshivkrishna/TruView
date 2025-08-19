import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const TokenExpirationCheck: React.FC = () => {
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    // Only check token expiration if user is logged in
    if (!currentUser) {
      return;
    }

    const checkTokenExpiration = () => {
      const token = localStorage.getItem('token');
      
      if (token && currentUser) {
        try {
          // Decode JWT token to check expiration
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (payload.exp && payload.exp < currentTime) {
            console.log('Token expired. Logging out user.');
            logout();
            // Redirect to login page
            if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
              window.location.href = '/login';
            }
          }
        } catch (error) {
          console.error('Error checking token expiration:', error);
          // If we can't decode the token, it's invalid - log out
          logout();
        }
      }
    };

    // Check immediately
    checkTokenExpiration();
    
    // Check every 5 minutes
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [currentUser, logout]);

  return null; // This component doesn't render anything
};

export default TokenExpirationCheck; 