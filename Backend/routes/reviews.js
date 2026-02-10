const express = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const { authenticateToken } = require('../middleware/auth');
const { calculateTrustScore } = require('../utils/trustCalculator');
const cacheService = require('../services/cacheService');
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

    const { 
      category, 
      subcategory, 
      tag, 
      tags, 
      rating, 
      dateRange, 
      location, 
      companyName, 
      query: searchQuery,
      sort = 'createdAt', 
      sortBy,
      page = 1, 
      limit = 15 
    } = req.query;
    
    let query = {};
    
    // Filter out admin-removed reviews for non-authors
    // Admin-removed reviews should only be visible to their original authors
    const currentUserId = req.user?.userId;
    const adminRemovedFilter = !currentUserId || currentUserId === 'admin'
      ? { isRemovedByAdmin: { $ne: true } }
      : {
          $or: [
            { isRemovedByAdmin: { $ne: true } },
            { 
              isRemovedByAdmin: true, 
              'author.userId': currentUserId
            }
          ]
        };
    
    // Basic filters
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (tag) query.tags = { $in: [tag] };
    
    // Advanced filters
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      query.tags = { $in: tagArray };
    }
    
    if (rating) {
      const ratingValue = parseInt(rating);
      if (ratingValue >= 1 && ratingValue <= 5) {
        query.rating = { $gte: ratingValue };
      }
    }
    
    if (dateRange) {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }
    
    if (companyName) {
      query.companyName = { $regex: companyName, $options: 'i' };
    }
    
    // Handle text search and location with proper $and logic
    const searchConditions = [];
    
    if (searchQuery) {
      searchConditions.push({
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { companyName: { $regex: searchQuery, $options: 'i' } }
        ]
      });
    }
    
    if (location) {
      searchConditions.push({
        $or: [
          { 'author.location': { $regex: location, $options: 'i' } },
          { location: { $regex: location, $options: 'i' } }
        ]
      });
    }
    
    // Combine all conditions using $and
    const finalQuery = {
      $and: [
        adminRemovedFilter,
        query,
        ...searchConditions
      ].filter(condition => Object.keys(condition).length > 0)
    };
    
    // If no complex conditions, use simple query
    const mongoQuery = finalQuery.$and.length > 1 ? finalQuery : { ...adminRemovedFilter, ...query };
    
    // Determine sort field
    const sortField = sortBy || sort;
    let sortObject = {};
    
    switch (sortField) {
      case 'rating':
        sortObject = { rating: -1, createdAt: -1 };
        break;
      case 'upvotes':
        sortObject = { upvotes: -1, createdAt: -1 };
        break;
      case 'views':
        sortObject = { views: -1, createdAt: -1 };
        break;
      case 'trustScore':
        sortObject = { trustScore: -1, createdAt: -1 };
        break;
      case 'oldest':
        sortObject = { createdAt: 1 };
        break;
      case 'newest':
      case 'createdAt':
      default:
        sortObject = { createdAt: -1 };
        break;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Log the constructed query for debugging
    console.log('Reviews query:', JSON.stringify(mongoQuery, null, 2));
    console.log('Sort object:', sortObject);
    
    const [reviews, totalCount] = await Promise.all([
      Review.find(mongoQuery)
        .populate({
          path: 'author.userId',
          select: 'firstName lastName avatar',
          options: { strictPopulate: false }
        })
        .select('title description rating category subcategory tags author upvotes views trustScore createdAt updatedAt media isRemovedByAdmin adminRemovalReason')
        .sort(sortObject)
        .skip(skip)
        .limit(parseInt(limit))
        .lean()
        .exec(),
      Review.countDocuments(mongoQuery).exec()
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

// Get trending reviews (most viewed) - OPTIMIZED with caching
router.get('/trending', async (req, res) => {
  const cacheKey = 'trending-reviews';
  
  try {
    // Check cache first
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      console.log('✅ Serving trending reviews from cache');
      return res.json(cachedData);
    }

    // Check MongoDB connection state
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. State:', mongoose.connection.readyState);
      return res.status(503).json({ 
        message: 'Database temporarily unavailable. Please try again.',
        reviews: [] 
      });
    }

    // Optimized query with minimal fields and indexed sort
    const reviews = await Review.find(
      { isRemovedByAdmin: { $ne: true } },
      'title description rating category subcategory tags author upvotes views trustScore createdAt media'
    )
      .populate({
        path: 'author.userId',
        select: 'firstName lastName avatar',
        options: { strictPopulate: false }
      })
      .sort({ views: -1, upvotes: -1, createdAt: -1 })
      .limit(10)
      .lean()
      .exec();
    
    // Handle empty results
    if (!reviews || reviews.length === 0) {
      console.log('No trending reviews found');
      const emptyResult = [];
      cacheService.set(cacheKey, emptyResult, 60000); // Cache for 1 minute
      return res.json(emptyResult);
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
    
    // Cache for 2 minutes (120000ms)
    cacheService.set(cacheKey, formattedReviews, 120000);
    
    console.log(`✅ Successfully fetched and cached ${formattedReviews.length} trending reviews`);
    res.json(formattedReviews);
  } catch (error) {
    console.error('Error fetching trending reviews:', error);
    console.error('Error stack:', error.stack);
    
    // Return empty array instead of error to prevent UI breaks
    res.status(200).json([]);
  }
});

// Get most viewed reviews in past 7 days - OPTIMIZED with caching and better query
router.get('/most-viewed-week', async (req, res) => {
  const cacheKey = 'most-viewed-week';
  
  try {
    // Check cache first
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      console.log('✅ Serving weekly trending reviews from cache');
      return res.json(cachedData);
    }

    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // OPTIMIZED: Use simpler query with indexed fields instead of complex aggregation
    // This approach is much faster for large datasets
    const reviews = await Review.find(
      {
        isRemovedByAdmin: { $ne: true },
        createdAt: { $gte: sevenDaysAgo } // Only look at recent reviews
      },
      'title description rating category subcategory tags author upvotes views trustScore createdAt media'
    )
      .populate({
        path: 'author.userId',
        select: 'firstName lastName avatar',
        options: { strictPopulate: false }
      })
      .sort({ views: -1, upvotes: -1, createdAt: -1 })
      .limit(3)
      .lean()
      .exec();
    
    // Format the reviews
    const formattedReviews = reviews.map(review => {
      const reviewObj = { ...review };
      
      // Safely handle author population
      if (reviewObj.author && reviewObj.author.userId) {
        const userId = reviewObj.author.userId;
        
        if (userId && typeof userId === 'object' && userId.firstName) {
          reviewObj.author.name = `${userId.firstName} ${userId.lastName}`;
          reviewObj.author.avatar = userId.avatar;
          reviewObj.author.userId = userId._id;
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
      
      return reviewObj;
    });
    
    // Cache for 3 minutes (180000ms)
    cacheService.set(cacheKey, formattedReviews, 180000);
    
    console.log(`✅ Successfully fetched and cached ${formattedReviews.length} weekly trending reviews`);
    res.json(formattedReviews);
  } catch (error) {
    console.error('Error fetching most viewed reviews:', error);
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
      .select('title description rating category subcategory tags author upvotes views trustScore createdAt updatedAt media upvotedBy isRemovedByAdmin adminRemovalReason')
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

// Create new review with cache invalidation
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
    
    // Invalidate trending caches since new review affects trending
    cacheService.delete('trending-reviews');
    cacheService.delete('most-viewed-week');
    
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

// Upvote review - Optimized version with cache invalidation
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

    // Check if this is an admin user (can't be tracked in upvotedBy due to ObjectId requirement)
    if (userId === 'admin') {
      return res.status(403).json({ 
        message: 'Admin users cannot upvote reviews',
        reason: 'Admin accounts are for moderation purposes only'
      });
    }

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
        select: 'title description rating category subcategory tags author upvotes views trustScore createdAt updatedAt media upvotedBy isRemovedByAdmin adminRemovalReason'
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

    // Invalidate trending caches since upvotes affect trending
    cacheService.delete('trending-reviews');
    cacheService.delete('most-viewed-week');

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
    let shouldTrackView = true;
    
    if (req.user?.userId) {
      // Authenticated user
      userId = req.user.userId;
      console.log('View request from authenticated user:', userId);
      
      // Skip view tracking for admin users (admin userId is not a valid ObjectId)
      if (userId === 'admin') {
        shouldTrackView = false;
        console.log('Admin user detected - skipping individual view tracking');
      }
    } else if (req.body.anonymousId) {
      // Anonymous user with persistent ID
      userId = `anon_${req.body.anonymousId}`;
      shouldTrackView = false; // Anonymous users also can't be tracked in viewedBy (ObjectId required)
      console.log('Anonymous user detected:', userId);
    }
    
    if (userId && shouldTrackView) {
      // Check if user has already viewed this review
      const hasViewed = review.viewedBy.some(view => 
        view.userId.toString() === userId.toString()
      );
      
      if (!hasViewed) {
        // Add new view (only for regular users with valid ObjectId)
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
    } else if (userId && !shouldTrackView) {
      // Admin users or anonymous users - increment view count but don't track individually
      review.views = (review.views || 0) + 1;
      await review.save();
      
      res.json({ 
        success: true, 
        views: review.views,
        newView: true,
        tracked: false // Indicate that this view wasn't individually tracked
      });
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