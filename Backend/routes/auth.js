const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailService = require('../services/emailService'); // Now uses Gmail
const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  const startTime = Date.now();
  
  console.log('\n' + '='.repeat(70));
  console.log('📝 REGISTRATION REQUEST RECEIVED');
  console.log('='.repeat(70));
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected during registration');
      return res.status(503).json({ message: 'Service temporarily unavailable. Please try again.' });
    }

    const { email, password, firstName, lastName, phoneNumber } = req.body;
    console.log(`📧 Email: ${email}`);

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

    // Send verification email via Nodemailer
    console.log('\n📧 ATTEMPTING TO SEND VERIFICATION EMAIL');
    console.log('  To:', email);
    console.log('  OTP:', otp);
    console.log('  Name:', firstName);
    
    const emailStart = Date.now();
    const emailResult = await emailService.sendVerificationOTP(email, otp, firstName);
    console.log(`⏱️ Email sending took ${Date.now() - emailStart}ms`);
    console.log('📬 Email Result:', JSON.stringify(emailResult, null, 2));

    if (!emailResult.success) {
      console.error('❌ Failed to send verification email:', emailResult.error);
      console.error('Full error details:', emailResult);
      // Still return success but mention email issue
      return res.status(201).json({ 
        message: 'Registration successful, but failed to send verification email. Please contact support.',
        userId: user._id,
        email: email,
        firstName: firstName,
        emailError: true
      });
    }
    
    console.log('✅ Verification email sent successfully!');
    console.log('Message ID:', emailResult.messageId);

    const totalTime = Date.now() - startTime;
    console.log(`✅ Registration completed in ${totalTime}ms`);

    res.status(201).json({ 
      message: 'Registration successful. Please check your email for verification OTP.',
      userId: user._id,
      email: email,
      firstName: firstName
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

    // Send verification email via Nodemailer
    console.log('\n📧 ATTEMPTING TO RESEND VERIFICATION EMAIL');
    console.log('  To:', email);
    console.log('  OTP:', otp);
    console.log('  Name:', user.firstName);
    
    const emailResult = await emailService.sendVerificationOTP(email, otp, user.firstName);
    console.log('📬 Email Result:', JSON.stringify(emailResult, null, 2));
    
    if (!emailResult.success) {
      console.error('❌ Failed to send verification email:', emailResult.error);
      console.error('Full error details:', emailResult);
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again.',
        error: emailResult.error
      });
    }

    console.log('✅ Verification email resent successfully!');
    console.log('Message ID:', emailResult.messageId);

    res.json({ 
      message: 'Verification OTP sent successfully',
      email: email,
      firstName: user.firstName
    });
  } catch (error) {
    // console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to resend verification OTP' });
  }
});

// Admin Login (Hardcoded)
router.post('/admin/login', async (req, res) => {
  try {
    console.log('🔐 Admin login attempt received');
    console.log('Request body:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Hardcoded admin credentials
    const ADMIN_EMAIL = 'connect@truviews.in';
    const ADMIN_PASSWORD = 'Admin@1009';
    
    // Validate admin credentials
    if (email !== ADMIN_EMAIL) {
      return res.status(404).json({ message: 'Admin email not recognized' });
    }
    
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Incorrect admin password' });
    }
    
    // Create admin JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { 
        userId: 'admin', 
        email: ADMIN_EMAIL, 
        role: 'admin',
        isAdmin: true 
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Admin login successful');
    
    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: 'admin',
        email: ADMIN_EMAIL,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isAdmin: true
      }
    });
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
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
      return res.status(404).json({ message: 'Email not registered. Please sign up first.' });
    }

    const passwordCheckStart = Date.now();
    const isPasswordValid = await user.comparePassword(password);
    console.log(`⏱️ Password verification took ${Date.now() - passwordCheckStart}ms`);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    if (!user.emailVerified) {
      console.log(`📧 User ${user.email} is not verified, sending verification OTP`);
      
      // Generate verification OTP
      const otp = user.generateOTP();
      user.verificationOTP = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      };
      
      await user.save();
      
      // Send verification email via Nodemailer
      console.log('\n📧 ATTEMPTING TO SEND VERIFICATION EMAIL (LOGIN)');
      console.log('  To:', user.email);
      console.log('  OTP:', otp);
      console.log('  Name:', user.firstName);
      
      const emailResult = await emailService.sendVerificationOTP(user.email, otp, user.firstName);
      console.log('📬 Email Result:', JSON.stringify(emailResult, null, 2));
      
      if (!emailResult.success) {
        console.error('❌ Failed to send verification email:', emailResult.error);
        console.error('Full error details:', emailResult);
        return res.status(500).json({ 
          message: 'Failed to send verification email. Please try again.',
          error: emailResult.error
        });
      }
      
      console.log(`✅ Verification OTP generated and sent for: ${user.email}`);
      console.log('Message ID:', emailResult.messageId);
      return res.status(200).json({ 
        message: 'Email verification required. OTP sent to your email.',
        requiresVerification: true,
        email: user.email,
        firstName: user.firstName
      });
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
    console.log('📧 Forgot password request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request body type:', typeof req.body);
    
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected during forgot password');
      return res.status(503).json({ message: 'Service temporarily unavailable. Please try again.' });
    }

    // Handle nested email object from frontend
    let emailStr;
    if (req.body.email && typeof req.body.email === 'object' && req.body.email.email) {
      // Frontend sent nested object: { email: { email: "actual@email.com", ... } }
      emailStr = req.body.email.email.trim();
      console.log('Extracted email from nested object:', emailStr);
    } else if (typeof req.body.email === 'string') {
      // Normal case: { email: "actual@email.com" }
      emailStr = req.body.email.trim();
      console.log('Extracted email from string:', emailStr);
    } else {
      console.log('❌ Invalid email format in request body:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!emailStr) {
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log(`🔍 Looking for user with email: ${emailStr}`);
    const user = await User.findOne({ email: emailStr });
    if (!user) {
      console.log(`❌ User not found with email: ${emailStr}`);
      return res.status(404).json({ 
        message: 'No account found with this email address. Please check your email or create a new account.',
        code: 'USER_NOT_FOUND'
      });
    }

    console.log(`✅ User found: ${user.firstName} ${user.lastName}`);

    // Generate OTP
    const otp = user.generateOTP();
    console.log(`🔐 Generated OTP for user: ${user.email}`);
    
    user.resetPasswordOTP = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };

    await user.save();
    console.log(`💾 OTP saved to database for user: ${user.email}`);

    // Send password reset email via Nodemailer
    console.log('\n📧 ATTEMPTING TO SEND PASSWORD RESET EMAIL');
    console.log('  To:', emailStr);
    console.log('  OTP:', otp);
    console.log('  Name:', user.firstName);
    
    const emailResult = await emailService.sendPasswordResetOTP(emailStr, otp, user.firstName);
    console.log('📬 Email Result:', JSON.stringify(emailResult, null, 2));
    
    if (!emailResult.success) {
      console.error('❌ Failed to send password reset email:', emailResult.error);
      console.error('Full error details:', emailResult);
      return res.status(500).json({ 
        message: 'Failed to send password reset email. Please try again.',
        error: emailResult.error
      });
    }

    console.log(`✅ Password reset OTP generated and sent for: ${emailStr}`);
    console.log('Message ID:', emailResult.messageId);
    res.json({ 
      message: 'Password reset OTP sent successfully',
      email: emailStr,
      firstName: user.firstName
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ message: 'Failed to send password reset OTP' });
  }
});

