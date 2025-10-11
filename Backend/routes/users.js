const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
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
  const { s3Client, convertToCloudFrontUrl, generateCloudFrontUrl } = require('../config/aws');
  
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
    
    // Convert S3 avatar URL to CloudFront URL if needed
    if (user.avatar && user.avatar.includes('s3.amazonaws.com') && isAWSConfigured) {
      user.avatar = convertToCloudFrontUrl(user.avatar);
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

    // Convert S3 avatar URL to CloudFront URL if needed
    if (user.avatar && user.avatar.includes('s3.amazonaws.com') && isAWSConfigured) {
      user.avatar = convertToCloudFrontUrl(user.avatar);
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

    // console.log('File uploaded successfully:', req.file);

    let avatarUrl;
    if (isAWSConfigured) {
      // Generate CloudFront URL directly from S3 key
      const cloudFrontUrl = generateCloudFrontUrl(req.file.key);
      avatarUrl = cloudFrontUrl || convertToCloudFrontUrl(req.file.location);
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

    // console.log('User updated with new avatar:', user.avatar);
    res.json(user);
  } catch (error) {
    // console.error('Profile photo upload error:', error);
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

    // Convert S3 avatar URL to CloudFront URL if needed
    if (profileData.avatar && profileData.avatar.includes('s3.amazonaws.com') && isAWSConfigured) {
      profileData.avatar = convertToCloudFrontUrl(profileData.avatar);
    }

    res.json(profileData);
  } catch (error) {
    // console.error('Error fetching user profile:', error);
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
    // console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Failed to fetch user reviews', error: error.message });
  }
});

// Get leaderboard - Optimized version
router.get('/leaderboard', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected during leaderboard fetch');
      return res.status(503).json({ 
        message: 'Service temporarily unavailable. Please try again.',
        leaderboard: [] 
      });
    }

    // Use aggregation pipeline for much better performance
    const leaderboard = await User.aggregate([
      {
        $match: {
          reviewCount: { $gt: 0 }, // Only users with reviews
          isPublicProfile: { $ne: false } // Include public profiles (default to true)
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'author.userId',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          actualReviewCount: { $size: '$reviews' },
          avgTrustScore: {
            $cond: {
              if: { $gt: [{ $size: '$reviews' }, 0] },
              then: { $avg: '$reviews.trustScore' },
              else: 50
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          reviewCount: '$actualReviewCount',
          trustScore: { $round: ['$avgTrustScore', 0] },
          avatar: 1
        }
      },
      {
        $sort: {
          trustScore: -1,
          reviewCount: -1
        }
      },
      {
        $limit: 50 // Limit to top 50 users
      }
    ]).exec();

    const totalTime = Date.now() - startTime;
    console.log(`✅ Leaderboard generated in ${totalTime}ms (${leaderboard.length} users)`);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error generating leaderboard:', error.message);
    console.error('Error stack:', error.stack);
    res.status(200).json([]); // Return empty array instead of error
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
  const startTime = Date.now();
  
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected during stats recalculation');
      return res.status(503).json({ 
        message: 'Service temporarily unavailable. Please try again.' 
      });
    }

    // Use aggregation for better performance
    const userStats = await User.aggregate([
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'author.userId',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          actualReviewCount: { $size: '$reviews' },
          avgTrustScore: {
            $cond: {
              if: { $gt: [{ $size: '$reviews' }, 0] },
              then: { $avg: '$reviews.trustScore' },
              else: 50
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          reviewCount: '$actualReviewCount',
          trustScore: { $round: ['$avgTrustScore', 0] }
        }
      }
    ]).exec();

    // Update users in batch
    const bulkOps = userStats.map(user => ({
      updateOne: {
        filter: { _id: user._id },
        update: { 
          $set: { 
            reviewCount: user.reviewCount,
            trustScore: user.trustScore
          } 
        }
      }
    }));

    const result = await User.bulkWrite(bulkOps);
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Stats recalculated in ${totalTime}ms (${result.modifiedCount} users updated)`);
    
    res.json({ 
      message: `Recalculated stats for ${result.modifiedCount} users`,
      totalUsers: userStats.length,
      updatedUsers: result.modifiedCount
    });
  } catch (error) {
    console.error('Error recalculating stats:', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;