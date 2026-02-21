import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Settings, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, SUPPORTED_LANGUAGES } from '../contexts/LanguageContext';
import LoginModal from './auth/LoginModal';
import RegisterModal from './auth/RegisterModal';
import ForgotPasswordModal from './auth/ForgotPasswordModal';

const Navbar = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showLangPopup, setShowLangPopup] = useState(false);
  const langPopupRef = useRef<HTMLDivElement>(null);
  const { reviewLanguage, setReviewLanguage, getNativeLanguageName } = useLanguage();

  const isAdmin = currentUser?.role === 'admin';

  // Close language popup on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langPopupRef.current && !langPopupRef.current.contains(e.target as Node)) {
        setShowLangPopup(false);
      }
    };
    if (showLangPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLangPopup]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

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
              <div className="w-52 mt-[20px] h-auto">
                <img src="/assets/logo1.png" alt="Truviews" className="object-contain" />
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

            {(currentUser && currentUser.emailVerified) || isAdmin ? (
              <>
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/submit"
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Quick Review
                    </Link>
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors overflow-hidden"
                      title={`${currentUser.firstName}'s Profile`}
                    >
                      {currentUser.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.firstName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </>
                )}
              </>
            ) : (
              // Auth buttons + Quick Review for non-logged in users
              location.pathname !== '/admin' && (
                <div className="flex items-center gap-3">
                  <Link
                    to="/submit"
                    className="border-2 border-orange-500 text-orange-500 px-4 py-2 rounded-lg hover:bg-orange-500 hover:text-white transition-colors font-medium"
                  >
                    Quick Review
                  </Link>
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

            {/* Language Selector - at the end of navbar */}
            <div className="relative" ref={langPopupRef}>
              <button
                onClick={() => setShowLangPopup(!showLangPopup)}
                className="flex items-center gap-1.5 text-gray-600 hover:text-orange-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-orange-50"
                title="Change review language"
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs font-medium">{getNativeLanguageName(reviewLanguage)}</span>
              </button>

              <AnimatePresence>
                {showLangPopup && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Review Language</p>
                    </div>
                    <div className="p-1.5">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setReviewLanguage(lang.code);
                            setShowLangPopup(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${reviewLanguage === lang.code
                            ? 'bg-orange-50 text-orange-600 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          <span>{lang.name}</span>
                          <span className="text-xs text-gray-400">{lang.nativeName}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <button
            className="md:hidden flex items-center justify-center p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Sliding Sidebar */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop/Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Sliding Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-full bg-white shadow-2xl z-50 md:hidden overflow-y-auto flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 min-h-[64px]">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center">
                  <img src="/assets/logo1.png" alt="Truviews" className="w-40 h-auto object-contain" />
                </Link>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 mt-[-20px] rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center shrink-0"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Sidebar Navigation - Main content area */}
              <div className="flex-1 flex flex-col p-4 space-y-2 overflow-y-auto">
                <Link
                  to="/"
                  className="block px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-500 rounded-lg transition-colors font-medium text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/categories"
                  className="block px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-500 rounded-lg transition-colors font-medium text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Categories
                </Link>
                <Link
                  to="/discover"
                  className="block px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-500 rounded-lg transition-colors font-medium text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Discovery
                </Link>

                {/* Language Selector in Mobile */}
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Review Language</p>
                  <div className="flex gap-2 px-4 pb-2">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setReviewLanguage(lang.code)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${reviewLanguage === lang.code
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {lang.nativeName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logged in user actions */}
                {(currentUser && currentUser.emailVerified) || isAdmin ? (
                  <>
                    {isAdmin ? (
                      <>
                        {/* Admin Dashboard */}
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-4 py-3 bg-orange-500 text-white hover:bg-orange-600 rounded-lg transition-colors font-medium text-lg"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Settings className="w-5 h-5" />
                          Admin Dashboard
                        </Link>
                      </>
                    ) : (
                      <>
                        {/* Regular user options */}
                        <button
                          onClick={() => {
                            handleProfileClick();
                            setIsMenuOpen(false);
                          }}
                          className="block px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-500 rounded-lg transition-colors font-medium text-lg w-full text-left"
                        >
                          My Profile
                        </button>

                        <Link
                          to="/submit"
                          className="flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 transition-colors text-center font-semibold mt-2"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Quick Review
                        </Link>
                      </>
                    )}
                  </>
                ) : (
                  // Auth buttons for non-logged in users
                  location.pathname !== '/admin' && (
                    <>
                      {/* Divider */}
                      <div className="border-t border-gray-200 my-3"></div>

                      <button
                        onClick={() => {
                          setShowLoginModal(true);
                          setIsMenuOpen(false);
                        }}
                        className="block px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-500 rounded-lg transition-colors font-medium text-lg text-left"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          setShowRegisterModal(true);
                          setIsMenuOpen(false);
                        }}
                        className="block bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 transition-colors text-center font-medium text-lg"
                      >
                        Sign Up
                      </button>
                    </>
                  )
                )}

                {/* Spacer to push footer links to bottom */}
                <div className="flex-1"></div>

                {/* Footer Links */}
                <div className="border-t border-gray-200 pt-3 mt-auto space-y-1">
                  <Link
                    to="/privacy"
                    className="block px-4 py-2 text-gray-600 hover:text-orange-500 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    to="/terms"
                    className="block px-4 py-2 text-gray-600 hover:text-orange-500 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Terms & Conditions
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
        isAdminMode={false}
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