// Verify OTP during login
router.post('/verify-login-otp', async (req, res) => {
  try {
    console.log('🔐 Login OTP verification request received');
    
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected during OTP verification');
      return res.status(503).json({ message: 'Service temporarily unavailable. Please try again.' });
    }

    const { email, otp } = req.body;
    
    console.log('Extracted values:');
    console.log('- email:', email, '(type:', typeof email, ')');
    console.log('- otp:', otp, '(type:', typeof otp, ')');
    
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Ensure email is a string
    const emailStr = String(email).trim();
    console.log(`🔍 Looking for user with email: ${emailStr}`);
    const user = await User.findOne({ email: emailStr });
    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP exists and is valid
    if (!user.verificationOTP || !user.verificationOTP.code) {
      console.log(`❌ No verification OTP found for user: ${email}`);
      return res.status(400).json({ message: 'No verification OTP found. Please request a new one.' });
    }

    if (user.verificationOTP.expiresAt < new Date()) {
      console.log(`❌ Verification OTP expired for user: ${email}`);
      return res.status(400).json({ message: 'Verification OTP has expired. Please request a new one.' });
    }

    if (user.verificationOTP.code !== otp) {
      console.log(`❌ Invalid OTP for user: ${email}`);
      return res.status(400).json({ message: 'Invalid verification OTP' });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.verificationOTP = undefined; // Clear the OTP
    await user.save();

    console.log(`✅ Email verified successfully for user: ${email}`);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Update last login asynchronously
    User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    ).exec().catch(err => console.error('Failed to update lastLogin:', err));

    console.log(`✅ Login successful for verified user: ${email}`);
    res.json({
      message: 'Email verified and login successful',
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
    console.error('❌ Login OTP verification error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  console.log('\n' + '='.repeat(70));
  console.log('🔒 PASSWORD RESET REQUEST RECEIVED');
  console.log('='.repeat(70));
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request body type:', typeof req.body);
  
  try {
    // Handle nested object structure from frontend
    let emailStr, otp, newPassword;
    
    if (req.body.email && typeof req.body.email === 'object') {
      // Frontend sent nested object: { email: { email: "actual@email.com", otp: "123456", newPassword: "pass" } }
      emailStr = req.body.email.email?.trim();
      otp = req.body.email.otp;
      newPassword = req.body.email.newPassword;
      console.log('Extracted from nested object:');
    } else {
      // Normal case: { email: "actual@email.com", otp: "123456", newPassword: "pass" }
      emailStr = req.body.email?.trim();
      otp = req.body.otp;
      newPassword = req.body.newPassword;
      console.log('Extracted from flat object:');
    }
    
    console.log('- email:', emailStr);
    console.log('- otp:', otp);
    console.log('- newPassword:', newPassword ? '[PROVIDED]' : '[MISSING]');
    
    if (!emailStr || !otp || !newPassword) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }
    
    console.log(`🔍 Looking for user: ${emailStr}`);

    const user = await User.findOne({ email: emailStr });
    if (!user) {
      console.log(`❌ User not found: ${emailStr}`);
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetPasswordOTP || !user.resetPasswordOTP.code) {
      console.log(`❌ No password reset OTP found for: ${emailStr}`);
      return res.status(400).json({ message: 'No password reset OTP found' });
    }

    if (user.resetPasswordOTP.expiresAt < new Date()) {
      console.log(`❌ OTP expired for: ${emailStr}`);
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (user.resetPasswordOTP.code !== otp) {
      console.log(`❌ Invalid OTP for: ${emailStr}`);
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update password
    console.log(`✅ Resetting password for: ${emailStr}`);
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    await user.save();

    console.log(`✅ Password reset successfully for: ${emailStr}`);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ message: 'Password reset failed' });
  }
});

module.exports = router;