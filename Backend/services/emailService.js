const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    console.log('🔧 Initializing EmailService with Nodemailer...');
    
    // Log configuration status
    console.log('📧 Email Configuration:');
    console.log('  - SMTP Host:', process.env.EMAIL_HOST || 'smtp.gmail.com');
    console.log('  - SMTP Port:', process.env.EMAIL_PORT || '587');
    console.log('  - From Email:', process.env.EMAIL_FROM_EMAIL || 'connect@truviews.in');
    console.log('  - From Name:', process.env.EMAIL_FROM_NAME || 'TruViews Team');
    console.log('  - Email User:', process.env.EMAIL_USER ? 'Set' : 'Missing');
    console.log('  - Email Password:', process.env.EMAIL_PASSWORD ? 'Set' : 'Missing');
    
    // Initialize Nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Email configuration
    this.fromEmail = process.env.EMAIL_FROM_EMAIL || 'connect@truviews.in';
    this.fromName = process.env.EMAIL_FROM_NAME || 'TruViews Team';
    
    // Verify transporter configuration
    this.verifyConnection();
    
    console.log('✅ EmailService initialized successfully');
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (error) {
      console.error('❌ SMTP connection verification failed:', error.message);
    }
  }

  /**
   * Send verification OTP email
   * @param {string} email - Recipient email
   * @param {string} otpCode - OTP code
   * @param {string} userName - User's name
   * @returns {Promise<{success: boolean, message: string, error?: string}>}
   */
  async sendVerificationOTP(email, otpCode, userName = 'User') {
    console.log('📧 Starting verification OTP email send...');
    console.log('  - To:', email);
    console.log('  - User:', userName);
    console.log('  - OTP:', otpCode);
    
    try {
      const subject = 'Verify Your Email - TruViews';
      const htmlBody = this.getVerificationEmailHTML(userName, otpCode);
      const textBody = this.getVerificationEmailText(userName, otpCode);
      
      return await this.sendEmail(email, subject, htmlBody, textBody);
    } catch (error) {
      console.error('❌ Error sending verification OTP:', error);
      return {
        success: false,
        message: 'Failed to send verification email',
        error: error.message
      };
    }
  }

  /**
   * Send password reset OTP email
   * @param {string} email - Recipient email
   * @param {string} otpCode - OTP code
   * @param {string} userName - User's name
   * @returns {Promise<{success: boolean, message: string, error?: string}>}
   */
  async sendPasswordResetOTP(email, otpCode, userName = 'User') {
    console.log('🔒 Starting password reset OTP email send...');
    console.log('  - To:', email);
    console.log('  - User:', userName);
    console.log('  - OTP:', otpCode);
    
    try {
      const subject = 'Reset Your Password - TruViews';
      const htmlBody = this.getPasswordResetEmailHTML(userName, otpCode);
      const textBody = this.getPasswordResetEmailText(userName, otpCode);
      
      return await this.sendEmail(email, subject, htmlBody, textBody);
    } catch (error) {
      console.error('❌ Error sending password reset OTP:', error);
      return {
        success: false,
        message: 'Failed to send password reset email',
        error: error.message
      };
    }
  }

  /**
   * Send email using Nodemailer
   * @param {string} email - Recipient email
   * @param {string} subject - Email subject
   * @param {string} htmlBody - HTML body
   * @param {string} textBody - Text body
   * @returns {Promise<{success: boolean, message: string, error?: string}>}
   */
  async sendEmail(email, subject, htmlBody, textBody) {
    console.log('📝 Sending email...');
    console.log('  - To:', email);
    console.log('  - From:', `${this.fromName} <${this.fromEmail}>`);
    console.log('  - Subject:', subject);
    
    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: subject,
        text: textBody,
        html: htmlBody,
      };

      console.log('📤 Sending email via Nodemailer...');
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully!');
      console.log('  - Message ID:', result.messageId);
      
      return {
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId
      };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  /**
   * Get verification email HTML template with modern design
   */
  getVerificationEmailHTML(userName, otpCode) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - TruViews</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        }
        
        .logo {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }
        
        .header-subtitle {
            font-size: 16px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .otp-container {
            background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
            border: 2px solid #fdba74;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            position: relative;
            overflow: hidden;
        }
        
        .otp-container::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(249, 115, 22, 0.05) 0%, transparent 70%);
            animation: pulse 3s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .otp-label {
            font-size: 14px;
            color: #c2410c;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            position: relative;
            z-index: 1;
        }
        
        .otp-code {
            font-size: 36px;
            font-weight: 700;
            color: #f97316;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            background: white;
            padding: 15px 25px;
            border-radius: 8px;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
            position: relative;
            z-index: 1;
        }
        
        .otp-expiry {
            font-size: 13px;
            color: #c2410c;
            margin-top: 15px;
            position: relative;
            z-index: 1;
        }
        
        .security-notice {
            background: #fff7ed;
            border-left: 4px solid #f97316;
            padding: 20px;
            border-radius: 0 8px 8px 0;
            margin: 30px 0;
        }
        
        .security-notice-title {
            font-weight: 600;
            color: #c2410c;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
        }
        
        .security-notice-text {
            font-size: 14px;
            color: #9a3412;
            line-height: 1.6;
        }
        
        .footer {
            background: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
            color: #718096;
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .company-name {
            font-weight: 600;
            color: #4a5568;
        }
        
        .disclaimer {
            font-size: 12px;
            color: #a0aec0;
            margin-top: 20px;
            line-height: 1.5;
        }
        
        .icon {
            display: inline-block;
            margin-right: 8px;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .header, .content, .footer {
                padding: 25px 20px;
            }
            
            .otp-code {
                font-size: 28px;
                letter-spacing: 4px;
                padding: 12px 20px;
            }
            
            .greeting {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">TruViews</div>
            <div class="header-subtitle">Email Verification Required</div>
        </div>
        
        <div class="content">
            <div class="greeting">Hello ${userName},</div>
            
            <div class="message">
                Welcome to TruViews! We're excited to have you join our community of authentic reviewers. 
                To complete your registration and secure your account, please verify your email address using the verification code below.
            </div>
            
            <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otpCode}</div>
                <div class="otp-expiry">This code expires in 10 minutes</div>
            </div>
            
            <div class="security-notice">
                <div class="security-notice-title">
                    <span class="icon"></span>
                    Security Notice
                </div>
                <div class="security-notice-text">
                    If you didn't create an account with TruViews, please ignore this email. 
                    Your email address will not be used for any purpose without your consent.
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                Best regards,<br>
                <span class="company-name">The TruViews Team</span>
            </div>
            
            <div class="disclaimer">
                This is an automated security message. Please do not reply to this email.
                If you need assistance, please contact our support team through the TruViews platform.
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Get verification email text template
   */
  getVerificationEmailText(userName, otpCode) {
    return `
TruViews - Email Verification

Hello ${userName}!

Welcome to TruViews! We're excited to have you join our community of authentic reviewers.

To complete your registration and secure your account, please verify your email address using the verification code below:

VERIFICATION CODE: ${otpCode}

This code expires in 10 minutes.

SECURITY NOTICE:
If you didn't create an account with TruViews, please ignore this email. Your email address will not be used for any purpose without your consent.

Best regards,
The TruViews Team

---
This is an automated security message. Please do not reply to this email.
If you need assistance, please contact our support team through the TruViews platform.
`;
  }

  /**
   * Get password reset email HTML template with modern design
   */
  getPasswordResetEmailHTML(userName, otpCode) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - TruViews</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        }
        
        .logo {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }
        
        .header-subtitle {
            font-size: 16px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .otp-container {
            background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
            border: 2px solid #fdba74;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            position: relative;
            overflow: hidden;
        }
        
        .otp-container::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(249, 115, 22, 0.05) 0%, transparent 70%);
            animation: pulse 3s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .otp-label {
            font-size: 14px;
            color: #c2410c;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            position: relative;
            z-index: 1;
        }
        
        .otp-code {
            font-size: 36px;
            font-weight: 700;
            color: #f97316;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            background: white;
            padding: 15px 25px;
            border-radius: 8px;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
            position: relative;
            z-index: 1;
        }
        
        .otp-expiry {
            font-size: 13px;
            color: #c2410c;
            margin-top: 15px;
            position: relative;
            z-index: 1;
        }
        
        .security-alert {
            background: #fff7ed;
            border: 2px solid #fdba74;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .security-alert-title {
            font-weight: 700;
            color: #c2410c;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            font-size: 16px;
        }
        
        .security-alert-text {
            font-size: 14px;
            color: #9a3412;
            line-height: 1.6;
        }
        
        .warning-notice {
            background: #fff7ed;
            border-left: 4px solid #f97316;
            padding: 20px;
            border-radius: 0 8px 8px 0;
            margin: 30px 0;
        }
        
        .warning-notice-title {
            font-weight: 600;
            color: #c2410c;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
        }
        
        .warning-notice-text {
            font-size: 14px;
            color: #9a3412;
            line-height: 1.6;
        }
        
        .footer {
            background: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
            color: #718096;
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .company-name {
            font-weight: 600;
            color: #4a5568;
        }
        
        .disclaimer {
            font-size: 12px;
            color: #a0aec0;
            margin-top: 20px;
            line-height: 1.5;
        }
        
        .icon {
            display: inline-block;
            margin-right: 8px;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .header, .content, .footer {
                padding: 25px 20px;
            }
            
            .otp-code {
                font-size: 28px;
                letter-spacing: 4px;
                padding: 12px 20px;
            }
            
            .greeting {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">TruViews</div>
            <div class="header-subtitle">Password Reset Request</div>
        </div>
        
        <div class="content">
            <div class="greeting">Hello ${userName},</div>
            
            <div class="message">
                We received a request to reset your password for your TruViews account. 
                If this was you, please use the verification code below to proceed with resetting your password.
            </div>
            
            <div class="otp-container">
                <div class="otp-label">Password Reset Code</div>
                <div class="otp-code">${otpCode}</div>
                <div class="otp-expiry">This code expires in 10 minutes</div>
            </div>
            
            <div class="security-alert">
                <div class="security-alert-title">
                    <span class="icon"></span>
                    Important Security Information
                </div>
                <div class="security-alert-text">
                    <strong>Did you request this password reset?</strong><br>
                    If yes, use the code above to reset your password.<br>
                    If no, please ignore this email - your account remains secure.
                </div>
            </div>
            
            <div class="warning-notice">
                <div class="warning-notice-title">
                    <span class="icon"></span>
                    Account Security Tips
                </div>
                <div class="warning-notice-text">
                    • Never share your verification codes with anyone<br>
                    • TruViews will never ask for your password via email<br>
                    • If you suspect unauthorized access, contact our support team immediately
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                Best regards,<br>
                <span class="company-name">The TruViews Security Team</span>
            </div>
            
            <div class="disclaimer">
                This is an automated security message. Please do not reply to this email.
                If you need assistance, please contact our support team through the TruViews platform.
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Get password reset email text template
   */
  getPasswordResetEmailText(userName, otpCode) {
    return `
TruViews - Password Reset Request

Hello ${userName}!

We received a request to reset your password for your TruViews account.

If this was you, please use the verification code below to proceed with resetting your password:

PASSWORD RESET CODE: ${otpCode}

This code expires in 10 minutes.

IMPORTANT SECURITY INFORMATION:
Did you request this password reset?
- If yes, use the code above to reset your password.
- If no, please ignore this email - your account remains secure.

ACCOUNT SECURITY TIPS:
• Never share your verification codes with anyone
• TruViews will never ask for your password via email
• If you suspect unauthorized access, contact our support team immediately

Best regards,
The TruViews Security Team

---
This is an automated security message. Please do not reply to this email.
If you need assistance, please contact our support team through the TruViews platform.
`;
  }

  /**
   * Check if email service is properly configured
   */
  isConfigured() {
    return !!(
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASSWORD &&
      process.env.EMAIL_FROM_EMAIL
    );
  }

  /**
   * Get configuration status
   */
  getConfigStatus() {
    return {
      emailUser: !!process.env.EMAIL_USER,
      emailPassword: !!process.env.EMAIL_PASSWORD,
      emailHost: !!process.env.EMAIL_HOST,
      emailPort: !!process.env.EMAIL_PORT,
      fromEmail: !!process.env.EMAIL_FROM_EMAIL,
      fromName: !!process.env.EMAIL_FROM_NAME,
      ready: this.isConfigured()
    };
  }

  /**
   * Check email service health for server health endpoint
   */
  async checkEmailServiceHealth() {
    try {
      const config = this.getConfigStatus();
      
      // Test SMTP connection
      let connectionStatus = 'unknown';
      try {
        await this.transporter.verify();
        connectionStatus = 'connected';
      } catch (error) {
        connectionStatus = 'failed';
        console.error('SMTP connection test failed:', error.message);
      }
      
      return {
        status: config.ready && connectionStatus === 'connected' ? 'healthy' : 'unhealthy',
        configured: config.ready,
        connection: connectionStatus,
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || '587',
        fromEmail: config.fromEmail ? process.env.EMAIL_FROM_EMAIL : 'Not configured',
        service: 'Nodemailer'
      };
    } catch (error) {
      console.error('❌ Email service health check failed:', error);
      return {
        status: 'unhealthy',
        configured: false,
        error: error.message,
        service: 'Nodemailer'
      };
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
module.exports = emailService;