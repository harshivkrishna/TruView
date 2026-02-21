import React, { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, Eye, Calendar, User, Share2, Award, Shield, Play, Video } from 'lucide-react';
import SocialShareModal from './SocialShareModal';
import { calculateTrustScore, getTrustLevel } from '../utils/trustPrediction';
import { useReviewContext } from '../contexts/ReviewContext';
import { useAuth } from '../contexts/AuthContext';
import { upvoteReview } from '../services/api';
import toast from 'react-hot-toast';
import TranslatedReviewContent from './TranslatedReviewContent';

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
    upvotedBy?: string[];
    views: number;
    createdAt: string;
    trustScore?: number;
    isRemovedByAdmin?: boolean;
    adminRemovalReason?: string;
    originalLanguage?: string;
    translations?: Record<string, string>;
    titleTranslations?: Record<string, string>;
  };
  showRank?: boolean;
  rank?: number;
  currentUserId?: string;
}

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

const ReviewCard: React.FC<ReviewCardProps> = React.memo(({ review, showRank = false, rank, currentUserId }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const { getReview, updateReview } = useReviewContext();

  // Get the most up-to-date review data from global state
  const currentReview = (review._id ? getReview(review._id) : null) || review;

  // Ensure currentReview has the correct type
  const safeReview = currentReview as typeof review;

  // Reset loading states only when media URL actually changes (not on translation updates)
  const mediaUrl = currentReview.media?.[0]?.url;
  React.useEffect(() => {
    // Don't reset if there's no media
    if (!mediaUrl) return;
    
    // Reset loading states when media URL changes
    setImageLoaded(false);
    setVideoLoaded(false);
  }, [mediaUrl]);

  // Check if current user has upvoted this review
  React.useEffect(() => {
    if (currentUser && safeReview.upvotedBy) {
      const upvoted = (safeReview.upvotedBy as any[]).some((userId: any) =>
        userId === currentUser.id || userId.toString() === currentUser.id
      );
      setHasUpvoted(upvoted);
    } else {
      // Reset hasUpvoted when user is not logged in
      setHasUpvoted(false);
    }
  }, [currentUser, safeReview.upvotedBy]);

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
    if (!safeReview.createdAt) return 'Recently';
    return new Date(safeReview.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [safeReview.createdAt]);


  // Memoized rating stars
  const ratingStars = useMemo(() => {
    const rating = safeReview.rating || 0;
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'text-orange-500 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-sm font-semibold text-gray-700 ml-2">({rating}/5)</span>
      </div>
    );
  }, [safeReview.rating]);


  // Memoized tags
  const tagsComponent = useMemo(() => {
    const tags = Array.isArray(safeReview?.tags) ? safeReview.tags : [];
    return (
      <div className="flex items-center gap-2 flex-wrap w-full">
        {tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r ${getTagStyle(tag)} text-white`}
          >
            {tag}
          </span>
        ))}
        {tags.length > 2 && (
          <span className="px-2 py-1.5 text-xs text-gray-500 bg-gray-100 rounded-full">
            +{tags.length - 2} more
          </span>
        )}
        {!safeReview.media && safeReview.category && (
          <div className="ml-auto flex flex-col items-end gap-1">
            <span className={`px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r ${getCategoryGradient(safeReview.category)} text-white`}>
              {safeReview.category}
            </span>
            {safeReview.subcategory && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                {safeReview.subcategory}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }, [safeReview.tags, safeReview.media, safeReview.category, safeReview.subcategory]);

  // Callback handlers
  const handleUpvote = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is logged in
    if (!currentUser) {
      toast.error('Please log in to like reviews');
      return;
    }

    // Prevent multiple simultaneous upvotes
    if (isUpvoting) return;

    // Store previous values for potential rollback
    const previousUpvotes = safeReview.upvotes || 0;
    const previousHasUpvoted = hasUpvoted;

    try {
      setIsUpvoting(true);

      // Optimistic UI update - instant feedback
      const newUpvoteCount = previousHasUpvoted ? previousUpvotes - 1 : previousUpvotes + 1;
      const newHasUpvoted = !previousHasUpvoted;

      setHasUpvoted(newHasUpvoted);

      // Update local state immediately
      updateReview(safeReview._id, {
        upvotes: newUpvoteCount,
        upvotedBy: newHasUpvoted
          ? [...(safeReview.upvotedBy || []), currentUser.id]
          : (safeReview.upvotedBy || []).filter((userId: any) => userId !== currentUser.id)
      });

      // Make API call in background
      const updatedReview = await upvoteReview(safeReview._id);

      // Update with actual response from server
      updateReview(safeReview._id, updatedReview);

      // Update upvote state based on the updated review
      if (updatedReview.upvotedBy) {
        const serverHasUpvoted = (updatedReview.upvotedBy as any[]).some((userId: any) =>
          userId === currentUser.id || userId.toString() === currentUser.id
        );
        setHasUpvoted(serverHasUpvoted);
      }

    } catch (error: any) {
      // Rollback on error
      setHasUpvoted(previousHasUpvoted);
      updateReview(safeReview._id, {
        upvotes: previousUpvotes,
        upvotedBy: previousHasUpvoted
          ? [...(safeReview.upvotedBy || []), currentUser.id]
          : (safeReview.upvotedBy || []).filter((userId: any) => userId !== currentUser.id)
      });

      if (error.response?.status === 401) {
        toast.error('Please log in to like reviews');
      } else if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || 'You cannot upvote this review');
      } else {
        toast.error('Failed to like review');
      }
    } finally {
      setIsUpvoting(false);
    }
  }, [currentUser, isUpvoting, safeReview, hasUpvoted, updateReview]);

  const handleAuthorClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (safeReview.author?.userId) {
      navigate(`/profile/${safeReview.author.userId}`);
    }
  }, [safeReview.author?.userId, navigate]);



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
              {tagsComponent}
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
                /* Normal Media Section - Clickable */
                <Link to={`/review/${currentReview._id}`} className="block relative h-48 bg-gray-100 cursor-pointer overflow-hidden">
                  {currentReview.media[0].type === 'video' ? (
                    /* Video Thumbnail with Play Icon */
                    <>
                      {/* Skeleton Loader for Video */}
                      {!videoLoaded && (
                        <div className="absolute inset-0 bg-gray-200 animate-pulse">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                          </div>
                        </div>
                      )}

                      <video
                        key={currentReview.media[0].url}
                        src={currentReview.media[0].url}
                        className={`w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
                        preload="metadata"
                        onLoadedData={() => setVideoLoaded(true)}
                      />

                      {/* Play Icon Overlay - Only show when video is loaded */}
                      {videoLoaded && (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-all">
                            <motion.div
                              className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-xl"
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Play className="w-8 h-8 text-orange-500 ml-1" />
                            </motion.div>
                          </div>
                          {/* Video Badge */}
                          <div className="absolute top-3 left-3 px-2 py-1 bg-black bg-opacity-70 text-white text-xs font-medium rounded-full flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            Video
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    /* Image with Skeleton Loader */
                    <>
                      {/* Skeleton Loader for Image */}
                      {!imageLoaded && (
                        <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
                      )}

                      <img
                        key={currentReview.media[0].url}
                        src={currentReview.media[0].url}
                        alt="Review media"
                        className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        loading="eager"
                        decoding="async"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageLoaded(true)}
                      />
                    </>
                  )}

                  {/* Category Badge - Only show when media is loaded */}
                  {(imageLoaded || videoLoaded) && (
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
                  )}
                </Link>
              )}
            </>
          )}

          {/* Content Section */}
          <div className="p-4 flex-1 flex flex-col">
            {/* Title */}
            <Link to={`/review/${currentReview._id}`} className="block mb-3">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-2 hover:text-orange-600 transition-colors h-[56px] overflow-hidden">
                <TranslatedReviewContent
                  review={currentReview as any}
                  titleOnly={true}
                />
              </h3>
            </Link>

            {/* Rating */}
            <div className="mb-3">
              {ratingStars}
            </div>

            {/* Description */}
            <div className="text-gray-600 text-sm mb-6 h-[90px] overflow-hidden relative">
              <TranslatedReviewContent
                review={currentReview}
                compact={true}
                maxLength={150}
              />
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
                        onClick={safeReview.author?.userId ? handleAuthorClick : undefined}
                        title={safeReview.author?.userId ? `View ${safeReview.author.name}'s profile` : (safeReview.author?.name || 'Anonymous')}
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
                      {formattedDate}
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-6">
                  <motion.button
                    onClick={handleUpvote}
                    disabled={!currentUser || isUpvoting}
                    className={`flex items-center ${isUpvoting
                      ? 'text-gray-400 cursor-not-allowed'
                      : hasUpvoted
                        ? 'text-green-600'
                        : currentUser
                          ? 'text-gray-600 hover:text-green-600 cursor-pointer'
                          : 'text-gray-400 cursor-not-allowed'
                      } transition-colors`}
                    whileHover={currentUser && !isUpvoting ? { scale: 1.05 } : {}}
                    whileTap={currentUser && !isUpvoting ? { scale: 0.95 } : {}}
                    title={!currentUser ? 'Please log in to like reviews' : isUpvoting ? 'Updating...' : hasUpvoted ? 'Unlike' : 'Like'}
                  >
                    <div className={`w-8 h-8 ${hasUpvoted
                      ? 'bg-gradient-to-r from-green-100 to-green-200'
                      : 'bg-gradient-to-r from-gray-100 to-gray-200'
                      } rounded-full flex items-center justify-center mr-2 transition-colors`}>
                      <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? 'text-green-600 fill-current' : 'text-gray-600'
                        } ${isUpvoting ? 'animate-pulse' : ''}`} />
                    </div>
                    <span className="text-sm font-semibold">{currentReview.upvotes}</span>
                  </motion.button>

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