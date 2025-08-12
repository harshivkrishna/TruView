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

    // Check if profile is public
    if (!user.isPublicProfile) {
      return res.status(403).json({ message: 'Profile is private' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user reviews
router.get('/:userId/reviews', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if profile is public
    if (!user.isPublicProfile) {
      return res.status(403).json({ message: 'Profile is private' });
    }

    const reviews = await Review.find({ 
      'author.userId': req.params.userId 
    })
    .sort({ createdAt: -1 })
    .limit(20);

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await User.find({ 
      isPublicProfile: true,
      reviewCount: { $gt: 0 }
    })
    .select('firstName lastName reviewCount trustScore')
    .sort({ trustScore: -1, reviewCount: -1 })
    .limit(50);

    res.json(leaderboard);
  } catch (error) {
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

module.exports = router;