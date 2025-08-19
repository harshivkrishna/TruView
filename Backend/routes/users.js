const express = require('express');
const path = require('path');
const User = require('../models/User');
const Review = require('../models/Review');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const router = express.Router();

// Check if AWS is configured
const isAWSConfigured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET;

let profilePhotoUpload;

if (isAWSConfigured) {
  // AWS S3 storage configuration
  const multerS3 = require('multer-s3');
  const { s3Client } = require('../config/aws');
  
  profilePhotoUpload = multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.AWS_S3_BUCKET,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `profile-photos/profile-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
  });
} else {
  // Local storage configuration (fallback)
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, '../uploads/profile-photos');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  profilePhotoUpload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadsDir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
  });
}

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      phoneNumber, 
      dateOfBirth, 
      location, 
      bio, 
      isPublicProfile 
    } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        firstName, 
        lastName, 
        phoneNumber, 
        dateOfBirth, 
        location, 
        bio, 
        isPublicProfile 
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload profile photo
router.post('/profile/photo', authenticateToken, profilePhotoUpload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File uploaded successfully:', req.file);

    let avatarUrl;
    if (isAWSConfigured) {
      // AWS S3 response
      avatarUrl = req.file.location;
    } else {
      // Local storage response
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      avatarUrl = `${baseUrl}/uploads/profile-photos/${req.file.filename}`;
    }

    // Update user profile with new avatar URL
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User updated with new avatar:', user.avatar);
    res.json(user);
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ message: 'Failed to upload profile photo', error: error.message });
  }
});

// Get user profile by ID (public)
router.get('/:userId/profile', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -verificationOTP -resetPasswordOTP');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if profile is public (default to true if not set)
    if (user.isPublicProfile === false) {
      return res.status(403).json({ message: 'Profile is private' });
    }

    // Add computed fields if they don't exist
    const profileData = user.toObject();
    if (!profileData.reviewCount) profileData.reviewCount = 0;
    if (!profileData.trustScore) profileData.trustScore = 50;
    if (!profileData.isPublicProfile) profileData.isPublicProfile = true;

    res.json(profileData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
});

// Get user reviews
router.get('/:userId/reviews', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if profile is public (default to true if not set)
    if (user.isPublicProfile === false) {
      return res.status(403).json({ message: 'Profile is private' });
    }

    const reviews = await Review.find({ 
      'author.userId': req.params.userId 
    })
    .populate('author.userId', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .limit(20);

    // Format the reviews data consistently
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
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Failed to fetch user reviews', error: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    // Get ALL users (regardless of profile privacy) and check their actual review counts
    const Review = require('../models/Review');
    const allUsers = await User.find({}).select('firstName lastName reviewCount trustScore');
    
    console.log(`Found ${allUsers.length} total users`);
    
    // Check each user's actual review count and update if needed
    const usersWithReviews = [];
    for (const user of allUsers) {
      const actualReviewCount = await Review.countDocuments({ 'author.userId': user._id });
      console.log(`User ${user.firstName} ${user.lastName}: stored=${user.reviewCount}, actual=${actualReviewCount}`);
      
      if (actualReviewCount > 0) {
        // Update user's review count if it's wrong
        if (user.reviewCount !== actualReviewCount) {
          user.reviewCount = actualReviewCount;
          await user.save();
          console.log(`Updated ${user.firstName} ${user.lastName} review count to ${actualReviewCount}`);
        }
        
        usersWithReviews.push({
          firstName: user.firstName,
          lastName: user.lastName,
          reviewCount: actualReviewCount,
          trustScore: user.trustScore || 50
        });
      }
    }
    
    console.log(`Found ${usersWithReviews.length} users with reviews`);
    
    // Sort by trust score, then by review count
    const sortedUsers = usersWithReviews.sort((a, b) => {
      if (b.trustScore !== a.trustScore) {
        return b.trustScore - a.trustScore;
      }
      return b.reviewCount - a.reviewCount;
    });
    
    res.json(sortedUsers);
  } catch (error) {
    console.error('Error generating leaderboard:', error);
    res.status(500).json({ message: error.message });
  }
});

// Simple test route to debug leaderboard
router.get('/leaderboard-test', async (req, res) => {
  try {
    // Just get all public users without any filtering
    const allUsers = await User.find({ isPublicProfile: true }).select('firstName lastName reviewCount trustScore');
    console.log(`Test route found ${allUsers.length} public users`);
    
    // Show users with and without reviews
    const usersWithReviews = allUsers.filter(u => (u.reviewCount || 0) > 0);
    const usersWithoutReviews = allUsers.filter(u => (u.reviewCount || 0) === 0);
    
    console.log(`Users with reviews: ${usersWithReviews.length}`);
    console.log(`Users without reviews: ${usersWithoutReviews.length}`);

    res.json({
      totalPublicUsers: allUsers.length,
      usersWithReviews: usersWithReviews.length,
      usersWithoutReviews: usersWithoutReviews.length,
      allUsers: allUsers
    });
  } catch (error) {
    console.error('Error in test route:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Recalculate all users' review counts and trust scores (admin only)
router.post('/recalculate-stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const Review = require('../models/Review');
    const allUsers = await User.find();
    let updatedCount = 0;
    
    for (const user of allUsers) {
      const reviewCount = await Review.countDocuments({ 'author.userId': user._id });
      let trustScore = 50; // Default trust score
      
      if (reviewCount > 0) {
        const userReviews = await Review.find({ 'author.userId': user._id });
        const totalTrustScore = userReviews.reduce((sum, rev) => sum + (rev.trustScore || 0), 0);
        trustScore = Math.round(totalTrustScore / userReviews.length);
      }
      
      if (user.reviewCount !== reviewCount || user.trustScore !== trustScore) {
        user.reviewCount = reviewCount;
        user.trustScore = trustScore;
        await user.save();
        updatedCount++;
      }
    }
    
    res.json({ 
      message: `Recalculated stats for ${updatedCount} users`,
      totalUsers: allUsers.length,
      updatedUsers: updatedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Debug route to check user stats (temporary, remove in production)
router.get('/debug/stats', async (req, res) => {
  try {
    const Review = require('../models/Review');
    const allUsers = await User.find().select('firstName lastName reviewCount trustScore isPublicProfile');
    
    const userStats = await Promise.all(allUsers.map(async (user) => {
      const actualReviewCount = await Review.countDocuments({ 'author.userId': user._id });
      const userReviews = await Review.find({ 'author.userId': user._id }).select('trustScore');
      const actualTrustScore = userReviews.length > 0 
        ? Math.round(userReviews.reduce((sum, rev) => sum + (rev.trustScore || 0), 0) / userReviews.length)
        : 50;
      
      return {
        name: `${user.firstName} ${user.lastName}`,
        storedReviewCount: user.reviewCount,
        actualReviewCount,
        storedTrustScore: user.trustScore,
        actualTrustScore,
        isPublicProfile: user.isPublicProfile,
        hasReviews: actualReviewCount > 0
      };
    }));
    
    res.json({
      totalUsers: allUsers.length,
      usersWithReviews: userStats.filter(u => u.hasReviews).length,
      userStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Simple test route to check all users and reviews
router.get('/debug/all-data', async (req, res) => {
  try {
    const Review = require('../models/Review');
    
    // Get all users
    const allUsers = await User.find().select('firstName lastName reviewCount trustScore isPublicProfile');
    
    // Get all reviews
    const allReviews = await Review.find().select('title author rating trustScore createdAt');
    
    // Get review count by user
    const reviewCounts = await Review.aggregate([
      {
        $group: {
          _id: '$author.userId',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      users: allUsers,
      reviews: allReviews,
      reviewCounts,
      totalUsers: allUsers.length,
      totalReviews: allReviews.length,
      usersWithReviews: reviewCounts.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Force update all users' review counts and trust scores
router.post('/debug/force-update', async (req, res) => {
  try {
    const Review = require('../models/Review');
    const allUsers = await User.find();
    let updatedCount = 0;
    
    console.log(`Force updating ${allUsers.length} users...`);
    
    for (const user of allUsers) {
      const reviewCount = await Review.countDocuments({ 'author.userId': user._id });
      let trustScore = 50; // Default trust score
      
      if (reviewCount > 0) {
        const userReviews = await Review.find({ 'author.userId': user._id });
        const totalTrustScore = userReviews.reduce((sum, rev) => sum + (rev.trustScore || 0), 0);
        trustScore = Math.round(totalTrustScore / userReviews.length);
        console.log(`User ${user.firstName} ${user.lastName}: ${reviewCount} reviews, trustScore: ${trustScore}`);
      }
      
      // Force update regardless of current values
      user.reviewCount = reviewCount;
      user.trustScore = trustScore;
      await user.save();
      updatedCount++;
    }
    
    console.log(`Force updated ${updatedCount} users`);
    
    res.json({ 
      message: `Force updated ${updatedCount} users`,
      totalUsers: allUsers.length,
      updatedUsers: updatedCount
    });
  } catch (error) {
    console.error('Error force updating users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Check database connection and basic stats
router.get('/debug/db-status', async (req, res) => {
  try {
    const Review = require('../models/Review');
    const mongoose = require('mongoose');
    
    const dbStatus = {
      connection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      database: mongoose.connection.db ? mongoose.connection.db.databaseName : 'unknown',
      collections: {
        users: await User.countDocuments(),
        reviews: await Review.countDocuments()
      }
    };
    
    res.json(dbStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;