const nodemailer = require('nodemailer');

// Check if SendGrid is available as fallback
let sendGridAvailable = false;
try {
  if (process.env.SENDGRID_API_KEY) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sendGridAvailable = true;
    console.log('📧 SendGrid is available as fallback email service');
  }
} catch (error) {
  console.log('📧 SendGrid not available:', error.message);
}

// Check if email credentials are configured
console.log('📧 Email Service Initialization:');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set ✓' : 'Not set ✗');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set ✓' : 'Not set ✗');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('Platform:', process.platform);

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('⚠️ Email credentials not configured! Emails will fail to send.');
  console.error('Please set EMAIL_USER and EMAIL_PASSWORD in your environment variables on Render.');
  console.error('Current EMAIL_USER:', process.env.EMAIL_USER || 'undefined');
  console.error('Current EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '[HIDDEN]' : 'undefined');
}

// Create transporter with optimized settings for Render
const transporterConfig = {
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  connectionTimeout: 30000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
  pool: false,
  retryDelay: 2000,
  retryAttempts: 2
};

// Alternative configurations for production issues
const alternativeConfigs = [
  // Config 1: TLS with different settings
  {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    connectionTimeout: 15000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
    pool: false
  },
  // Config 2: SSL with different port
  {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    pool: false
  },
  // Config 3: Minimal config for Render
  {
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    connectionTimeout: 5000,
    greetingTimeout: 3000,
    socketTimeout: 5000,
    pool: false
  }
];

console.log('📧 Transporter Configuration:');
console.log('Host:', transporterConfig.host);
console.log('Port:', transporterConfig.port);
console.log('Secure:', transporterConfig.secure);
console.log('Auth User:', transporterConfig.auth.user);
console.log('Auth Pass:', transporterConfig.auth.pass ? '[HIDDEN]' : 'undefined');

let transporter = nodemailer.createTransport(transporterConfig);

// Verify transporter configuration on startup with retry
const verifyEmailService = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('⚠️ Email credentials not configured! Skipping verification.');
    return false;
  }

  // Try primary configuration first
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`🔍 Verifying email service connection (attempt ${attempt}/2) with primary config...`);
      await transporter.verify();
      console.log('✅ Email service is ready to send emails');
      return true;
    } catch (error) {
      console.error(`❌ Email transporter verification failed (attempt ${attempt}/2):`, error.message);
      console.error('Error code:', error.code);
      console.error('Error command:', error.command);
      
      if (attempt === 2) {
        console.log('🔄 Trying alternative configurations...');
        
        for (let configIndex = 0; configIndex < alternativeConfigs.length; configIndex++) {
          try {
            console.log(`🔄 Trying alternative config ${configIndex + 1}/${alternativeConfigs.length}...`);
            transporter = nodemailer.createTransport(alternativeConfigs[configIndex]);
            await transporter.verify();
            console.log(`✅ Email service is ready to send emails (using alternative config ${configIndex + 1})`);
            return true;
          } catch (altError) {
            console.error(`❌ Alternative config ${configIndex + 1} failed:`, altError.message);
            if (configIndex === alternativeConfigs.length - 1) {
              console.error('❌ All email configurations failed!');
              console.error('🔧 Troubleshooting tips:');
              console.error('1. Check if EMAIL_USER and EMAIL_PASSWORD are set correctly in Render environment variables');
              console.error('2. Ensure EMAIL_PASSWORD is a Gmail App Password (not regular password)');
              console.error('3. Verify Gmail account has 2FA enabled');
              console.error('4. Check if Gmail account is not locked or suspended');
              console.error('5. Try using a different Gmail account');
              console.error('6. Consider using SendGrid, Mailgun, or other email services for production');
              console.error('7. Render may be blocking SMTP connections - check Render documentation');
              return false;
            }
          }
        }
      }
      
      const delay = 2000;
      console.log(`⏳ Retrying verification in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
};

// Initialize email service
verifyEmailService();

// Helper function to send email with retry logic and SendGrid fallback
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
        
        // Try SendGrid as fallback if available
        if (sendGridAvailable) {
          console.log('🔄 Trying SendGrid as fallback...');
          try {
            const sgMail = require('@sendgrid/mail');
            const msg = {
              to: mailOptions.to,
              from: process.env.EMAIL_USER,
              subject: mailOptions.subject,
              html: mailOptions.html
            };
            
            await sgMail.send(msg);
            console.log(`✅ ${emailType} sent successfully via SendGrid to ${mailOptions.to}`);
            return true;
          } catch (sgError) {
            console.error('❌ SendGrid fallback also failed:', sgError.message);
          }
        }
        
        return false;
      }
      
      const delay = 2000;
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

// Test email function for debugging
const testEmail = async (testEmailAddress) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return { success: false, error: 'Email credentials not configured' };
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: testEmailAddress,
    subject: 'Test Email - Truviews',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b35;">Test Email</h2>
        <p>This is a test email from Truviews.</p>
        <p>If you receive this, the email service is working correctly.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p>Best regards,<br>The Truviews Team</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message, code: error.code };
  }
};

module.exports = {
  sendVerificationOTP,
  sendPasswordResetOTP,
  checkEmailServiceHealth,
  testEmail
}; 