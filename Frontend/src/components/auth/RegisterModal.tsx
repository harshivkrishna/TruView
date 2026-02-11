import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, Eye, EyeOff, Phone, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import OTPVerificationModal from './OTPVerificationModal';
import toast from 'react-hot-toast';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  isAdminMode?: boolean; // New prop to indicate admin registration
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  passKey?: string; // New field for admin passkey
}

const RegisterModal: React.FC<RegisterModalProps> = ({ 
  isOpen, 
  onClose, 
  onSwitchToLogin, 
  isAdminMode = false 
}) => {
  const { signup, verifyEmail } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    passKey: '' // Remove pre-fill, users must enter manually
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassKey, setShowPassKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Please enter your first name';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters long';
    } else if (formData.firstName.trim().length > 50) {
      newErrors.firstName = 'First name cannot exceed 50 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName.trim())) {
      newErrors.firstName = 'First name can only contain letters and spaces';
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Please enter your last name';
    } else if (formData.lastName.trim().length < 1) {
      newErrors.lastName = 'Last name must be at least 1 character long';
    } else if (formData.lastName.trim().length > 50) {
      newErrors.lastName = 'Last name cannot exceed 50 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName.trim())) {
      newErrors.lastName = 'Last name can only contain letters and spaces';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.email.trim().length > 100) {
      newErrors.email = 'Email address cannot exceed 100 characters';
    }

    // Phone Number validation
    const phoneRegex = /^\d{10}$/;
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Please enter your phone number';
    } else if (!phoneRegex.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Please enter a password';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    } else if (formData.password.length > 128) {
      newErrors.password = 'Password cannot exceed 128 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Admin PassKey validation (only for admin mode)
    if (isAdminMode) {
      if (!formData.passKey.trim()) {
        newErrors.passKey = 'Please enter the admin PassKey';
      } else if (formData.passKey.trim() !== 'truviews') {
        newErrors.passKey = 'Invalid PassKey. Please contact the administrator for the correct PassKey.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setFormData(prev => ({ ...prev, phoneNumber: value }));
      setErrors(prev => ({
        ...prev,
        phoneNumber: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Check if user agreed to terms (skip for admin mode)
    if (!isAdminMode && !agreedToTerms) {
      setTermsError('You must agree to the Terms & Conditions and Privacy Policy to continue');
      return;
    }
    
    setTermsError('');
    setIsLoading(true);
    setGeneralError('');
    
    try {
      const { confirmPassword, passKey, ...userData } = formData;
      
      if (isAdminMode) {
        // For admin registration, include the passkey validation
        const response = await signup(formData.email, formData.password, { 
          ...userData, 
          isAdminRegistration: true,
          passKey: formData.passKey 
        });
        
        // Admin accounts are created immediately without email verification
        setIsLoading(false);
        toast.success('Admin account created successfully! Please login with your credentials.');
        handleClose();
        setTimeout(() => {
          onSwitchToLogin();
        }, 1000);
      } else {
        // Regular user registration
        await signup(formData.email, formData.password, userData);
        
        // Show transition message
        toast.success('Account created! Opening verification...');
        
        // Immediately transition to OTP modal
        setIsLoading(false);
        setRegisteredEmail(formData.email);
        setShowOTPModal(true);
      }
    } catch (error: any) {
      setIsLoading(false);
      // Handle specific registration errors
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message;
        
        if (errorMessage?.includes('already exists with this email')) {
          setErrors(prev => ({ ...prev, email: 'An account with this email already exists. Please login instead.' }));
        } else if (errorMessage?.includes('already exists with this phone number') || errorMessage?.includes('Phone number already registered')) {
          setErrors(prev => ({ ...prev, phoneNumber: 'This phone number is already registered. Please use a different number or login instead.' }));
        } else if (errorMessage?.includes('All fields are required')) {
          toast.error('Please fill in all required fields');
        } else if (errorMessage?.includes('Phone number must be exactly 10 digits')) {
          setErrors(prev => ({ ...prev, phoneNumber: 'Phone number must be exactly 10 digits' }));
        } else {
          setErrors(prev => ({ ...prev, email: errorMessage || 'Registration failed. Please check your information and try again.' }));
        }
      } else if (error.response?.status === 500) {
        if (error.response.data?.message?.includes('Failed to send verification email')) {
          setErrors(prev => ({ ...prev, email: 'Registration successful but verification email failed to send. Please contact support.' }));
        } else {
          toast.error('Registration failed due to server error. Please try again later.');
        }
      } else if (error.message && error.message.includes('passkey')) {
        setErrors(prev => ({ ...prev, passKey: 'Invalid PassKey. Please enter the correct admin PassKey.' }));
      } else if (error.message && error.message.includes('Invalid secret code')) {
        setErrors(prev => ({ ...prev, passKey: 'Invalid PassKey. Please enter the correct admin PassKey.' }));
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    }
  };

  const handleVerificationSuccess = (token: string, user: any) => {
    setShowOTPModal(false);
    handleClose();
    // Show success message and redirect to login modal
    toast.success('Account created successfully! Please login with your credentials.');
    setTimeout(() => {
      onSwitchToLogin();
    }, 1000); // Small delay to let user see the success message
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      passKey: ''
    });
    setErrors({});
    setGeneralError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowPassKey(false);
    setShowOTPModal(false);
    setRegisteredEmail('');
    setAgreedToTerms(false);
    setTermsError('');
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isAdminMode ? 'Create Admin Account' : 'Create Account'}
                  </h2>
                  {isAdminMode && (
                    <p className="text-sm text-gray-600 mt-1">
                      Admin registration requires a valid PassKey
                    </p>
                  )}
                </div>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3"
                  >
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    <p className="text-blue-700 text-sm">
                      {isAdminMode ? 'Creating admin account...' : 'Creating your account...'}
                    </p>
                  </motion.div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        name="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="First name"
                        required
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Last name"
                      required
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                    )}
                  </motion.div>
                </div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      name="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handlePhoneChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                        errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="1234567890"
                      maxLength={10}
                      required
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                      data-ms-reveal="false"
                      style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' } as React.CSSProperties}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                      data-ms-reveal="false"
                      style={{ WebkitTextSecurity: showConfirmPassword ? 'none' : 'disc' } as React.CSSProperties}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </motion.div>

                {isAdminMode && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin PassKey *</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        name="passKey"
                        type={showPassKey ? 'text' : 'password'}
                        value={formData.passKey}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                          errors.passKey ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter admin PassKey"
                        data-ms-reveal="false"
                        style={{ WebkitTextSecurity: showPassKey ? 'none' : 'disc' } as React.CSSProperties}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassKey(!showPassKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.passKey && (
                      <p className="text-red-500 text-xs mt-1">{errors.passKey}</p>
                    )}
                  </motion.div>
                )}

                {/* Terms & Conditions Checkbox - Only for regular users */}
                {!isAdminMode && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-start space-x-2 mb-4"
                  >
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked);
                        if (e.target.checked) {
                          setTermsError('');
                        }
                      }}
                      className="mt-1 h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
                    />
                    <label htmlFor="agreeToTerms" className="text-sm text-gray-600 cursor-pointer">
                      I agree to the{' '}
                      <a 
                        href="/terms" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-orange-500 hover:text-orange-600 font-medium underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Terms & Conditions
                      </a>
                      {' '}and{' '}
                      <a 
                        href="/privacy" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-orange-500 hover:text-orange-600 font-medium underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Privacy Policy
                      </a>
                    </label>
                  </motion.div>
                )}
                
                {termsError && (
                  <p className="text-red-500 text-xs mb-3 -mt-2">{termsError}</p>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {isLoading && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  )}
                  {isLoading 
                    ? (isAdminMode ? 'Creating Admin Account...' : 'Creating Account...') 
                    : (isAdminMode ? 'Create Admin Account' : 'Create Account')
                  }
                </motion.button>
              </form>

              <motion.div
                className="mt-6 text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <p className="text-gray-600">
                  {isAdminMode ? 'Already have an admin account?' : 'Already have an account?'}{' '}
                  <button
                    onClick={onSwitchToLogin}
                    className="text-orange-500 hover:text-orange-600 font-medium"
                  >
                    Login
                  </button>
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OTPVerificationModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        email={registeredEmail}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </>
  );
};

export default RegisterModal;