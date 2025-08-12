import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, Eye, Calendar, User, Share2, Award, TrendingUp } from 'lucide-react';
import SocialShareModal from './SocialShareModal';
import MediaCarousel from './MediaCarousel';
import { calculateTrustScore, getTrustLevel } from '../utils/trustPrediction';
import { useReviewContext } from '../contexts/ReviewContext';

interface ReviewCardProps {
  review: {
    _id: string;
    title: string;
    description: string;
    category: string;
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
  };
  showRank?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, showRank = false }) => {
  const navigate = useNavigate();
  const [showShareModal, setShowShareModal] = useState(false);
  const { getReview } = useReviewContext();

  // Get the most up-to-date review data from global state
  const currentReview = getReview(review._id) || review;

  // Calculate AI trust score if not provided
  const trustScore = currentReview.trustScore || calculateTrustScore(currentReview);
  const trustLevel = getTrustLevel(trustScore);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentReview.author?.userId) {
      navigate(`/profile/${currentReview.author.userId}`);
    }
  };

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
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden h-full flex flex-col border border-white/20 relative group">
          {/* Hover Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
          
          {/* Trust Score Badge */}
          <div className="absolute top-4 right-4 z-20">
            <motion.div
              whileHover={{ scale: 1.1, rotateY: 180 }}
              transition={{ duration: 0.4 }}
              className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-white/30 shadow-lg ${trustLevel.color}`}
            >
              <div className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                {trustScore}%
              </div>
            </motion.div>
          </div>

          {/* Media Preview with Overlay */}
          {currentReview.media && currentReview.media.length > 0 && (
            <div className="relative h-48 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
              <MediaCarousel files={currentReview.media.slice(0, 1)} />
              
              {/* Category Badge on Media */}
              <div className="absolute bottom-4 left-4 z-20">
                <div className={`px-3 py-1 bg-gradient-to-r ${getCategoryGradient(currentReview.category)} rounded-full text-white text-xs font-semibold shadow-lg backdrop-blur-sm`}>
                  {currentReview.category}
                </div>
              </div>
            </div>
          )}
          
          <div className="p-6 flex-1 flex flex-col relative z-10">
            {/* Tags */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {currentReview.tags.slice(0, 2).map((tag, index) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${getTagStyle(tag)} shadow-lg`}
                >
                  {tag}
                </motion.span>
              ))}
              {!currentReview.media && (
                <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${getCategoryGradient(currentReview.category)} text-white shadow-lg ml-auto`}>
                  {currentReview.category}
                </span>
              )}
            </div>

            {/* Title */}
            <Link to={`/review/${currentReview._id}`} className="block mb-4">
              <motion.h3 
                className="text-xl font-bold text-gray-900 line-clamp-2 hover:text-orange-600 transition-colors duration-300"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                {currentReview.title}
              </motion.h3>
            </Link>

            {/* Rating */}
            <div className="flex items-center mb-4">
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
            <p className="text-gray-600 text-sm mb-6 line-clamp-3 flex-1 leading-relaxed">
              {truncateText(currentReview.description, 140)}
            </p>

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
                        className={`w-10 h-10 rounded-full object-cover border-2 border-white shadow-lg ${currentReview.author?.userId ? 'cursor-pointer group-hover/profile:border-orange-300' : ''}`}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                        onClick={currentReview.author?.userId ? handleAuthorClick : undefined}
                        title={currentReview.author?.userId ? `View ${currentReview.author.name}'s profile` : currentReview.author.name}
                        onError={(e) => {
                          // Fallback to default avatar if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <motion.div
                      className={`w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg ${currentReview.author?.avatar ? 'hidden' : ''} ${currentReview.author?.userId ? 'cursor-pointer group-hover/profile:from-orange-600 group-hover/profile:to-red-600' : ''}`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                      onClick={currentReview.author?.userId ? handleAuthorClick : undefined}
                      title={currentReview.author?.userId ? `View ${currentReview.author?.name}'s profile` : currentReview.author?.name || 'Anonymous'}
                    >
                      <User className="w-5 h-5 text-white" />
                    </motion.div>
                    
                    {/* Online/Trust indicator */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
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
};

export default ReviewCard;