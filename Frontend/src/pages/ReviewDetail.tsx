import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useReviewContext } from '../contexts/ReviewContext';
import type { Review } from '../contexts/ReviewContext';
import { getReview, incrementReviewView, upvoteReview } from '../services/api';
import { toast } from 'react-hot-toast';
import { ThumbsUp, Eye, Share2, Flag, User, Calendar, ArrowLeft, Award, Shield, AlertTriangle } from 'lucide-react';
import MediaCarousel from '../components/MediaCarousel';
import SocialShareModal from '../components/SocialShareModal';
import LoginModal from '../components/auth/LoginModal';
import { calculateTrustScore, getTrustLevel } from '../utils/trustPrediction';
import { updateMetaTags, generateReviewStructuredData, addStructuredData } from '../utils/seo';
import { getCachedData, reviewCache } from '../utils/cache';
import { preloadImage } from '../utils/imageOptimization';

const ReviewDetail = () => {
  const { currentUser } = useAuth();
  const { updateReview } = useReviewContext();
  const navigate = useNavigate();
  const { id } = useParams();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [viewIncremented, setViewIncremented] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Mobile-first responsive styles for media carousel
  const customStyles = `
    .custom-media-carousel {
      width: 100% !important;
      max-width: 100vw !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    .custom-media-carousel .relative {
      height: 300px !important;
      width: 100% !important;
      max-width: 100vw !important;
      border-radius: 0 !important;
    }
    
    @media (min-width: 640px) {
      .custom-media-carousel .relative {
        height: 400px !important;
        border-radius: 0.5rem !important;
      }
    }
    
    @media (min-width: 768px) {
      .custom-media-carousel .relative {
        height: 450px !important;
      }
    }
    
    @media (min-width: 1024px) {
      .custom-media-carousel .relative {
        height: 500px !important;
      }
    }
    
    .custom-media-carousel img,
    .custom-media-carousel video {
      width: 100% !important;
      height: 100% !important;
      max-width: 100vw !important;
      object-fit: cover !important;
      object-position: center center !important;
    }
    
    .custom-media-carousel .bg-gray-100 {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }
    
    /* Force media section to have proper spacing */
    .media-section {
      margin-bottom: 2rem !important;
      padding-bottom: 1.5rem !important;
      border-bottom: 1px solid #e5e7eb !important;
      position: relative !important;
      z-index: 1 !important;
    }
    
    /* Force tags section to have proper spacing */
    .tags-section {
      margin-top: 1rem !important;
      margin-bottom: 2rem !important;
      position: relative !important;
      z-index: 2 !important;
      clear: both !important;
    }
    
    /* Force trust score to not take full width */
    .trust-score {
      width: fit-content !important;
      max-width: none !important;
      flex-shrink: 0 !important;
      display: inline-flex !important;
      margin-left: 0 !important;
      margin-top: 0 !important;
      align-self: flex-start !important;
      align-items: center !important;
    }
    
    /* Rating and trust score container */
    .rating-trust-container {
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 0.75rem !important;
    }
    
    @media (min-width: 640px) {
      .rating-trust-container {
        flex-direction: row !important;
        align-items: center !important;
        gap: 1rem !important;
      }
      
      .trust-score {
        margin-left: 1rem !important;
        margin-top: 0 !important;
      }
    }
    
    /* Force action buttons to be in a row */
    .action-buttons {
      display: flex !important;
      flex-direction: row !important;
      flex-wrap: nowrap !important;
      justify-content: space-between !important;
      align-items: center !important;
      gap: 0.5rem !important;
      width: 100% !important;
    }
    
    .action-buttons button {
      flex: 0 1 auto !important;
      min-width: 0 !important;
      max-width: none !important;
      white-space: nowrap !important;
      min-height: 44px !important;
      padding: 0.5rem 0.75rem !important;
      width: auto !important;
    }
    
    /* Mobile-specific improvements */
    @media (max-width: 640px) {
      .review-content {
        padding: 1rem !important;
      }
      
      .review-title {
        font-size: 1.5rem !important;
        line-height: 1.3 !important;
      }
      
      .review-description {
        font-size: 1rem !important;
        line-height: 1.6 !important;
      }
      
      /* Ensure images don't overflow on mobile */
      .custom-media-carousel img,
      .custom-media-carousel video {
        max-width: 100vw !important;
        max-height: 100vh !important;
        object-fit: cover !important;
      }
      
      /* Mobile touch optimizations */
      .custom-media-carousel .relative {
        touch-action: pan-y pinch-zoom !important;
      }
      
      /* Mobile spacing adjustments */
      .review-content > * {
        margin-bottom: 1rem !important;
      }
      
      .review-content > *:last-child {
        margin-bottom: 0 !important;
      }
      
      /* Force media section spacing on mobile */
      .media-section {
        margin-bottom: 2rem !important;
        padding-bottom: 1.5rem !important;
      }
      
      /* Force tags section spacing on mobile */
      .tags-section {
        margin-top: 1rem !important;
        margin-bottom: 2rem !important;
      }
      
      /* Force trust score sizing on mobile */
      .trust-score {
        width: fit-content !important;
        max-width: none !important;
        flex-shrink: 0 !important;
        align-self: flex-start !important;
        margin-top: 0 !important;
        margin-left: 0 !important;
      }
      
      /* Rating and trust score container on mobile */
      .rating-trust-container {
        align-items: flex-start !important;
        gap: 0.75rem !important;
      }
      
      /* Force action buttons layout on mobile */
      .action-buttons {
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        justify-content: flex-start !important;
        gap: 0.5rem !important;
      }
      
      .action-buttons button {
        flex: 0 1 auto !important;
        min-width: 0 !important;
        max-width: none !important;
        width: auto !important;
      }
    }
    
    /* Additional mobile optimizations */
    @media (max-width: 480px) {
      .custom-media-carousel .relative {
        height: 250px !important;
      }
      
      .review-title {
        font-size: 1.25rem !important;
      }
      
      .review-description {
        font-size: 0.95rem !important;
      }
      
      .tags-container span {
        font-size: 0.75rem !important;
        padding: 0.25rem 0.5rem !important;
      }
      
      .action-buttons {
        gap: 0.25rem !important;
      }
      
      .action-buttons button {
        padding: 0.5rem !important;
        font-size: 0.875rem !important;
        flex: 0 1 auto !important;
        width: auto !important;
      }
      
      .action-buttons button span {
        font-size: 0.75rem !important;
      }
    }
    
    /* Landscape mobile optimizations */
    @media (max-width: 768px) and (orientation: landscape) {
      .custom-media-carousel .relative {
        height: 200px !important;
      }
      
      .review-content {
        padding: 0.75rem !important;
      }
    }
    
    /* High DPI mobile devices */
    @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
      .custom-media-carousel img {
        image-rendering: -webkit-optimize-contrast !important;
        image-rendering: crisp-edges !important;
      }
    }
  `;

  const fetchReview = useCallback(async (reviewId: string) => {
    try {
      // Try to get from cache first
      const reviewData = await getCachedData(
        reviewCache,
        `review-${reviewId}`,
        () => getReview(reviewId)
      );
      
      setReview(reviewData);
      
      // Store the review in global state for other components to access
      updateReview(reviewId, reviewData);
      
      // Check if current user has upvoted this review
      if (currentUser && reviewData.upvotedBy) {
        const hasUpvoted = reviewData.upvotedBy.some((userId: any) => userId === currentUser.id);
        setHasUpvoted(hasUpvoted);
      }

      // Update SEO meta tags
      updateMetaTags({
        title: `${reviewData.title} - Review by ${reviewData.author?.name || 'Anonymous'}`,
        description: reviewData.description.substring(0, 160),
        keywords: reviewData.tags?.join(', ') || reviewData.category,
        author: reviewData.author?.name || 'Anonymous',
        publishedTime: reviewData.createdAt,
        tags: reviewData.tags || [],
        canonical: `${window.location.origin}/review/${reviewId}`
      });

      // Add structured data
      const structuredData = generateReviewStructuredData(reviewData);
      addStructuredData(structuredData);

      // Preload images for better UX
      if (reviewData.media && reviewData.media.length > 0) {
        reviewData.media.slice(0, 3).forEach((media: any) => {
          if (media.type === 'image') {
            preloadImage(media.url).catch(() => {
              // Ignore preload errors
            });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching review:', error);
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, [currentUser, updateReview]);

  useEffect(() => {
    if (id) {
      // Scroll to top when component mounts
      window.scrollTo(0, 0);
      
      fetchReview(id);
      
      // Increment view count when review page is visited
      const incrementView = async () => {
        // Prevent duplicate view increments
        if (viewIncremented) {
          return;
        }

        try {
          const result = await incrementReviewView(id);
          
          // Mark as incremented regardless of API result
          setViewIncremented(true);
          
          if (result) {
            // Only update view count if it's a new view
            if (result.newView) {
              // Update the local review state to reflect the new view count
              setReview((prev: any) => {
                if (prev) {
                  return { ...prev, views: result.views };
                }
                return null;
              });
              
              // Update the global review state outside of setState
              if (review) {
                updateReview(review._id, { views: result.views });
              }
            }
          } else {
            // Fallback: update locally even if API fails
            setReview((prev: any) => {
              if (prev) {
                const newViews = (prev.views || 0) + 1;
                return { ...prev, views: newViews };
              }
              return null;
            });
            
            // Update the global review state outside of setState
            if (review) {
              const newViews = (review.views || 0) + 1;
              updateReview(review._id, { views: newViews });
            }
          }
        } catch (error) {
          // Don't increment view count on error to maintain consistency
          // Just mark as attempted to prevent repeated API calls
          setViewIncremented(true);
        }
      };
      
      // Small delay to ensure the review is loaded first
      setTimeout(incrementView, 100);
    }
  }, [id]);

  const handleUpvote = useCallback(async () => {
    // Check if user is logged in
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    // Prevent multiple clicks while upvoting
    if (isUpvoting) {
      return;
    }

    setIsUpvoting(true);
    
    // Store previous values for potential rollback
    const previousUpvotes = review?.upvotes || 0;
    const previousHasUpvoted = hasUpvoted;
    
    try {
      if (!id) return;
      
      // Update UI immediately
      setReview(prev => prev ? {
        ...prev,
        upvotes: previousHasUpvoted ? previousUpvotes - 1 : previousUpvotes + 1,
        upvotedBy: previousHasUpvoted 
          ? prev.upvotedBy?.filter((userId: string) => userId !== currentUser.id) || []
          : [...(prev.upvotedBy || []), currentUser.id]
      } : null);
      
      setHasUpvoted(!previousHasUpvoted);
      
      // Make API call
      const updatedReview = await upvoteReview(id);
      
      // Update with actual response
      setReview(updatedReview);
      
      // Update upvote state based on the updated review
      if (updatedReview.upvotedBy) {
        const newHasUpvoted = updatedReview.upvotedBy.some((userId: any) => userId === currentUser.id);
        setHasUpvoted(newHasUpvoted);
        
        // Only show toast if the state actually changed
        if (newHasUpvoted && !previousHasUpvoted) {
          toast.success('Review liked!');
        } else if (!newHasUpvoted && previousHasUpvoted) {
          toast.success('Like removed');
        }
      }
      
      // Update global state
      updateReview(id, updatedReview);
      
      // Update cache
      reviewCache.set(`review-${id}`, updatedReview);
    } catch (error: any) {
      // Revert optimistic update on error
      setReview(prev => prev ? {
        ...prev,
        upvotes: previousUpvotes,
        upvotedBy: previousHasUpvoted 
          ? [...(prev.upvotedBy || []), currentUser.id]
          : prev.upvotedBy?.filter((userId: any) => userId !== currentUser.id) || []
      } : null);
      setHasUpvoted(previousHasUpvoted);
      
      if (error.response?.status === 401) {
        setShowLoginModal(true);
      } else if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || 'You cannot upvote this review');
      } else {
        toast.error('Failed to like review');
      }
    } finally {
      setIsUpvoting(false);
    }
  }, [currentUser, isUpvoting, id, review, hasUpvoted, updateReview]);

  const handleAuthorClick = useCallback(() => {
    if (review?.author?.userId) {
      navigate(`/profile/${review.author.userId}`);
    }
  }, [review?.author?.userId, navigate]);

  const handleShare = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const handleReport = useCallback(async (reason: string, description: string) => {
    try {
      if (!id) {
        toast.error('Review ID not found');
        return;
      }
      const { createReport } = await import('../services/api');
      await createReport({
        reviewId: id,
        reason,
        description
      });
      setShowReportModal(false);
      toast.success('Report submitted successfully');
    } catch (error) {
      toast.error('Error submitting report');
    }
  }, [id]);

  // Memoized trust score component
  const TrustScore = useMemo(() => {
    if (!review) return null;
    
    const score = review.trustScore || calculateTrustScore(review);
    const trustLevel = getTrustLevel(score);
    
    return (
      <div className={`trust-score flex items-center sm:ml-4 px-2 sm:px-3 py-1.5 bg-white shadow-lg border-2 rounded-full ${
        trustLevel.level === 'High' ? 'border-green-500' :
        trustLevel.level === 'Good' ? 'border-blue-500' :
        trustLevel.level === 'Fair' ? 'border-yellow-500' :
        trustLevel.level === 'Low' ? 'border-orange-500' :
        'border-red-500'
      }`}>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Award className={`w-3 h-3 sm:w-4 sm:h-4 ${
            trustLevel.level === 'High' ? 'text-green-600' :
            trustLevel.level === 'Good' ? 'text-blue-600' :
            trustLevel.level === 'Fair' ? 'text-yellow-600' :
            trustLevel.level === 'Low' ? 'text-orange-600' :
            'text-red-600'
          }`} />
          <span className={`text-xs sm:text-sm font-bold font-mono ${
            trustLevel.level === 'High' ? 'text-green-700' :
            trustLevel.level === 'Good' ? 'text-blue-700' :
            trustLevel.level === 'Fair' ? 'text-yellow-700' :
            trustLevel.level === 'Low' ? 'text-orange-700' :
            'text-red-700'
          }`}>
            {score}%
          </span>
        </div>
      </div>
    );
  }, [review]);

  // Memoized rating component
  const RatingStars = useMemo(() => {
    if (!review) return null;
    
    return (
      <div className="flex items-center">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-4 h-4 sm:w-5 sm:h-5 ${i < review.rating ? 'text-orange-500' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="ml-2 text-xs sm:text-sm text-gray-600">({review.rating}/5)</span>
      </div>
    );
  }, [review]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading review...</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Review not found</h2>
          <Link to="/categories" className="text-orange-500 hover:text-orange-600 text-sm sm:text-base">
            Browse other reviews →
          </Link>
        </div>
      </div>
    );
  }

  // Check if review is removed by admin and current user is not the original author
  const isRemovedByAdmin = review.isRemovedByAdmin;
  const isOriginalAuthor = currentUser && review.author?.userId === currentUser.id;

  // If review is removed by admin and current user is not the original author, show removal notice
  if (isRemovedByAdmin && !isOriginalAuthor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6 md:py-8">
          {/* Back Button */}
          <Link
            to="/categories"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-6 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-5 h-5 mr-2" />
            <span className="hidden sm:inline">Back to Reviews</span>
            <span className="sm:hidden">Back</span>
          </Link>

          {/* Review Removed Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-red-300 bg-red-50" style={{ minHeight: '600px' }}>
            {/* Admin Removal Notice Header */}
            <div className="bg-red-100 border-b-2 border-red-300 p-6">
              <div className="flex items-center gap-3 text-red-800 mb-3">
                <Shield className="w-6 h-6" />
                <span className="text-xl font-semibold">Review Removed by Admin</span>
                <div className="ml-auto px-3 py-1.5 bg-white shadow-lg border-2 border-red-500 rounded-full">
                  <span className="text-sm font-bold text-red-700">65%</span>
                </div>
              </div>
              <p className="text-red-700 text-base">
                {review.adminRemovalReason || 'This review has been removed by an administrator due to policy violations.'}
              </p>
              <p className="text-sm text-red-600 mt-3">
                This review is not available for public viewing.
              </p>
            </div>

            {/* Content Area with Warning */}
            <div className="p-6 flex-1 flex flex-col justify-center items-center text-center" style={{ minHeight: '400px' }}>
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-md w-full">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-800 mb-3">Content Not Available</h3>
                <p className="text-red-700 mb-6">
                  This review has been removed by our moderation team and is no longer available for viewing.
                </p>
                <div className="space-y-3">
                  <Link
                    to="/categories"
                    className="block w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Browse Other Reviews
                  </Link>
                  <Link
                    to="/help"
                    className="block w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Learn About Our Policies
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom Styles */}
      <style>{customStyles}</style>
      
      <div className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6 md:py-8">
        {/* Back Button */}
        <Link
          to="/categories"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-6 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-5 h-5 mr-2" />
          <span className="hidden sm:inline">Back to Reviews</span>
          <span className="sm:hidden">Back</span>
        </Link>

        {/* Review Content */}
        <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${isRemovedByAdmin && isOriginalAuthor ? 'border-2 border-red-300 bg-red-50' : ''}`}>
          
          {/* Admin Removal Notice - Only visible to original author */}
          {isRemovedByAdmin && isOriginalAuthor && (
            <div className="bg-red-100 border-b-2 border-red-300 p-4">
              <div className="flex items-center gap-2 text-red-800">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Review Removed by Admin</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {review.adminRemovalReason || 'This review has been removed by an administrator due to policy violations.'}
              </p>
              <p className="text-xs text-red-600 mt-2">
                This review is only visible to you. Other users cannot see this content.
              </p>
            </div>
          )}
          {/* Media Section - Full width on mobile */}
          {review.media && review.media.length > 0 && (
            <div className="media-section bg-gray-50 p-2 sm:p-4 md:p-6 pb-3 sm:pb-6 md:pb-8 border-b border-gray-200 relative">
              <div className="mb-2 sm:mb-4">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Media Gallery</h3>
                <p className="text-xs sm:text-sm text-gray-600">View all media associated with this review</p>
              </div>
              <div className="w-full max-w-full">
                <div className="custom-media-carousel">
                  <MediaCarousel 
                    files={review.media} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content Section - Mobile optimized padding */}
          <div className="review-content p-3 sm:p-6 md:p-8 pt-4 sm:pt-8 md:pt-10">
            
            {/* Tags Section - Mobile optimized */}
            <div className="tags-section bg-gray-50 p-2 sm:p-4 rounded-lg mb-3 sm:mb-6 mt-2 sm:mt-4">
              <div className="tags-container flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {review.tags && review.tags.length > 0 && review.tags.map((tag: any) => (
                  <span
                    key={tag}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-full ${
                      tag === 'Brutal' ? 'bg-red-100 text-red-700' :
                      tag === 'Honest' ? 'bg-blue-100 text-blue-700' :
                      tag === 'Praise' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
                <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                  {review.category}
                </span>
              </div>
            </div>

            {/* Title - Mobile responsive */}
            <h1 className="review-title text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-6 leading-tight">{review.title}</h1>
            
            {/* Author and Metadata - Mobile optimized */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-6">
              <div className="flex items-center">
                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {review.author?.userId ? (
                  <button
                    onClick={handleAuthorClick}
                    className="hover:text-orange-600 hover:underline transition-colors cursor-pointer"
                    title="View profile"
                  >
                    {review.author.name || 'Anonymous'}
                  </button>
                ) : (
                  <span>{review.author?.name || 'Anonymous'}</span>
                )}
              </div>
              <div className="flex items-center">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {review.views} views
              </div>
            </div>

            {/* Rating and Trust Score - Mobile responsive */}
            <div className="rating-trust-container flex flex-col sm:flex-row sm:items-center mb-6 sm:mb-8 gap-3 sm:gap-0">
              {RatingStars}
              {TrustScore}
            </div>

            {/* Description - Mobile responsive */}
            <div className="prose max-w-none mb-6 sm:mb-8">
              <p className="review-description text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                {review.description}
              </p>
            </div>

            {/* Action Buttons - Mobile responsive */}
            <div className="flex items-center justify-between border-t pt-4 sm:pt-6">
              <div className="action-buttons flex items-center gap-2 sm:gap-4 w-full justify-between">
                <button
                  onClick={handleUpvote}
                  disabled={!currentUser || isUpvoting}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                    isUpvoting
                      ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                      : hasUpvoted 
                        ? 'text-orange-500 bg-orange-50' 
                        : currentUser 
                          ? 'text-gray-600 hover:text-orange-500 hover:bg-orange-50' 
                          : 'text-gray-400 cursor-not-allowed'
                  }`}
                  title={!currentUser ? 'Please log in to like reviews' : isUpvoting ? 'Updating...' : ''}
                >
                  <ThumbsUp className={`w-4 h-4 sm:w-5 sm:h-5 ${hasUpvoted ? 'fill-current' : ''} ${isUpvoting ? 'animate-pulse' : ''}`} />
                  <span>{review.upvotes || 0}</span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors text-sm sm:text-base"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
                
                {currentUser && (
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm sm:text-base"
                  >
                    <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Report</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Share Modal */}
      {showShareModal && review && (
        <SocialShareModal
          review={review}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          onSubmit={handleReport}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            // Could add register modal here if needed
          }}
          onSwitchToForgotPassword={() => {
            setShowLoginModal(false);
            // Could add forgot password modal here if needed
          }}
        />
      )}
    </div>
  );
};

const ReportModal: React.FC<{
  onSubmit: (reason: string, description: string) => void;
  onClose: () => void;
}> = ({ onSubmit, onClose }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const reasons = [
    'Inappropriate Content',
    'Spam',
    'Fake Review',
    'Offensive Language',
    'Copyright Violation',
    'Other'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason) {
      onSubmit(reason, description);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <Flag className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">Report Review</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for reporting
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
              required
            >
              <option value="">Select a reason</option>
              {reasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
              rows={3}
              placeholder="Provide more details about why you're reporting this review..."
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:flex-1 px-4 py-3 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm sm:text-base"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewDetail;