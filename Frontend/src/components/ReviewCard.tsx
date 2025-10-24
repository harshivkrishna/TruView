import React, { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, Eye, Calendar, User, Share2, Award, Shield } from 'lucide-react';
import SocialShareModal from './SocialShareModal';
import MediaCarousel from './MediaCarousel';
import { calculateTrustScore, getTrustLevel } from '../utils/trustPrediction';
import { useReviewContext } from '../contexts/ReviewContext';
import { lazyLoadImage } from '../utils/imageOptimization';

interface ReviewCardProps {
  review: {
    _id: string;
    title: string;
    description: string;
    category: string;
    subcategory: string;
    rating: number;
    tags: string[];
    media?: Array<{
      type: 'image' | 'video';
      url: string;
      filename: string;
    }>;
    author?: {
      name: string;
      avatar?: string;
      userId?: string;
    };
    upvotes: number;
    views: number;
    createdAt: string;
    trustScore?: number;
    isRemovedByAdmin?: boolean;
    adminRemovalReason?: string;
  };
  showRank?: boolean;
  rank?: number;
  currentUserId?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = React.memo(({ review, showRank = false, rank, currentUserId }) => {
  const navigate = useNavigate();
  const [showShareModal, setShowShareModal] = useState(false);
  const { getReview } = useReviewContext();

  // Get the most up-to-date review data from global state
  const currentReview = getReview(review._id) || review;
  
  // Ensure currentReview has the correct type
  const safeReview = currentReview as typeof review;

  // Check if review is removed by admin and handle visibility
  const isRemovedByAdmin = safeReview.isRemovedByAdmin;
  const isOriginalAuthor = currentUserId && safeReview.author?.userId === currentUserId;

  // Don't hide removed reviews - show them with admin notice instead
  // This ensures all cards maintain the same height

  // Memoized trust score calculation
  const { trustScore, trustLevel } = useMemo(() => {
    const score = safeReview.trustScore || calculateTrustScore(safeReview);
    const level = getTrustLevel(score);
    return { trustScore: score, trustLevel: level };
  }, [safeReview]);

  // Memoized formatted date
  const formattedDate = useMemo(() => {
    return new Date(safeReview.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [safeReview.createdAt]);

  // Memoized truncated description
  const truncatedDescription = useMemo(() => {
    return safeReview.description.length > 150 
      ? safeReview.description.substring(0, 150) + '...'
      : safeReview.description;
  }, [safeReview.description]);

  // Memoized rating stars
  const ratingStars = useMemo(() => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < safeReview.rating ? 'text-orange-500 fill-current' : 'text-gray-300'}`}
      />
    ));
  }, [safeReview.rating]);

  // Memoized trust score component
  const trustScoreComponent = useMemo(() => (
    <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      trustLevel.level === 'High' ? 'bg-green-100 text-green-700' :
      trustLevel.level === 'Good' ? 'bg-blue-100 text-blue-700' :
      trustLevel.level === 'Fair' ? 'bg-yellow-100 text-yellow-700' :
      trustLevel.level === 'Low' ? 'bg-orange-100 text-orange-700' :
      'bg-red-100 text-red-700'
    }`}>
      <Award className="w-3 h-3 mr-1" />
      {trustScore}%
    </div>
  ), [trustScore, trustLevel]);

  // Memoized tags
  const tagsComponent = useMemo(() => (
    <div className="flex flex-wrap gap-1">
      {safeReview.tags.slice(0, 3).map((tag) => (
        <span
          key={tag}
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            tag === 'Brutal' ? 'bg-red-100 text-red-700' :
            tag === 'Honest' ? 'bg-blue-100 text-blue-700' :
            tag === 'Praise' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}
        >
          {tag}
        </span>
      ))}
      {safeReview.tags.length > 3 && (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
          +{safeReview.tags.length - 3}
        </span>
      )}
    </div>
  ), [safeReview.tags]);

