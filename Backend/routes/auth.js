const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationOTP, sendPasswordResetOTP } = require('../services/emailService');
const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected during registration');
      return res.status(503).json({ message: 'Service temporarily unavailable. Please try again.' });
    }

    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate phone number format (exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
    }

    console.log(`⏱️ Registration validation took ${Date.now() - startTime}ms`);
    const dbCheckStart = Date.now();

    // Check both email and phone in parallel for faster response
    const [existingUserByEmail, existingUserByPhone] = await Promise.all([
      User.findOne({ email }).select('_id').lean().exec(),
      User.findOne({ phoneNumber }).select('_id').lean().exec()
    ]);

    console.log(`⏱️ DB existence check took ${Date.now() - dbCheckStart}ms`);

    if (existingUserByEmail) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    if (existingUserByPhone) {
      return res.status(400).json({ message: 'User already exists with this phone number' });
    }

    // Generate OTP before creating user
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const userCreateStart = Date.now();

    // Create user with unverified email
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      emailVerified: false,
      verificationOTP: {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      }
    });

    await user.save();
    console.log(`⏱️ User creation (including bcrypt) took ${Date.now() - userCreateStart}ms`);

    // Send verification email asynchronously (don't wait)
    sendVerificationOTP(email, otp, firstName).catch(err => {
      console.error('Failed to send verification email (async):', err.message);
    });

    const totalTime = Date.now() - startTime;
    console.log(`✅ Registration completed in ${totalTime}ms`);

    res.status(201).json({ 
      message: 'Registration successful. Please check your email for verification OTP.',
      userId: user._id 
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    console.error('Registration error stack:', error.stack);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Verify email with OTP
router.post('/verify-email', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected during email verification');
      return res.status(503).json({ message: 'Service temporarily unavailable. Please try again.' });
    }

    const { email, otp } = req.body;

    const user = await User.findOne({ email })
      .select('email firstName lastName phoneNumber role emailVerified verificationOTP')
      .exec();
      
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    if (!user.verificationOTP || !user.verificationOTP.code) {
      return res.status(400).json({ message: 'No verification OTP found' });
    }

    if (user.verificationOTP.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (user.verificationOTP.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark email as verified using updateOne for better performance
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { emailVerified: true },
        $unset: { verificationOTP: '' }
      }
    ).exec();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const totalTime = Date.now() - startTime;
    console.log(`✅ Email verification completed in ${totalTime}ms`);

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        emailVerified: true
      }
    });
  } catch (error) {
    console.error('Email verification error:', error.message);
    res.status(500).json({ message: 'Email verification failed' });
  }
});

// Resend verification OTP
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    user.verificationOTP = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };

    await user.save();

    // Send verification email
    const emailSent = await sendVerificationOTP(email, otp, user.firstName);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.json({ message: 'Verification OTP sent successfully' });
  } catch (error) {
    // console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to resend verification OTP' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected during login');
      return res.status(503).json({ message: 'Service temporarily unavailable. Please try again.' });
    }

    const { email, password } = req.body;

    const dbQueryStart = Date.now();
    // Only fetch fields we need for better performance
    const user = await User.findOne({ email })
      .select('email password firstName lastName phoneNumber role emailVerified lastLogin')
      .exec();
    
    console.log(`⏱️ User lookup took ${Date.now() - dbQueryStart}ms`);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordCheckStart = Date.now();
    const isPasswordValid = await user.comparePassword(password);
    console.log(`⏱️ Password verification took ${Date.now() - passwordCheckStart}ms`);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.emailVerified) {
      return res.status(401).json({ message: 'Please verify your email before logging in' });
    }

    // Update last login asynchronously (don't wait for it)
    User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    ).exec().catch(err => console.error('Failed to update lastLogin:', err));

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const totalTime = Date.now() - startTime;
    console.log(`✅ Login completed in ${totalTime}ms`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    console.error('Login error stack:', error.stack);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate OTP
    const otp = user.generateOTP();
    user.resetPasswordOTP = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };

    await user.save();

    // Send password reset email
    const emailSent = await sendPasswordResetOTP(email, otp, user.firstName);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send password reset email' });
    }

    res.json({ message: 'Password reset OTP sent successfully' });
  } catch (error) {
    // console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send password reset OTP' });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetPasswordOTP || !user.resetPasswordOTP.code) {
      return res.status(400).json({ message: 'No password reset OTP found' });
    }

    if (user.resetPasswordOTP.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (user.resetPasswordOTP.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    // console.error('Reset password error:', error);
    res.status(500).json({ message: 'Password reset failed' });
  }
});

module.exports = router;