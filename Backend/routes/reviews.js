const express = require('express');
const Review = require('../models/Review');
const { authenticateToken } = require('../middleware/auth');
const { calculateTrustScore } = require('../utils/trustCalculator');
const router = express.Router();

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const { category, tag, sort = 'createdAt', limit = 20 } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (tag) query.tags = { $in: [tag] };
    
    const reviews = await Review.find(query)
      .sort({ [sort]: -1 })
      .limit(parseInt(limit));
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get trending reviews (most viewed)
router.get('/trending', async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ views: -1, upvotes: -1, createdAt: -1 })
      .limit(10);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single review
router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Add view if user is authenticated
    const userId = req.user?.userId;
    if (userId) {
      review.addView(userId);
      await review.save();
    }
    
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new review
router.post('/', authenticateToken, async (req, res) => {
  try {
    const reviewData = {
      ...req.body,
      author: {
        name: req.body.authorName || 'Anonymous',
        avatar: req.body.authorAvatar || null,
        userId: req.user.userId
      }
    };
    
    // Calculate AI trust score
    const trustScore = calculateTrustScore(reviewData);
    reviewData.trustScore = trustScore;
    
    const review = new Review(reviewData);
    await review.save();
    res.status(201).json(review);
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
    
    // Return the updated review object
    res.json(review);
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