  // Callback handlers
  const handleShare = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const handleAuthorClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (safeReview.author?.userId) {
      navigate(`/profile/${safeReview.author.userId}`);
    }
  }, [safeReview.author?.userId, navigate]);

  const handleCardClick = useCallback(() => {
    navigate(`/review/${safeReview._id}`);
  }, [safeReview._id, navigate]);

  // Memoized utility functions
  const truncateText = useCallback((text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }, []);

  const getTagStyle = (tag: string) => {
    const styles = {
      'Brutal': 'from-red-500 to-red-600 text-white shadow-red-200',
      'Honest': 'from-blue-500 to-blue-600 text-white shadow-blue-200',
      'Praise': 'from-green-500 to-green-600 text-white shadow-green-200',
      'Warning': 'from-yellow-500 to-yellow-600 text-white shadow-yellow-200',
      'default': 'from-gray-500 to-gray-600 text-white shadow-gray-200'
    };
    return styles[tag as keyof typeof styles] || styles.default;
  };

  const getCategoryGradient = (category: string) => {
    const gradients = {
      'Technology': 'from-blue-500 to-purple-600',
      'Food': 'from-orange-500 to-red-600',
      'Travel': 'from-green-500 to-teal-600',
      'Entertainment': 'from-pink-500 to-purple-600',
      'Shopping': 'from-indigo-500 to-blue-600',
      'default': 'from-gray-500 to-gray-700'
    };
    return gradients[category as keyof typeof gradients] || gradients.default;
  };

  return (
    <>
      <motion.div 
        className="p-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ 
          y: -8,
          rotateX: 2,
          transition: { duration: 0.3 }
        }}
      >
        <div className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full min-h-[600px] flex flex-col relative ${isRemovedByAdmin ? 'border-2 border-red-300 bg-red-50' : ''}`}>
          
          {/* Admin Removal Notice - Only visible to original author */}
          {isRemovedByAdmin && isOriginalAuthor && (
            <div className="bg-red-100 border-b-2 border-red-300 p-4">
              <div className="flex items-center gap-2 text-red-800">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Review Removed by Admin</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {safeReview.adminRemovalReason || 'This review has been removed by an administrator due to policy violations.'}
              </p>
              <p className="text-xs text-red-600 mt-2">
                This review is only visible to you. Other users cannot see this content.
              </p>
            </div>
          )}
          {/* Trust Score Badge - Always Visible */}
          <div className="absolute top-4 right-4 z-10">
            <div className={`px-3 py-1.5 rounded-full text-sm font-bold bg-white shadow-xl border-2 ${trustLevel.color.includes('bg-') ? `border-${trustLevel.color.split('-')[1]}-500` : 'border-gray-500'}`}>
              <div className="flex items-center gap-1.5">
                <Award className={`w-4 h-4 ${trustLevel.color.includes('text-') ? trustLevel.color.split(' ')[1] : 'text-gray-600'}`} />
                <span className={`font-mono font-bold ${trustLevel.color.includes('text-') ? trustLevel.color.split(' ')[1] : 'text-gray-700'}`}>{trustScore}%</span>
              </div>
            </div>
          </div>

          {/* Tags Section OR Admin Removal Notice */}
          {isRemovedByAdmin && !isOriginalAuthor ? (
            /* Admin Removal Notice for Public Users */
            <div className="p-6 py-5 bg-red-100 border-b-2 border-red-300 min-h-[80px] flex items-center">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-red-800">
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold">Review Removed by Admin</span>
                </div>
                <div className="px-3 py-1.5 bg-white shadow-lg border-2 border-red-500 rounded-full">
                  <span className="text-sm font-bold text-red-700">65%</span>
                </div>
              </div>
            </div>
          ) : (
            /* Normal Tags Section - Only top 2 tags visible */
            <div className="p-6 py-5 bg-gray-50 border-b border-gray-200 min-h-[80px] flex items-center">
              <div className="flex items-center gap-2 flex-wrap w-full">
                {currentReview.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={tag}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r ${getTagStyle(tag)} text-white`}
                  >
                    {tag}
                  </span>
                ))}
                {currentReview.tags.length > 2 && (
                  <span className="px-2 py-1.5 text-xs text-gray-500 bg-gray-100 rounded-full">
                    +{currentReview.tags.length - 2} more
                  </span>
                )}
                {!currentReview.media && (
                  <div className="ml-auto flex flex-col items-end gap-1">
                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r ${getCategoryGradient(currentReview.category)} text-white`}>
                      {currentReview.category}
                    </span>
                  {currentReview.subcategory && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                    {currentReview.subcategory}
                  </span>
                )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Media Section OR Admin Removal Details */}
          {currentReview.media && currentReview.media.length > 0 && (
            <>
              {isRemovedByAdmin && !isOriginalAuthor ? (
                /* Admin Removal Details for Public Users */
                <div className="relative h-48 bg-red-50 border-b-2 border-red-300 flex items-center justify-center">
                  <div className="text-center text-red-700 p-6">
                    <p className="text-sm mb-2">
                      {safeReview.adminRemovalReason || 'Review removed due to: Policy Violation'}
                    </p>
                    <p className="text-xs text-red-600">
                      This review is only visible to you. Other users cannot see this content.
                    </p>
                  </div>
                </div>
              ) : (
                /* Normal Media Section */
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={currentReview.media[0].url}
                    alt="Review media"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Category Badge */}
                  <div className="absolute bottom-3 left-3 flex flex-col gap-1">
                    <div className="px-2 py-1 bg-black bg-opacity-70 text-white text-xs font-medium rounded-full">
                      {currentReview.category}
                    </div>
                    {currentReview.subcategory && (
                      <div className="px-2 py-1 bg-black bg-opacity-50 text-white text-xs font-medium rounded-full">
                        {currentReview.subcategory}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Content Section */}
          <div className="p-4 flex-1 flex flex-col">
            {/* Title */}
            <Link to={`/review/${currentReview._id}`} className="block mb-3">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-2 hover:text-orange-600 transition-colors h-[56px] overflow-hidden">
                {currentReview.title}
              </h3>
            </Link>

            {/* Rating */}
            <div className="flex items-center mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Star
                      className={`w-5 h-5 ${i < currentReview.rating ? 'text-orange-500 fill-current' : 'text-gray-300'}`}
                    />
                  </motion.div>
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700 ml-2">({currentReview.rating}/5)</span>
            </div>

            {/* Description */}
            <div className="text-gray-600 text-sm mb-6 h-[72px] overflow-hidden relative">
              <p className="leading-relaxed" style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {currentReview.description}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-auto space-y-4">
              {/* Author Info */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center ${currentReview.author?.userId ? 'group/profile' : ''}`}>
                  {/* Profile Picture */}
                  <div className="relative mr-3">
                    {currentReview.author?.avatar ? (
                      <motion.img
                        src={currentReview.author.avatar}
                        alt={currentReview.author.name}
                        className={`w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg ${currentReview.author?.userId ? 'cursor-pointer group-hover/profile:border-orange-300' : ''}`}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                        onClick={currentReview.author?.userId ? handleAuthorClick : undefined}
                        title={currentReview.author?.userId ? `View ${currentReview.author.name}'s profile` : currentReview.author.name}
                        onError={(e) => {
                          // Fallback to default avatar if image fails to load
                          e.currentTarget.style.display = 'none';
                          const fallbackElement = e.currentTarget.nextElementSibling;
                          if (fallbackElement) {
                            fallbackElement.classList.remove('hidden');
                          }
                        }}
                      />
                    ) : null}
                    <motion.div
                      className={`w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg ${currentReview.author?.avatar ? 'hidden' : ''} ${currentReview.author?.userId ? 'cursor-pointer group-hover/profile:from-orange-600 group-hover/profile:to-red-600' : ''}`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                      onClick={currentReview.author?.userId ? handleAuthorClick : undefined}
                      title={currentReview.author?.userId ? `View ${currentReview.author?.name}'s profile` : currentReview.author?.name || 'Anonymous'}
                    >
                      <User className="w-6 h-6 text-white" />
                    </motion.div>
                    

                  </div>
                  
                  <div>
                    {currentReview.author?.userId ? (
                      <motion.button
                        onClick={handleAuthorClick}
                        className="text-sm font-semibold text-gray-900 hover:text-orange-600 transition-colors cursor-pointer group-hover/profile:text-orange-600"
                        whileHover={{ x: 2 }}
                        title={`View ${currentReview.author.name}'s profile`}
                      >
                        {currentReview.author.name}
                      </motion.button>
                    ) : (
                      <span className="text-sm font-semibold text-gray-900">{currentReview.author?.name || 'Anonymous'}</span>
                    )}
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(currentReview.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Engagement Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-6">
                  <motion.div 
                    className="flex items-center text-gray-600"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mr-2">
                      <ThumbsUp className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm font-semibold">{currentReview.upvotes}</span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center text-gray-600"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold">{currentReview.views}</span>
                  </motion.div>
                </div>
                
                {/* Share Button */}
                <motion.button
                  whileHover={{ scale: 1.1, rotateZ: 15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowShareModal(true);
                  }}
                  className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
                  title="Share review"
                >
                  <Share2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Bottom Accent Line */}
          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        </div>
      </motion.div>

      {/* Social Share Modal */}
      {showShareModal && (
        <SocialShareModal
          review={currentReview}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
});

export default ReviewCard;