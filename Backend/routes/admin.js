const express = require('express');
const Review = require('../models/Review');
const User = require('../models/User');
const Report = require('../models/Report');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Default secret code
let adminSecretCode = 'truview';

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(isAdmin);

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

// Create admin account
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
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create admin user
    const adminUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      role: 'admin',
      emailVerified: true, // Admin accounts are auto-verified
      isPublicProfile: false // Admin profiles are private by default
    });
    
    await adminUser.save();
    
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
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(reviews);
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

module.exports = router;