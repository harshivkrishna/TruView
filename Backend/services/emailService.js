const nodemailer = require('nodemailer');

// Check if email credentials are configured
console.log('📧 Email Service Initialization:');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set ✓' : 'Not set ✗');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set ✓' : 'Not set ✗');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('⚠️ Email credentials not configured! Emails will fail to send.');
  console.error('Please set EMAIL_USER and EMAIL_PASSWORD in your environment variables on Render.');
}

// Create transporter with optimized settings for Render
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465, // Use SSL port instead of TLS
  secure: true, // Use SSL instead of TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD // Use app password for Gmail
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  // Connection timeout settings - reduced for Render
  connectionTimeout: 30000, // 30 seconds
  greetingTimeout: 15000,   // 15 seconds
  socketTimeout: 30000,     // 30 seconds
  // Connection pooling - disabled for Render
  pool: false,
  // Retry settings
  retryDelay: 2000, // 2 seconds between retries
  retryAttempts: 2
});

// Verify transporter configuration on startup with retry
const verifyEmailService = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('⚠️ Email credentials not configured! Skipping verification.');
    return false;
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`🔍 Verifying email service connection (attempt ${attempt}/2)...`);
      await transporter.verify();
      console.log('✅ Email service is ready to send emails');
      return true;
    } catch (error) {
      console.error(`❌ Email transporter verification failed (attempt ${attempt}/2):`, error.message);
      
      if (attempt === 2) {
        console.error('❌ Email service verification failed after 2 attempts. Emails may not work.');
        return false;
      }
      
      // Wait before retry
      const delay = 2000; // 2s
      console.log(`⏳ Retrying verification in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
};

// Initialize email service
verifyEmailService();

// Helper function to send email with retry logic
const sendEmailWithRetry = async (mailOptions, emailType, maxRetries = 2) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📨 Attempting to send ${emailType} to ${mailOptions.to} (attempt ${attempt}/${maxRetries})`);
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ ${emailType} sent successfully to ${mailOptions.to}. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send ${emailType} to ${mailOptions.to} (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt === maxRetries) {
        console.error('Full error:', error);
        return false;
      }
      
      // Wait before retry (shorter delay for Render)
      const delay = 2000; // 2s
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
};

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

  return await sendEmailWithRetry(mailOptions, 'verification OTP');
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

  return await sendEmailWithRetry(mailOptions, 'password reset OTP');
};

// Health check function
const checkEmailServiceHealth = async () => {
  try {
    await transporter.verify();
    return { status: 'healthy', message: 'Email service is operational' };
  } catch (error) {
    return { status: 'unhealthy', message: `Email service error: ${error.message}` };
  }
};

module.exports = {
  sendVerificationOTP,
  sendPasswordResetOTP,
  checkEmailServiceHealth
}; 