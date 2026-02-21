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

// Import only s3Client for basic S3 upload
let s3Client;
if (isAWSConfigured) {
  const { s3Client: s3 } = require('../config/aws');
  s3Client = s3;
  console.log('AWS S3 client loaded successfully - using basic S3 URLs');
} else {
  console.log('AWS not configured - using local storage');
}

let profilePhotoUpload;

if (isAWSConfigured) {
  // AWS S3 storage configuration
  const multerS3 = require('multer-s3');
  
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
    
    // Avatar URL should already be CloudFront URL from upload
    
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

    // Avatar URL should already be CloudFront URL from upload

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload profile photo
router.options('/profile/photo', (req, res) => {
  // Handle preflight request for file upload
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(200);
});

router.post('/profile/photo', (req, res, next) => {
  // Add CORS headers FIRST - before any other middleware
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
}, authenticateToken, (req, res, next) => {
  console.log('\n' + '='.repeat(70));
  console.log('📸 PROFILE PHOTO UPLOAD REQUEST');
  console.log('='.repeat(70));
  console.log('✅ User authenticated:', req.user ? 'Yes' : 'No');
  console.log('🆔 User ID:', req.user?.userId);
  console.log('📧 User email:', req.user?.email);
  console.log('🌐 Origin:', req.headers.origin);
  console.log('⏰ Timestamp:', new Date().toISOString());
  next();
}, profilePhotoUpload.single('profilePhoto'), (err, req, res, next) => {
  // Handle multer errors (including file size limit)
  if (err) {
    console.error('❌ Multer Error:', err.message);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxSizeMB = 5;
      console.error(`File size exceeds ${maxSizeMB}MB limit`);
      return res.status(413).json({ 
        message: `File size is too large. Maximum allowed size is ${maxSizeMB} MB. Please select a smaller image.`,
        code: 'FILE_TOO_LARGE',
        maxSize: maxSizeMB
      });
    }
    
    if (err.message === 'Only image files are allowed') {
      return res.status(400).json({ 
        message: 'Only image files are allowed. Please select a JPEG, PNG, or GIF image.',
        code: 'INVALID_FILE_TYPE'
      });
    }
    
    return res.status(400).json({ 
      message: err.message || 'File upload failed',
      code: 'UPLOAD_ERROR'
    });
  }
  next();
}, async (req, res) => {
  try {
    console.log('\n📦 AFTER MULTER MIDDLEWARE');
    console.log('File received:', req.file ? 'Yes ✅' : 'No ❌');
    
    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('📄 File details:', {
      filename: req.file.filename || req.file.key,
      size: `${(req.file.size / 1024).toFixed(2)} KB`,
      mimetype: req.file.mimetype
    });
    console.log('🆔 User ID from token:', req.user?.userId);

    let avatarUrl;
    if (isAWSConfigured) {
      console.log('☁️  Using AWS S3 storage');
      console.log('🔑 S3 File key:', req.file.key);
      console.log('📍 S3 File location:', req.file.location);
      
      // Create CloudFront URL directly using string construction
      const cloudFrontDomain = process.env.AWS_CLOUDFRONT_DOMAIN;
      if (cloudFrontDomain && req.file.key) {
        avatarUrl = `https://${cloudFrontDomain}/${req.file.key}`;
        console.log('✅ Generated CloudFront URL:', avatarUrl);
        console.log('⚡ CloudFront will provide faster loading');
      } else {
        // Fallback to S3 URL if CloudFront domain not configured
        avatarUrl = req.file.location;
        console.log('⚠️  Using S3 URL (CloudFront not configured):', avatarUrl);
      }
    } else {
      console.log('💾 Using local storage');
      // Local storage response
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      avatarUrl = `${baseUrl}/uploads/profile-photos/${req.file.filename}`;
      console.log('Generated local avatar URL:', avatarUrl);
    }

    console.log('\n🔍 CHECKING USER IN DATABASE');
    console.log('Looking for user ID:', req.user.userId);

    // First, check if user exists
    const existingUser = await User.findById(req.user.userId).select('_id firstName lastName email');
    
    if (!existingUser) {
      console.error('❌ USER NOT FOUND IN DATABASE');
      console.error('Searched for ID:', req.user.userId);
      console.error('This usually means:');
      console.error('  1. User was deleted from database');
      console.error('  2. Token has invalid user ID');
      console.error('  3. MongoDB connection issue');
      console.error('\n💡 Solution: User should logout and login again');
      return res.status(404).json({ 
        message: 'Profile not found. Please log out and log in again to refresh your session.',
        code: 'USER_NOT_FOUND'
      });
    }

    console.log('✅ User found:', {
      id: existingUser._id,
      name: `${existingUser.firstName} ${existingUser.lastName}`,
      email: existingUser.email
    });

    console.log('\n💾 UPDATING USER AVATAR');
    console.log('Avatar URL to save:', avatarUrl);

    // Update user profile with new avatar URL
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { avatar: avatarUrl },
      { new: true, runValidators: false }
    ).select('-password -verificationOTP -resetPasswordOTP');

    if (!user) {
      console.error('❌ User update failed for ID:', req.user.userId);
      return res.status(500).json({ message: 'Failed to update profile with new photo.' });
    }

    console.log('✅ USER AVATAR UPDATED SUCCESSFULLY');
    console.log('New avatar URL:', user.avatar);
    console.log('User ID:', user._id);
    console.log('='.repeat(70) + '\n');
    
    // Add CORS headers to response
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    res.json({ 
      avatar: user.avatar, 
      photoUrl: user.avatar, 
      user,
      success: true,
      message: 'Profile photo uploaded successfully'
    });
  } catch (error) {
    console.error('\n❌ PROFILE PHOTO UPLOAD ERROR');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('='.repeat(70) + '\n');
    
    res.status(500).json({ 
      message: 'Failed to upload profile photo', 
      error: error.message,
      code: 'UPLOAD_ERROR'
    });
  }
});

// Get user profile by ID (public)
router.get('/:userId/profile', async (req, res) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      console.log('Invalid user ID format:', req.params.userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(req.params.userId).select('-password -verificationOTP -resetPasswordOTP');
    if (!user) {
      console.log('User not found:', req.params.userId);
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

    // Avatar URL should already be CloudFront URL from upload

    res.json(profileData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
});

// Get user reviews
router.get('/:userId/reviews', async (req, res) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if profile is public (default to true if not set)
    if (user.isPublicProfile === false) {
      return res.status(403).json({ message: 'Profile is private' });
    }

    // Find reviews by author.userId
    const reviews = await Review.find({ 
      'author.userId': req.params.userId,
      isRemovedByAdmin: { $ne: true } // Exclude admin-removed reviews
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean(); // Use lean for better performance

    // Format the reviews data consistently
    const formattedReviews = reviews.map(review => ({
      ...review,
      author: {
        name: review.author?.name || `${user.firstName} ${user.lastName}`,
        avatar: review.author?.avatar || user.avatar,
        userId: req.params.userId
      }
    }));

    res.json(formattedReviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user reviews', 
      error: error.message,
      reviews: [] // Return empty array on error
    });
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