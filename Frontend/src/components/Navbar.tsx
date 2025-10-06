import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, Star, User, LogOut, Settings, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './auth/LoginModal';
import RegisterModal from './auth/RegisterModal';
import ForgotPasswordModal from './auth/ForgotPasswordModal';

const Navbar = () => {
  const { currentUser, logout, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Check if we're on the admin route
  const isAdminRoute = location.pathname === '/admin';
  
  // Debug: Log the current route and admin status
  // console.log('Current pathname:', location.pathname, 'isAdminRoute:', isAdminRoute);

  const handleProfileClick = () => {
    if (currentUser?.id) {
      navigate(`/profile/${currentUser.id}`);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div 
            className="flex items-center"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="flex items-center space-x-2">
        
              <div className="w-52 h-auto mt-6 object-cover">
                <img src="/assets/logo1.png" alt="Truviews" />
              </div>
            </Link>
          </motion.div>

          <motion.div 
            className="hidden md:flex items-center space-x-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link to="/" className="text-gray-700 hover:text-orange-500 transition-colors">
              Home
            </Link>
            <Link to="/categories" className="text-gray-700 hover:text-orange-500 transition-colors">
              Categories
            </Link>
            <Link to="/discover" className="text-gray-700 hover:text-orange-500 transition-colors">
              Discovery
            </Link>
            
            {currentUser && currentUser.emailVerified ? (
              <>
                {/* Only show Write Review for non-admin users */}
                {currentUser.role !== 'admin' && (
                  <Link 
                    to="/submit" 
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Write Review
                  </Link>
                )}
                
                {/* Only show Profile for non-admin users */}
                {currentUser.role !== 'admin' && (
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors"
                  >
                    <User className="w-5 h-6" />
                    {currentUser.firstName || 'User'}
                  </button>
                )}
                
                {/* Show Admin Dashboard for admin users */}
                {currentUser.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Admin Dashboard
                  </Link>
                )}
              </>
            ) : (
              // Only show auth buttons if not on admin route (admin auth is handled by ProtectedRoute)
              location.pathname !== '/admin' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="text-gray-700 hover:text-orange-500 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              )
            )}
          </motion.div>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden py-4 space-y-4 overflow-hidden"
            >
              <Link 
                to="/" 
                className="block text-gray-700 hover:text-orange-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/categories" 
                className="block text-gray-700 hover:text-orange-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </Link>
              <Link 
                to="/discover" 
                className="block text-gray-700 hover:text-orange-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Discovery
              </Link>
              
              {currentUser && currentUser.emailVerified ? (
                <>
                  {/* Only show Write Review for non-admin users */}
                  {currentUser.role !== 'admin' && (
                    <Link 
                      to="/submit" 
                      className="block bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Write Review
                    </Link>
                  )}
                  
                  {/* Only show Profile for non-admin users */}
                  {currentUser.role !== 'admin' && (
                    <button
                      onClick={() => {
                        handleProfileClick();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left text-gray-700 hover:text-orange-500 transition-colors"
                    >
                      My Profile
                    </button>
                  )}
                  
                  {/* Show Admin Dashboard for admin users */}
                  {currentUser.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="block text-gray-700 hover:text-orange-500 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </>
              ) : (
                // Only show auth buttons if not on admin route (admin auth is handled by ProtectedRoute)
                location.pathname !== '/admin' && (
                  <>
                    <button
                      onClick={() => {
                        setShowLoginModal(true);
                        setIsMenuOpen(false);
                      }}
                      className="block text-gray-700 hover:text-orange-500 transition-colors"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        setShowRegisterModal(true);
                        setIsMenuOpen(false);
                      }}
                      className="block bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-center"
                    >
                      Sign Up
                    </button>
                  </>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
        onSwitchToForgotPassword={() => {
          setShowLoginModal(false);
          setShowForgotPasswordModal(true);
        }}
      />
      
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
        isAdminMode={isAdminRoute}
      />

      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onSwitchToLogin={() => {
          setShowForgotPasswordModal(false);
          setShowLoginModal(true);
        }}
      />
    </nav>
  );
};

export default Navbar;