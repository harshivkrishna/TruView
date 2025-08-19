const express = require('express');
const Review = require('../models/Review');
const User = require('../models/User');
const Report = require('../models/Report');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Default secret code
let adminSecretCode = 'truview';

// Create admin account - this route should be accessible without authentication
router.post('/create-admin', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, secretCode } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phoneNumber || !secretCode) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate secret code
    if (secretCode !== adminSecretCode) {
      return res.status(400).json({ message: 'Invalid secret code' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phoneNumber }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 'Email already registered' : 'Phone number already registered' 
      });
    }
    
    // Create admin user - password will be hashed by the pre-save hook
    const adminUser = new User({
      firstName,
      lastName,
      email,
      password, // Don't hash here - let the pre-save hook handle it
      phoneNumber,
      role: 'admin',
      emailVerified: true, // Admin accounts are auto-verified
      isPublicProfile: false // Admin profiles are private by default
    });
    
    await adminUser.save();
    
    console.log('Admin account created successfully:', {
      id: adminUser._id,
      email: adminUser.email,
      role: adminUser.role,
      emailVerified: adminUser.emailVerified
    });
    
    res.status(201).json({ 
      message: 'Admin account created successfully',
      user: {
        id: adminUser._id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ message: 'Failed to create admin account' });
  }
});

// Apply authentication to all other admin routes
router.use(authenticateToken);

// Check for admin access - only admin role is allowed
router.use(isAdmin);

// Add error logging middleware
router.use((req, res, next) => {
  console.log(`Admin route accessed: ${req.method} ${req.path}`);
  console.log('User:', req.user);
  console.log('User profile:', req.userProfile);
  next();
});

// Get current secret code
router.get('/secret-code', async (req, res) => {
  try {
    res.json({ secretCode: adminSecretCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update secret code
router.put('/secret-code', async (req, res) => {
  try {
    const { newSecretCode } = req.body;
    
    if (!newSecretCode || newSecretCode.trim().length < 3) {
      return res.status(400).json({ message: 'Secret code must be at least 3 characters long' });
    }
    
    adminSecretCode = newSecretCode.trim();
    res.json({ message: 'Secret code updated successfully', secretCode: adminSecretCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get admin statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalReviews = await Review.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    
    // Calculate monthly growth (simplified)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: lastMonth } });
    const monthlyGrowth = Math.round((newUsersThisMonth / totalUsers) * 100);

    res.json({
      totalUsers,
      totalReviews,
      pendingReports,
      monthlyGrowth
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all reviews for admin
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('author.userId', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .limit(100);
    
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
    res.status(500).json({ message: error.message });
  }
});

// Get all users for admin
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-uid')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all reports for admin
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .populate('review', 'title description category')
      .populate('reportedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Handle report action (accept/reject)
router.post('/reports/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params;
    
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const report = await Report.findById(id).populate('review');
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (action === 'accept') {
      // Delete the reported review
      await Review.findByIdAndDelete(report.review._id);
      report.status = 'accepted';
    } else {
      report.status = 'rejected';
    }

    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();
    await report.save();

    res.json({ message: `Report ${action}ed successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete review
router.delete('/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PassKey Management
router.get('/passkey', async (req, res) => {
  try {
    // For now, return a default passkey or get from environment
    const defaultPassKey = process.env.ADMIN_PASSKEY || 'admin123';
    res.json({ passKey: defaultPassKey });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/passkey', async (req, res) => {
  try {
    const { newPassKey } = req.body;
    
    if (!newPassKey || newPassKey.trim().length < 6) {
      return res.status(400).json({ message: 'Passkey must be at least 6 characters long' });
    }
    
    // In a real app, you'd store this securely
    // For now, just return success
    res.json({ message: 'Passkey updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;