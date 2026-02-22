import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Flame, AlertTriangle, Trophy, Crown, Medal, Award, Star } from 'lucide-react';
import ReviewCard from '../components/ReviewCard';
import Footer from '../components/Footer';
import { getReviews, getLeaderboard, getMostViewedReviewsWeek } from '../services/api';
import { getCachedData, reviewCache } from '../utils/cache';
import { updateMetaTags } from '../utils/seo';
import { preloadReviewImages } from '../utils/imageCache';
import { useAuth } from '../contexts/AuthContext';

// Type assertions for Lucide icons to fix TypeScript compatibility
const TrendingUpIcon = TrendingUp as React.ComponentType<any>;
const FlameIcon = Flame as React.ComponentType<any>;
const AlertTriangleIcon = AlertTriangle as React.ComponentType<any>;
const TrophyIcon = Trophy as React.ComponentType<any>;
const CrownIcon = Crown as React.ComponentType<any>;
const MedalIcon = Medal as React.ComponentType<any>;
const AwardIcon = Award as React.ComponentType<any>;
const StarIcon = Star as React.ComponentType<any>;

const DiscoveryEngine = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('trending');
  const [reviews, setReviews] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'trending', label: 'Trending', icon: TrendingUpIcon },
    { id: 'weekly-bombs', label: 'Weekly Bombs', icon: FlameIcon },
    { id: 'avoid-this', label: 'Avoid This!', icon: AlertTriangleIcon },
    { id: 'leaderboard', label: 'Leaderboard', icon: TrophyIcon }
  ];

  // Optimized data fetching with caching
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      let reviewsData = [];
      
      switch (activeTab) {
        case 'trending':
          reviewsData = await getCachedData(
            reviewCache,
            'most-viewed-reviews-week',
            () => getMostViewedReviewsWeek()
          );
          break;
        case 'weekly-bombs':
          reviewsData = await getCachedData(
            reviewCache,
            'reviews-brutal-tag',
            () => getReviews({ tag: 'Brutal' }).then(r => r.reviews || [])
          );
          break;
        case 'avoid-this':
          reviewsData = await getCachedData(
            reviewCache,
            'reviews-warning-tag',
            () => getReviews({ tag: 'Warning' }).then(r => r.reviews || [])
          );
          break;
        default:
          reviewsData = await getCachedData(
            reviewCache,
            'reviews-default',
            () => getReviews().then(r => r.reviews || [])
          );
      }
      
      setReviews(reviewsData);
      
      // Preload images for better UX using optimized cache system
      if (reviewsData.length > 0) {
        preloadReviewImages(reviewsData, 6).catch(() => {
          // Ignore preload errors
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const leaderboardData = await getCachedData(
        reviewCache,
        'leaderboard',
        () => getLeaderboard()
      );
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    }
  }, []);

  useEffect(() => {
    // Update SEO meta tags
    updateMetaTags({
      title: 'Discovery Engine - Trending Reviews & Leaderboard | TruView',
      description: 'Discover trending reviews, weekly bombs, warnings, and top reviewers. Explore the most engaging content on TruView.',
      keywords: 'trending reviews, leaderboard, weekly bombs, warnings, top reviewers, discovery',
      canonical: `${window.location.origin}/discovery`
    });

    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    } else {
      fetchReviews();
    }
  }, [activeTab, fetchReviews, fetchLeaderboard]);

  const getTabDescription = () => {
    switch (activeTab) {
      case 'trending':
        return 'All trending reviews in the past 7 days';
      case 'weekly-bombs':
        return 'The most brutal and honest reviews of the week';
      case 'avoid-this':
        return 'Reviews that will save you from making bad decisions';
      case 'leaderboard':
        return 'Top contributors based on reviews, trust score, and community engagement';
      default:
        return '';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <CrownIcon className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <MedalIcon className="w-6 h-6 text-gray-400" />;
      case 3:
        return <AwardIcon className="w-6 h-6 text-orange-500" />;
      default:
        return <span className="w-6 h-6 text-gray-400 font-bold">{rank}</span>;
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Discovery Engine</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the most impactful reviews, trending topics, and top contributors
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
          
          <div className="mt-4">
            <p className="text-gray-600">{getTabDescription()}</p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(activeTab === 'trending' ? 9 : 9)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : activeTab === 'leaderboard' ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Top Contributors</h2>
            </div>
            {leaderboard.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {leaderboard.map((user, index) => (
                  <div
                    key={user._id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleUserClick(user._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getRankIcon(index + 1)}
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-semibold">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 hover:text-orange-600">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {user.reviewCount} reviews • {user.trustScore}% trust score
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <StarIcon className="w-4 h-4 text-orange-500" />
                          <span className="font-medium text-gray-900">{user.trustScore}</span>
                        </div>
                        <p className="text-xs text-gray-500">Trust Score</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No leaderboard data</h3>
                <p className="text-gray-600">
                  Start contributing reviews to appear on the leaderboard!
                </p>
              </div>
            )}
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <ReviewCard 
                key={review._id} 
                review={review} 
                currentUserId={currentUser?.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {React.createElement(tabs.find(t => t.id === activeTab)?.icon || TrendingUpIcon, {
                className: "w-12 h-12 text-gray-400"
              })}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'trending' ? 'No trending reviews yet' : 'No reviews found'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'trending' 
                ? 'Reviews will appear here once they start getting views from the community'
                : 'Be the first to contribute to this section!'
              }
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default DiscoveryEngine;