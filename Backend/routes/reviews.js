const express = require('express');
const Review = require('../models/Review');
const { authenticateToken } = require('../middleware/auth');
const { calculateTrustScore } = require('../utils/trustCalculator');
const router = express.Router();

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const { category, subcategory, tag, sort = 'createdAt', page = 1, limit = 15 } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (tag) query.tags = { $in: [tag] };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [reviews, totalCount] = await Promise.all([
      Review.find(query)
        .populate('author.userId', 'firstName lastName avatar')
        .sort({ [sort]: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments(query)
    ]);
    
    // Map the populated data to match the expected format
    const formattedReviews = reviews.map(review => {
      const reviewObj = review.toObject();
      if (reviewObj.author && reviewObj.author.userId) {
        reviewObj.author.name = `${reviewObj.author.userId.firstName} ${reviewObj.author.userId.lastName}`;
        reviewObj.author.avatar = reviewObj.author.userId.avatar;
        reviewObj.author.userId = reviewObj.author.userId._id;
      }
      return reviewObj;
    });
    
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
    res.status(500).json({ message: error.message });
  }
});

// Get trending reviews (most viewed)
router.get('/trending', async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('author.userId', 'firstName lastName avatar')
      .sort({ views: -1, upvotes: -1, createdAt: -1 })
      .limit(10);
    
    // Map the populated data to match the expected format
    const formattedReviews = reviews.map(review => {
      const reviewObj = review.toObject();
      if (reviewObj.author && reviewObj.author.userId) {
        reviewObj.author.name = `${reviewObj.author.userId.firstName} ${reviewObj.author.userId.lastName}`;
        reviewObj.author.avatar = reviewObj.author.userId.avatar;
        reviewObj.author.userId = reviewObj.author.userId._id;
      }
      return reviewObj;
    });
    
    res.json(formattedReviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    console.error('Error fetching most viewed reviews:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single review
router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('author.userId', 'firstName lastName avatar');
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Add view if user is authenticated
    const userId = req.user?.userId;
    if (userId) {
      review.addView(userId);
      await review.save();
    }
    
    // Format the review data
    const reviewObj = review.toObject();
    if (reviewObj.author && reviewObj.author.userId) {
      reviewObj.author.name = `${reviewObj.author.userId.firstName} ${reviewObj.author.userId.lastName}`;
      reviewObj.author.avatar = reviewObj.author.userId.avatar;
      reviewObj.author.userId = reviewObj.author.userId._id;
    }
    
    res.json(reviewObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    
    res.status(201).json(reviewObj);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Upvote review
router.patch('/:id/upvote', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const result = review.toggleUpvote(req.user.userId);
    await review.save();
    
    // Populate and return the updated review object
    const populatedReview = await Review.findById(req.params.id)
      .populate('author.userId', 'firstName lastName avatar');
    
    const reviewObj = populatedReview.toObject();
    if (reviewObj.author && reviewObj.author.userId) {
      reviewObj.author.name = `${reviewObj.author.userId.firstName} ${reviewObj.author.userId.lastName}`;
      reviewObj.author.avatar = reviewObj.author.userId.avatar;
      reviewObj.author.userId = reviewObj.author.userId._id;
    }
    
    res.json(reviewObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
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