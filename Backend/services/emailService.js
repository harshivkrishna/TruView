const nodemailer = require('nodemailer');

// Check if email credentials are configured
console.log('📧 Email Service Initialization:');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set ✓' : 'Not set ✗');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set ✓' : 'Not set ✗');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('⚠️ Email credentials not configured! Emails will fail to send.');
  console.error('Please set EMAIL_USER and EMAIL_PASSWORD in your environment variables on Render.');
}

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD // Use app password for Gmail
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration on startup
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email transporter verification failed:', error.message);
    } else {
      console.log('✅ Email service is ready to send emails');
    }
  });
}

// Send verification OTP
const sendVerificationOTP = async (email, otp, firstName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email - Truviews',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b35;">Welcome to Truviews!</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for signing up! Please use the following OTP to verify your email address:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #ff6b35; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>Best regards,<br>The Truviews Team</p>
      </div>
    `
  };

  try {
    console.log(`📨 Attempting to send verification OTP to ${email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification OTP sent successfully to ${email}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send verification OTP to ${email}:`, error.message);
    console.error('Full error:', error);
    return false;
  }
};

// Send password reset OTP
const sendPasswordResetOTP = async (email, otp, firstName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Your Password - Truviews',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b35;">Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your password. Use the following OTP to create a new password:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #ff6b35; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
        <p>Best regards,<br>The Truviews Team</p>
      </div>
    `
  };

  try {
    console.log(`📨 Attempting to send password reset OTP to ${email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset OTP sent successfully to ${email}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send password reset OTP to ${email}:`, error.message);
    console.error('Full error:', error);
    return false;
  }
};

module.exports = {
  sendVerificationOTP,
  sendPasswordResetOTP
}; 