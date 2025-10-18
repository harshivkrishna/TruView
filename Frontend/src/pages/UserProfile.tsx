import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Edit, 
  Save, 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  Star,
  Eye,
  EyeOff,
  Camera,
  Upload,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, getUserReviews, updateUserProfile, uploadProfilePhoto } from '../services/api';
import ReviewCard from '../components/ReviewCard';
import { motion } from 'framer-motion';
import { getCachedData, reviewCache } from '../utils/cache';
import { updateMetaTags, generateUserProfileStructuredData, addStructuredData } from '../utils/seo';
import { preloadImage } from '../utils/imageOptimization';

interface UserProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  bio?: string;
  avatar?: string;
  reviewCount: number;
  trustScore: number;
  isPublicProfile: boolean;
  createdAt: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { currentUser, logout, updateCurrentUser } = useAuth();
  
  // Helper function to format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [userReviews, setUserReviews] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    city: '',
    state: '',
    country: '',
    bio: '',
    isPublicProfile: true
  });

  // Optimized data fetching with caching
  const fetchUserData = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Try to get from cache first
      const [profileData, reviewsData] = await Promise.all([
        getCachedData(
          reviewCache,
          `user-profile-${userId}`,
          () => getUserProfile(userId)
        ),
        getCachedData(
          reviewCache,
          `user-reviews-${userId}`,
          () => getUserReviews(userId)
        )
      ]);
      
      setProfile(profileData);
      setUserReviews(reviewsData);
      
      // Initialize edit form with profile data
      setEditForm({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        phoneNumber: profileData.phoneNumber || '',
        dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '',
        city: profileData.location?.city || '',
        state: profileData.location?.state || '',
        country: profileData.location?.country || '',
        bio: profileData.bio || '',
        isPublicProfile: profileData.isPublicProfile || true
      });

      // Update SEO meta tags
      updateMetaTags({
        title: `${profileData.firstName} ${profileData.lastName} - Profile | TruView`,
        description: profileData.bio || `Reviewer with ${profileData.reviewCount} reviews on TruView`,
        keywords: `${profileData.firstName} ${profileData.lastName}, reviewer, reviews, profile`,
        canonical: `${window.location.origin}/profile/${userId}`
      });

      // Add user profile structured data
      const userData = generateUserProfileStructuredData({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        bio: profileData.bio,
        reviewCount: profileData.reviewCount
      });
      addStructuredData(userData);

      // Preload avatar image
      if (profileData.avatar) {
        preloadImage(profileData.avatar).catch(() => {
          // Ignore preload errors
        });
      }
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch user profile and reviews data
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Refresh profile data when component becomes active (e.g., after navigation)
  useEffect(() => {
    const handleFocus = () => {
      if (userId) {
        // Refresh profile data when user returns to the page
        const refreshData = async () => {
          try {
            const [profileData, reviewsData] = await Promise.all([
              getUserProfile(userId),
              getUserReviews(userId)
            ]);
            
            setProfile(profileData);
            setUserReviews(reviewsData);
          } catch (error) {
            // Handle error silently
          }
        };
        
        refreshData();
      }
    };

    // Listen for page focus events
    window.addEventListener('focus', handleFocus);
    
    // Also refresh when component mounts (in case user navigated back)
    if (userId) {
      handleFocus();
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId]);


  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = useCallback(async () => {
    try {
      setIsEditing(false);
      
      // Prepare profile data for API
      const profileData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phoneNumber: editForm.phoneNumber,
        dateOfBirth: editForm.dateOfBirth,
        location: {
          city: editForm.city,
          state: editForm.state,
          country: editForm.country
        },
        bio: editForm.bio,
        isPublicProfile: editForm.isPublicProfile
      };
      
      // Update profile in backend
      const updatedUser = await updateUserProfile(profileData);
      
      // Update local profile state with the backend response (most accurate)
      if (updatedUser) {
        setProfile(updatedUser);
      }
      
      // Clear cache to prevent stale data
      if (userId) {
        reviewCache.delete(`user-profile-${userId}`);
      }
      
      // Update AuthContext with new user data
      updateCurrentUser({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phoneNumber: editForm.phoneNumber
      });
      
      // Force a re-render by updating a dummy state
      setForceUpdate(prev => prev + 1);
      
    } catch (error) {
      // Revert to editing mode on error
      setIsEditing(true);
    }
  }, [editForm, userId, updateCurrentUser]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB = 5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024; // 5MB
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      
      if (file.size > maxSize) {
        setError(`File size is too large (${fileSizeMB} MB). Please select an image smaller than 5 MB.`);
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPEG, PNG, GIF, etc.)');
        e.target.value = '';
        return;
      }
      
      setError(null); // Clear any previous errors
      setPhotoFile(file);
      
      // Create preview immediately so user can see what they selected
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      console.log(`✅ Image selected: ${file.name} (${fileSizeMB} MB)`);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;
    
    try {
      setUploadingPhoto(true);
      setError(null); // Clear any previous errors
      
      const formData = new FormData();
      formData.append('profilePhoto', photoFile);
      
      const response = await uploadProfilePhoto(formData);
      
      // Update profile with new photo URL - handle different response structures
      let newPhotoUrl = '';
      if (response.photoUrl) {
        newPhotoUrl = response.photoUrl;
      } else if (response.avatar) {
        newPhotoUrl = response.avatar;
      } else if (response.url) {
        newPhotoUrl = response.url;
      } else if (response.imageUrl) {
        newPhotoUrl = response.imageUrl;
      } else if (response.user?.avatar) {
        newPhotoUrl = response.user.avatar;
      } else if (typeof response === 'string') {
        newPhotoUrl = response;
      }
      
      if (newPhotoUrl && profile) {
        // Add cache-busting timestamp to force reload
        const cacheBustedUrl = `${newPhotoUrl}?t=${Date.now()}`;
        
        // Update the profile state with the new photo URL immediately
        setProfile(prev => prev ? { ...prev, avatar: cacheBustedUrl } : null);
        
        // Update AuthContext with new avatar
        updateCurrentUser({} as any);
        
        // Force a complete refresh of the profile data
        try {
          const refreshedProfile = await getUserProfile(userId || '');
          if (refreshedProfile) {
            // Add cache buster to refreshed profile too
            if (refreshedProfile.avatar) {
              refreshedProfile.avatar = `${refreshedProfile.avatar}?t=${Date.now()}`;
            }
            setProfile(refreshedProfile);
          }
        } catch (refreshError) {
          console.error('Error refreshing profile:', refreshError);
        }
        
        // Trigger a force update to re-render
        setForceUpdate(prev => prev + 1);
      }
      
      // Clear file and preview only after successful update
      setPhotoFile(null);
      setPhotoPreview(null);
      
    } catch (error: any) {
      console.error('Photo upload error:', error);
      
      // Show detailed error message to user
      let errorMessage = 'Failed to upload photo. Please try again.';
      
      if (error.response?.status === 413) {
        // File too large
        errorMessage = error.response?.data?.message || 'File size is too large. Please select an image smaller than 5 MB.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Profile not found. Your session may have expired. Please log out and log back in.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log out and log back in to upload photos.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid file. Please select a valid image file.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      // Clear the file and preview on error
      setPhotoFile(null);
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    // You can also add an API call here to remove the photo from the backend
    if (profile) {
      setProfile(prev => prev ? { ...prev, avatar: '' } : null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Manual refresh function for profile data
  const refreshProfileData = async () => {
    if (!userId) return;
    
    try {
      const [profileData, reviewsData] = await Promise.all([
        getUserProfile(userId),
        getUserReviews(userId)
      ]);
      
      setProfile(profileData);
      setUserReviews(reviewsData);
    } catch (error) {
      // Handle error silently
    }
  };

  // Calculate current review count from userReviews state for real-time updates
  const currentReviewCount = userReviews.length;
  const displayReviewCount = profile?.reviewCount || currentReviewCount;

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'Unable to load user profile'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Check if profile is public or if user is viewing their own profile
  const isOwnProfile = currentUser && currentUser.id === profile._id;
  const canViewProfile = profile.isPublicProfile || isOwnProfile;
  const canEditProfile = isOwnProfile;

  // If profile is private and user is not the owner, show access denied
  if (!canViewProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <EyeOff className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile is Private</h2>
          <p className="text-gray-600 mb-4">This user has set their profile to private.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {/* Show photo preview first if available (when user selects a new photo) */}
                {photoPreview ? (
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : profile.avatar ? (
                  /* Show uploaded avatar if available and no preview */
                  <img 
                    key={profile.avatar} // Force re-render when avatar changes
                    src={profile.avatar} 
                    alt={`${profile.firstName} ${profile.lastName}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  /* Show default user icon if no avatar and no preview */
                  <User className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                )}
              </div>
              
              {canEditProfile && isEditing && (
                <div className="absolute -bottom-1 -right-1 sm:bottom-0 sm:right-0 flex flex-row sm:flex-col gap-1">
                  <label 
                    className="bg-orange-500 text-white p-1.5 sm:p-2 rounded-full hover:bg-orange-600 cursor-pointer"
                    title="Click to select a new photo"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                  </label>
                  
                  {photoFile && (
                    <>
                      <button
                        onClick={handlePhotoUpload}
                        disabled={uploadingPhoto}
                        className="bg-green-500 text-white p-1.5 sm:p-2 rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingPhoto ? (
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                        ) : (
                          <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </button>
                      <button
                        onClick={handleRemovePhoto}
                        className="bg-red-500 text-white p-1.5 sm:p-2 rounded-full hover:bg-red-600"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </>
                  )}
                  
                  {!photoFile && profile.avatar && (
                    <button
                      onClick={handleRemovePhoto}
                      className="bg-red-500 text-white p-1.5 sm:p-2 rounded-full hover:bg-red-600"
                      title="Remove photo"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-1 w-full text-center sm:text-left">
              <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start space-y-3 sm:space-y-0">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base">{profile.email}</p>
                </div>
                
                <div className="flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-3">
                  {canEditProfile && isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="flex items-center space-x-1 sm:space-x-2 bg-green-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-green-600 text-sm"
                      >
                        <Save className="w-4 h-4" />
                        <span className="hidden sm:inline">Save</span>
                      </button>
                      <button
                        onClick={handleEditToggle}
                        className="flex items-center space-x-1 sm:space-x-2 bg-gray-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-600 text-sm"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Cancel</span>
                      </button>
                    </>
                  ) : canEditProfile ? (
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center space-x-1 sm:space-x-2 bg-orange-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-orange-600 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit Profile</span>
                    </button>
                  ) : null}
                  
                  {/* Logout button only for own profile */}
                  {canEditProfile && (
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-1 sm:space-x-2 px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start items-center gap-3 sm:gap-6 text-sm sm:text-base">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  <span className="text-gray-700">{profile.trustScore} Trust Score</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  <span className="text-gray-700">{displayReviewCount} Reviews</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  <span className="text-gray-700">Joined {formatDate(profile.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  {canEditProfile && isEditing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={editForm.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.firstName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  {canEditProfile && isEditing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={editForm.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.lastName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  {canEditProfile && isEditing ? (
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={editForm.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.phoneNumber}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  {canEditProfile && isEditing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={editForm.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <p className="text-gray-900">{formatDate(profile.dateOfBirth)}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Location & Bio */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Location & Bio</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  {canEditProfile && isEditing ? (
                    <input
                      type="text"
                      name="city"
                      value={editForm.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.location?.city || 'Not specified'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  {canEditProfile && isEditing ? (
                    <input
                      type="text"
                      name="state"
                      value={editForm.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.location?.state || 'Not specified'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  {canEditProfile && isEditing ? (
                    <input
                      type="text"
                      name="country"
                      value={editForm.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.location?.country || 'Not specified'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  {canEditProfile && isEditing ? (
                    <textarea
                      name="bio"
                      value={editForm.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.bio || 'No bio added yet.'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Public Profile</label>
                  {canEditProfile && isEditing ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isPublicProfile"
                        checked={editForm.isPublicProfile}
                        onChange={(e) => setEditForm(prev => ({ ...prev, isPublicProfile: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Make profile visible to other users</span>
                    </label>
                  ) : (
                    <p className="text-gray-900">
                      {profile.isPublicProfile ? 'Public' : 'Private'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Reviews Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6 mt-4 sm:mt-6 hover:shadow-md transition-all duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
            {canEditProfile ? 'My Reviews' : `${profile.firstName}'s Reviews`}
          </h2>
              <p className="text-sm text-gray-600">
                {userReviews.length} review{userReviews.length !== 1 ? 's' : ''} • {profile.trustScore}% trust score
              </p>
            </div>
            {userReviews.length > 6 && (
              <Link
                to={`/profile/${userId}/reviews`}
                className="text-orange-500 hover:text-orange-600 font-semibold text-sm flex items-center gap-1"
              >
                View All Reviews
                <span className="text-xs">→</span>
              </Link>
            )}
          </div>
          
                      {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-sm animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
          ) : userReviews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {userReviews.slice(0, 6).map((review: any, index: number) => (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                >
                  <ReviewCard 
                    review={review}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {canEditProfile 
                  ? 'Start sharing your experiences with the community!' 
                  : `${profile.firstName} hasn't written any reviews yet.`
                }
              </p>
              {canEditProfile && (
                <Link
                  to="/submit"
                  className="inline-block bg-orange-500 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base"
                >
                  Write Your First Review
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 