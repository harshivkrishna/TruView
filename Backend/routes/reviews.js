const express = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const { authenticateToken } = require('../middleware/auth');
const { calculateTrustScore } = require('../utils/trustCalculator');
const router = express.Router();

// Check if AWS is configured
const isAWSConfigured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET;

// No URL conversion needed - URLs should already be CloudFront URLs from upload

// Get all reviews
router.get('/', async (req, res) => {
  try {
    // Check MongoDB connection state
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. State:', mongoose.connection.readyState);
      return res.status(503).json({ 
        message: 'Database temporarily unavailable. Please try again.',
        reviews: [],
        pagination: { currentPage: 1, totalPages: 0, totalReviews: 0, hasNextPage: false, hasPrevPage: false }
      });
    }

    const { category, subcategory, tag, sort = 'createdAt', page = 1, limit = 15 } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (tag) query.tags = { $in: [tag] };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [reviews, totalCount] = await Promise.all([
      Review.find(query)
        .populate({
          path: 'author.userId',
          select: 'firstName lastName avatar',
          options: { strictPopulate: false }
        })
        .select('title description rating category subcategory tags author upvotes views trustScore createdAt updatedAt media')
        .sort({ [sort]: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean()
        .exec(),
      Review.countDocuments(query).exec()
    ]);
    
    // Map the populated data to match the expected format with null safety
    const formattedReviews = reviews.map(review => {
      const reviewObj = { ...review };
      
      // Safely handle author population
      if (reviewObj.author && reviewObj.author.userId) {
        const userId = reviewObj.author.userId;
        
        // Check if userId was populated successfully
        if (userId && typeof userId === 'object' && userId.firstName) {
          reviewObj.author.name = `${userId.firstName} ${userId.lastName}`;
          reviewObj.author.avatar = userId.avatar;
          reviewObj.author.userId = userId._id;
        } else {
          // Handle case where user was deleted or not found
          reviewObj.author.name = 'Anonymous';
          reviewObj.author.avatar = null;
          reviewObj.author.userId = null;
        }
      } else {
        // Handle missing author
        reviewObj.author = {
          name: 'Anonymous',
          avatar: null,
          userId: null
        };
      }
      
      // URLs should already be CloudFront URLs from upload
      return reviewObj;
    });
    
    console.log(`Fetched ${formattedReviews.length} reviews out of ${totalCount} total`);
    
    res.json({
      reviews: formattedReviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalReviews: totalCount,
        hasNextPage: parseInt(page) < Math.ceil(totalCount / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    console.error('Error stack:', error.stack);
    
    // Return empty result instead of error to prevent UI breaks
    res.status(200).json({
      reviews: [],
      pagination: { currentPage: 1, totalPages: 0, totalReviews: 0, hasNextPage: false, hasPrevPage: false }
    });
  }
});

// Get trending reviews (most viewed)
router.get('/trending', async (req, res) => {
  try {
    // Check MongoDB connection state
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. State:', mongoose.connection.readyState);
      return res.status(503).json({ 
        message: 'Database temporarily unavailable. Please try again.',
        reviews: [] 
      });
    }

    // Fetch reviews with proper error handling
    const reviews = await Review.find()
      .populate({
        path: 'author.userId',
        select: 'firstName lastName avatar',
        options: { strictPopulate: false }
      })
      .select('title description rating category subcategory tags author upvotes views trustScore createdAt updatedAt media')
      .sort({ views: -1, upvotes: -1, createdAt: -1 })
      .limit(10)
      .lean()
      .exec();
    
    // Handle empty results
    if (!reviews || reviews.length === 0) {
      console.log('No trending reviews found');
      return res.json([]);
    }

    // Map the populated data to match the expected format with null safety
    const formattedReviews = reviews.map(review => {
      const reviewObj = { ...review };
      
      // Safely handle author population
      if (reviewObj.author && reviewObj.author.userId) {
        const userId = reviewObj.author.userId;
        
        // Check if userId was populated successfully
        if (userId && typeof userId === 'object' && userId.firstName) {
          reviewObj.author.name = `${userId.firstName} ${userId.lastName}`;
          reviewObj.author.avatar = userId.avatar;
          reviewObj.author.userId = userId._id;
        } else {
          // Handle case where user was deleted or not found
          reviewObj.author.name = 'Anonymous';
          reviewObj.author.avatar = null;
          reviewObj.author.userId = null;
        }
      } else {
        // Handle missing author
        reviewObj.author = {
          name: 'Anonymous',
          avatar: null,
          userId: null
        };
      }
      
      return reviewObj;
    });
    
    console.log(`Successfully fetched ${formattedReviews.length} trending reviews`);
    res.json(formattedReviews);
  } catch (error) {
    console.error('Error fetching trending reviews:', error);
    console.error('Error stack:', error.stack);
    
    // Return empty array instead of error to prevent UI breaks
    res.status(200).json([]);
  }
});

// Get most viewed reviews in past 7 days
router.get('/most-viewed-week', async (req, res) => {
  try {
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Find reviews that have been viewed in the past 7 days
    const reviews = await Review.aggregate([
      {
        $match: {
          'viewedBy.viewedAt': { $gte: sevenDaysAgo }
        }
      },
      {
        $addFields: {
          // Count views in the past 7 days
          recentViews: {
            $size: {
              $filter: {
                input: '$viewedBy',
                cond: { $gte: ['$$this.viewedAt', sevenDaysAgo] }
              }
            }
          }
        }
      },
      {
        $sort: { recentViews: -1, upvotes: -1, createdAt: -1 }
      },
      {
        $limit: 3
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author.userId',
          foreignField: '_id',
          as: 'authorInfo'
        }
      },
      {
        $unwind: {
          path: '$authorInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          'author.name': {
            $concat: ['$authorInfo.firstName', ' ', '$authorInfo.lastName']
          },
          'author.avatar': '$authorInfo.avatar',
          'author.userId': '$authorInfo._id'
        }
      },
      {
        $project: {
          authorInfo: 0
        }
      }
    ]);
    
    res.json(reviews);
  } catch (error) {
    // console.error('Error fetching most viewed reviews:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single review - Optimized version
router.get('/:id', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected during review fetch');
      return res.status(503).json({ 
        message: 'Service temporarily unavailable. Please try again.',
        review: null 
      });
    }

    const reviewId = req.params.id;
    
    // Fetch review with optimized query
    const review = await Review.findById(reviewId)
      .populate({
        path: 'author.userId',
        select: 'firstName lastName avatar',
        options: { strictPopulate: false }
      })
      .select('title description rating category subcategory tags author upvotes views trustScore createdAt updatedAt media upvotedBy')
      .lean()
      .exec();
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Format the review data with null safety
    const reviewObj = { ...review };
    
    // Safely handle author population
    if (reviewObj.author && reviewObj.author.userId) {
      const userId = reviewObj.author.userId;
      
      // Check if userId was populated successfully
      if (userId && typeof userId === 'object' && userId.firstName) {
        reviewObj.author.name = `${userId.firstName} ${userId.lastName}`;
        reviewObj.author.avatar = userId.avatar;
        reviewObj.author.userId = userId._id;
      } else {
        // Handle case where user was deleted or not found
        reviewObj.author.name = 'Anonymous';
        reviewObj.author.avatar = null;
        reviewObj.author.userId = null;
      }
    } else {
      // Handle missing author
      reviewObj.author = {
        name: 'Anonymous',
        avatar: null,
        userId: null
      };
    }

    // Add view count asynchronously (don't wait for it)
    const userId = req.user?.userId;
    if (userId) {
      // Use updateOne for better performance instead of save()
      Review.updateOne(
        { _id: reviewId },
        { 
          $inc: { views: 1 },
          $addToSet: { viewedBy: userId }
        }
      ).exec().catch(err => console.error('Failed to increment view count:', err));
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Review ${reviewId} fetched in ${totalTime}ms`);
    
    // URLs should already be CloudFront URLs from upload
    res.json(reviewObj);
  } catch (error) {
    console.error('Error fetching review:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Failed to fetch review' });
  }
});

// Create new review
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Fetch user information to get avatar
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    
    const reviewData = {
      ...req.body,
      author: {
        name: user ? `${user.firstName} ${user.lastName}` : 'Anonymous',
        avatar: user?.avatar || null,
        userId: req.user.userId
      }
    };
    
    // Calculate AI trust score
    const trustScore = calculateTrustScore(reviewData);
    reviewData.trustScore = trustScore;
    
    const review = new Review(reviewData);
    await review.save();
    
    // Update user's review count and trust score
    if (user) {
      user.reviewCount = (user.reviewCount || 0) + 1;
      
      // Recalculate user's overall trust score based on all their reviews
      const userReviews = await Review.find({ 'author.userId': req.user.userId });
      const totalTrustScore = userReviews.reduce((sum, rev) => sum + (rev.trustScore || 0), 0);
      user.trustScore = Math.round(totalTrustScore / userReviews.length);
      
      await user.save();
    }
    
    // Populate and format the response
    const populatedReview = await Review.findById(review._id)
      .populate('author.userId', 'firstName lastName avatar');
    
    const reviewObj = populatedReview.toObject();
    if (reviewObj.author && reviewObj.author.userId) {
      reviewObj.author.name = `${reviewObj.author.userId.firstName} ${reviewObj.author.userId.lastName}`;
      reviewObj.author.avatar = reviewObj.author.userId.avatar;
      reviewObj.author.userId = reviewObj.author.userId._id;
    }
    
    // URLs should already be CloudFront URLs from upload
    res.status(201).json(reviewObj);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Upvote review - Optimized version
router.patch('/:id/upvote', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected during upvote');
      return res.status(503).json({ 
        message: 'Service temporarily unavailable. Please try again.' 
      });
    }

    const reviewId = req.params.id;
    const userId = req.user.userId;

    // Use atomic update for better performance
    const review = await Review.findById(reviewId)
      .select('upvotedBy upvotes')
      .lean()
      .exec();
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const hasUpvoted = review.upvotedBy && review.upvotedBy.some(id => id.toString() === userId.toString());
    const newUpvoteCount = hasUpvoted ? (review.upvotes || 0) - 1 : (review.upvotes || 0) + 1;

    // Perform atomic update
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      {
        $inc: { upvotes: hasUpvoted ? -1 : 1 },
        [hasUpvoted ? '$pull' : '$addToSet']: { 
          upvotedBy: userId 
        }
      },
      { 
        new: true,
        select: 'title description rating category subcategory tags author upvotes views trustScore createdAt updatedAt media upvotedBy'
      }
    )
    .populate({
      path: 'author.userId',
      select: 'firstName lastName avatar',
      options: { strictPopulate: false }
    })
    .lean()
    .exec();

    if (!updatedReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Format the review data with null safety
    const reviewObj = { ...updatedReview };
    
    // Safely handle author population
    if (reviewObj.author && reviewObj.author.userId) {
      const authorUserId = reviewObj.author.userId;
      
      if (authorUserId && typeof authorUserId === 'object' && authorUserId.firstName) {
        reviewObj.author.name = `${authorUserId.firstName} ${authorUserId.lastName}`;
        reviewObj.author.avatar = authorUserId.avatar;
        reviewObj.author.userId = authorUserId._id;
      } else {
        reviewObj.author.name = 'Anonymous';
        reviewObj.author.avatar = null;
        reviewObj.author.userId = null;
      }
    } else {
      reviewObj.author = {
        name: 'Anonymous',
        avatar: null,
        userId: null
      };
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Review ${reviewId} upvote processed in ${totalTime}ms`);
    
    res.json(reviewObj);
  } catch (error) {
    console.error('Error upvoting review:', error.message);
    res.status(500).json({ message: 'Failed to upvote review' });
  }
});

// Increment view count (works for both authenticated and unauthenticated users)
router.patch('/:id/view', async (req, res, next) => {
  // Optional authentication - don't block unauthenticated users
  if (req.headers.authorization) {
    // If auth header exists, try to authenticate but don't fail if it doesn't work
    return authenticateToken(req, res, (err) => {
      if (err) {
        // Authentication failed, continue as unauthenticated user
        req.user = null;
        return next();
      }
      next();
    });
  }
  next();
}, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Get user identifier (either from auth token or from request body)
    let userId = null;
    if (req.user?.userId) {
      // Authenticated user
      userId = req.user.userId;
    } else if (req.body.anonymousId) {
      // Anonymous user with persistent ID
      userId = `anon_${req.body.anonymousId}`;
    }
    
    if (userId) {
      // Check if user has already viewed this review
      const hasViewed = review.viewedBy.some(view => 
        view.userId.toString() === userId.toString()
      );
      
      if (!hasViewed) {
        // Add new view
        review.viewedBy.push({ 
          userId: userId, 
          viewedAt: new Date() 
        });
        review.views = review.viewedBy.length;
        await review.save();
        
        res.json({ 
          success: true, 
          views: review.views,
          newView: true 
        });
      } else {
        // User already viewed, return current count
        res.json({ 
          success: true, 
          views: review.views,
          newView: false 
        });
      }
    } else {
      // No user identifier, just return current count
      res.json({ 
        success: true, 
        views: review.views,
        newView: false 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;