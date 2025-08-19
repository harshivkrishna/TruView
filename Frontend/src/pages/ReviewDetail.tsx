import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useReviewContext } from '../contexts/ReviewContext';
import { getReview, incrementReviewView, upvoteReview } from '../services/api';
import { toast } from 'react-hot-toast';
import { Star, ThumbsUp, Eye, Share2, Flag, User, Calendar, Tag, ArrowLeft, Award } from 'lucide-react';
import MediaCarousel from '../components/MediaCarousel';
import SocialShareModal from '../components/SocialShareModal';
import { calculateTrustScore, getTrustLevel } from '../utils/trustPrediction';

const ReviewDetail = () => {
  const { currentUser } = useAuth();
  const { updateReview, incrementViewCount } = useReviewContext();
  const navigate = useNavigate();
  const { id } = useParams();
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [viewIncremented, setViewIncremented] = useState(false);

  // Custom styles for media carousel in detail view
  const customStyles = `
    .custom-media-carousel .relative {
      height: 500px !important;
    }
    .custom-media-carousel img,
    .custom-media-carousel video {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      object-position: center center !important;
    }
    .custom-media-carousel .bg-gray-100 {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }
  `;

  const fetchReview = async (reviewId: any) => {
    try {
      const reviewData = await getReview(reviewId);
      setReview(reviewData);
      
      // Store the review in global state for other components to access
      updateReview(reviewId, reviewData);
      
      // Check if current user has upvoted this review
      if (currentUser && reviewData.upvotedBy) {
        const hasUpvoted = reviewData.upvotedBy.some((userId: any) => userId === currentUser.id);
        setHasUpvoted(hasUpvoted);
      }
    } catch (error) {
      console.error('Error fetching review:', error);
    } finally {
      setLoading(false);
    }
  };

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
                  const updatedReview = { ...prev, views: result.views };
                  
                  // Also update the global review state
                  updateReview(prev._id, { views: result.views });
                  
                  return updatedReview;
                }
                return null;
              });
            }
          } else {
            // Fallback: update locally even if API fails
            setReview((prev: any) => {
              if (prev) {
                const newViews = (prev.views || 0) + 1;
                const updatedReview = { ...prev, views: newViews };
                
                // Also update the global review state
                updateReview(prev._id, { views: newViews });
                
                return updatedReview;
              }
              return null;
            });
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

  const handleUpvote = async () => {
    // Check if user is logged in
    if (!currentUser) {
      toast.error('Please log in to like reviews');
      return;
    }

    try {
      if (!id) return;
      const updatedReview = await upvoteReview(id);
      setReview(updatedReview);
      
      // Update upvote state based on the updated review
      if (updatedReview.upvotedBy) {
        const newHasUpvoted = updatedReview.upvotedBy.some((userId: any) => userId === currentUser.id);
        const wasUpvoted = hasUpvoted;
        setHasUpvoted(newHasUpvoted);
        
        // Only show toast if the state actually changed
        if (newHasUpvoted && !wasUpvoted) {
          toast.success('Review liked!');
        } else if (!newHasUpvoted && wasUpvoted) {
          toast.success('Like removed');
        }
      }
    } catch (error: any) {
      console.error('Error upvoting review:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to like reviews');
      } else {
        toast.error('Failed to like review');
      }
    }
  };

  const handleAuthorClick = () => {
    if (review.author?.userId) {
      navigate(`/profile/${review.author.userId}`);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleReport = async (reason: string, description: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reviewId: id,
          reason,
          description
        })
      });
      setShowReportModal(false);
      toast.success('Report submitted successfully');
    } catch (error) {
      console.error('Error reporting review:', error);
      toast.error('Error submitting report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading review...</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Review not found</h2>
          <Link to="/categories" className="text-orange-500 hover:text-orange-600">
            Browse other reviews →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom Styles */}
      <style>{customStyles}</style>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/categories"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Reviews
        </Link>

        {/* Review Content */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Media Section - Completely separated */}
          {review.media && review.media.length > 0 && (
            <div className="bg-gray-50 p-6 pb-8 border-b border-gray-200 relative">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Media Gallery</h3>
                <p className="text-sm text-gray-600">View all media associated with this review</p>
              </div>
              <div className="max-w-4xl mx-auto">
                <div className="custom-media-carousel">
                  <MediaCarousel 
                    files={review.media} 
                    autoPlay={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content Section - Completely separate from media with extra spacing */}
          <div className="p-8 pt-10">
            {/* Tags Section - Clear separation with background and extra top margin */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 mt-4">
              <div className="flex items-center gap-2 flex-wrap">
                {review.tags && review.tags.length > 0 && review.tags.map((tag: any) => (
                  <span
                    key={tag}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      tag === 'Brutal' ? 'bg-red-100 text-red-700' :
                      tag === 'Honest' ? 'bg-blue-100 text-blue-700' :
                      tag === 'Praise' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
                <span className="px-3 py-1.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                  {review.category}
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{review.title}</h1>
            
            {/* Author and Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
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
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {review.views} views
              </div>
            </div>

            {/* Rating and Trust Score */}
            <div className="flex items-center mb-8">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < review.rating ? 'text-orange-500' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600">({review.rating}/5)</span>
              
              {/* Trust Score - Always Visible */}
              {(() => {
                const score = review.trustScore || calculateTrustScore(review);
                const trustLevel = getTrustLevel(score);
                return (
                  <div className={`ml-4 px-3 py-1.5 bg-white shadow-lg border-2 rounded-full ${
                    trustLevel.level === 'High' ? 'border-green-500' :
                    trustLevel.level === 'Good' ? 'border-blue-500' :
                    trustLevel.level === 'Fair' ? 'border-yellow-500' :
                    trustLevel.level === 'Low' ? 'border-orange-500' :
                    'border-red-500'
                  }`}>
                <div className="flex items-center gap-1.5">
                      <Award className={`w-4 h-4 ${
                        trustLevel.level === 'High' ? 'text-green-600' :
                        trustLevel.level === 'Good' ? 'text-blue-600' :
                        trustLevel.level === 'Fair' ? 'text-yellow-600' :
                        trustLevel.level === 'Low' ? 'text-orange-600' :
                        'text-red-600'
                      }`} />
                      <span className={`text-sm font-bold font-mono ${
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
              })()}
            </div>

            {/* Description */}
            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                {review.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between border-t pt-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleUpvote}
                  disabled={!currentUser}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    hasUpvoted 
                      ? 'text-orange-500 bg-orange-50' 
                      : currentUser 
                        ? 'text-gray-600 hover:text-orange-500 hover:bg-orange-50' 
                        : 'text-gray-400 cursor-not-allowed'
                  }`}
                  title={!currentUser ? 'Please log in to like reviews' : ''}
                >
                  <ThumbsUp className={`w-5 h-5 ${hasUpvoted ? 'fill-current' : ''}`} />
                  <span>{review.upvotes || 0}</span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
                
                {currentUser && (
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Flag className="w-5 h-5" />
                    Report
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              placeholder="Provide more details about why you're reporting this review..."
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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