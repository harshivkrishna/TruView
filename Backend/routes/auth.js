const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationOTP, sendPasswordResetOTP } = require('../services/emailService');
const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  try {
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

    // Check if user already exists with email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check if user already exists with phone number
    const existingUserByPhone = await User.findOne({ phoneNumber });
    if (existingUserByPhone) {
      return res.status(400).json({ message: 'User already exists with this phone number' });
    }

    // Create user with unverified email
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      emailVerified: false
    });

    // Generate OTP
    const otp = user.generateOTP();
    user.verificationOTP = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };

    await user.save();

    // Send verification email
    const emailSent = await sendVerificationOTP(email, otp, firstName);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.status(201).json({ 
      message: 'Registration successful. Please check your email for verification OTP.',
      userId: user._id 
    });
  } catch (error) {
    // console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Verify email with OTP
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
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

    // Mark email as verified
    user.emailVerified = true;
    user.verificationOTP = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

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
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    // console.error('Email verification error:', error);
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
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // console.log('Login attempt: User not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // console.log('Login attempt: User found:', {
    //   id: user._id,
    //   email: user.email,
    //   role: user.role,
    //   emailVerified: user.emailVerified
    // });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // console.log('Login attempt: Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.emailVerified) {
      // console.log('Login attempt: Email not verified for user:', email);
      return res.status(401).json({ message: 'Please verify your email before logging in' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

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
    // console.error('Login error:', error);
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