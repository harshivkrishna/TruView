import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Review {
  _id: string;
  title: string;
  description: string;
  rating: number;
  category: string;
  subcategory?: string;
  tags: string[];
  author: {
    name: string;
    avatar?: string;
    userId: string;
  };
  upvotes: number;
  upvotedBy: string[];
  views: number;
  viewedBy: any[];
  media: any[];
  trustScore: number;
  isRemovedByAdmin?: boolean;
  adminRemovalReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewContextType {
  reviews: { [key: string]: Review };
  updateReview: (reviewId: string, updatedReview: Partial<Review>) => void;
  getReview: (reviewId: string) => Review | null;
  hasUserViewed: (reviewId: string, userId: string) => boolean;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const useReviewContext = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviewContext must be used within a ReviewProvider');
  }
  return context;
};

interface ReviewProviderProps {
  children: ReactNode;
}

export const ReviewProvider: React.FC<ReviewProviderProps> = ({ children }) => {
  const [reviews, setReviews] = useState<{ [key: string]: Review }>({});

  const updateReview = (reviewId: string, updatedReview: Partial<Review>) => {
    setReviews(prev => ({
      ...prev,
      [reviewId]: {
        ...prev[reviewId],
        ...updatedReview
      }
    }));
  };

  const incrementViewCount = (reviewId: string) => {
    setReviews(prev => {
      const currentReview = prev[reviewId];
      if (currentReview) {
        return {
          ...prev,
          [reviewId]: {
            ...currentReview,
            views: (currentReview.views || 0) + 1
          }
        };
      }
      return prev;
    });
  };

  const getReview = (reviewId: string) => {
    return reviews[reviewId] || null;
  };

  const hasUserViewed = (reviewId: string, userId: string) => {
    const review = reviews[reviewId];
    if (!review || !review.viewedBy) return false;
    
    return review.viewedBy.some((view: any) => 
      view.userId.toString() === userId.toString()
    );
  };

  const value: ReviewContextType = {
    reviews,
    updateReview,
    incrementViewCount,
    getReview,
    hasUserViewed
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
}; 