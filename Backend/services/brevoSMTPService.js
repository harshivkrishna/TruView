const nodemailer = require('nodemailer');

class BrevoSMTPService {
  constructor() {
    console.log('🔧 Initializing Brevo SMTP Service...');
    
    // Log configuration status
    console.log('📧 Brevo SMTP Configuration:');
    console.log('  - SMTP Host:', process.env.EMAIL_HOST || 'smtp-relay.brevo.com');
    console.log('  - SMTP Port:', process.env.EMAIL_PORT || '587');
    console.log('  - From Email:', process.env.EMAIL_FROM_EMAIL || 'connect@truviews.in');
    console.log('  - From Name:', process.env.EMAIL_FROM_NAME || 'TruViews Team');
    console.log('  - Email User:', process.env.EMAIL_USER ? 'Set' : 'Missing');
    console.log('  - Email Password:', process.env.EMAIL_PASSWORD ? 'Set' : 'Missing');
    
    // Initialize Nodemailer transporter with Brevo SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true', // false for 587, true for 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    });
    
    // Email configuration
    this.fromEmail = process.env.EMAIL_FROM_EMAIL || 'connect@truviews.in';
    this.fromName = process.env.EMAIL_FROM_NAME || 'TruViews Team';
    
    // Verify transporter configuration
    this.verifyConnection();
    
    console.log('✅ Brevo SMTP Service initialized successfully');
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection() {
    try {
      console.log('🔄 Verifying Brevo SMTP connection...');
      await this.transporter.verify();
      console.log('✅ Brevo SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Brevo SMTP connection verification failed:', error.message);
      return false;
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
    console.log('📧 Starting verification OTP email send via Brevo SMTP...');
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
    console.log('🔒 Starting password reset OTP email send via Brevo SMTP...');
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
   * Send email using Brevo SMTP
   * @param {string} email - Recipient email
   * @param {string} subject - Email subject
   * @param {string} htmlBody - HTML body
   * @param {string} textBody - Text body
   * @returns {Promise<{success: boolean, message: string, error?: string}>}
   */
  async sendEmail(email, subject, htmlBody, textBody) {
    console.log('📝 Sending email via Brevo SMTP...');
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

      console.log('📤 Sending email via Brevo SMTP...');
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully via Brevo SMTP!');
      console.log('  - Message ID:', result.messageId);
      
      return {
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
        service: 'Brevo SMTP'
      };
    } catch (error) {
      console.error('❌ Error sending email via Brevo SMTP:', error);
      throw error;
    }
  }

  // Email templates (same as before but simplified)
  getVerificationEmailHTML(userName, otpCode) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - TruViews</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc; margin: 0; padding: 20px; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; font-weight: 600; color: #1a202c; margin-bottom: 20px; }
        .message { font-size: 16px; color: #4a5568; margin-bottom: 30px; line-height: 1.7; }
        .otp-container { background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); border: 2px solid #fdba74; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
        .otp-code { font-size: 36px; font-weight: 700; color: #f97316; letter-spacing: 8px; font-family: 'Courier New', monospace; background: white; padding: 15px 25px; border-radius: 8px; display: inline-block; }
        .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">TruViews</div>
            <div>Email Verification Required</div>
        </div>
        <div class="content">
            <div class="greeting">Hello ${userName},</div>
            <div class="message">
                Welcome to TruViews! Please verify your email address using the code below:
            </div>
            <div class="otp-container">
                <div class="otp-code">${otpCode}</div>
                <p>This code expires in 10 minutes</p>
            </div>
        </div>
        <div class="footer">
            <p>Best regards,<br><strong>The TruViews Team</strong></p>
        </div>
    </div>
</body>
</html>`;
  }

  getVerificationEmailText(userName, otpCode) {
    return `Hello ${userName}!\n\nWelcome to TruViews! Please verify your email address using this code: ${otpCode}\n\nThis code expires in 10 minutes.\n\nBest regards,\nThe TruViews Team`;
  }

  getPasswordResetEmailHTML(userName, otpCode) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - TruViews</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc; margin: 0; padding: 20px; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; font-weight: 600; color: #1a202c; margin-bottom: 20px; }
        .message { font-size: 16px; color: #4a5568; margin-bottom: 30px; line-height: 1.7; }
        .otp-container { background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); border: 2px solid #fdba74; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
        .otp-code { font-size: 36px; font-weight: 700; color: #f97316; letter-spacing: 8px; font-family: 'Courier New', monospace; background: white; padding: 15px 25px; border-radius: 8px; display: inline-block; }
        .security-alert { background: #fff7ed; border: 2px solid #fdba74; border-radius: 12px; padding: 25px; margin: 30px 0; }
        .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">TruViews</div>
            <div>Password Reset Request</div>
        </div>
        <div class="content">
            <div class="greeting">Hello ${userName},</div>
            <div class="message">
                We received a request to reset your password. Use the code below to reset your password:
            </div>
            <div class="otp-container">
                <div class="otp-code">${otpCode}</div>
                <p>This code expires in 10 minutes</p>
            </div>
            <div class="security-alert">
                <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email.
            </div>
        </div>
        <div class="footer">
            <p>Best regards,<br><strong>The TruViews Security Team</strong></p>
        </div>
    </div>
</body>
</html>`;
  }

  getPasswordResetEmailText(userName, otpCode) {
    return `Hello ${userName}!\n\nWe received a request to reset your password. Use this code: ${otpCode}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe TruViews Security Team`;
  }

  /**
   * Check if email service is properly configured
   */
  isConfigured() {
    return !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.EMAIL_FROM_EMAIL);
  }

  /**
   * Get configuration status
   */
  getConfigStatus() {
    return {
      emailUser: !!process.env.EMAIL_USER,
      emailPassword: !!process.env.EMAIL_PASSWORD,
      emailHost: !!process.env.EMAIL_HOST,
      fromEmail: !!process.env.EMAIL_FROM_EMAIL,
      ready: this.isConfigured()
    };
  }

  /**
   * Check email service health
   */
  async checkEmailServiceHealth() {
    try {
      const config = this.getConfigStatus();
      
      let connectionStatus = 'unknown';
      try {
        const connected = await this.verifyConnection();
        connectionStatus = connected ? 'connected' : 'failed';
      } catch (error) {
        connectionStatus = 'failed';
      }
      
      return {
        status: config.ready && connectionStatus === 'connected' ? 'healthy' : 'unhealthy',
        configured: config.ready,
        connection: connectionStatus,
        service: 'Brevo SMTP',
        host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
        port: process.env.EMAIL_PORT || '587',
        fromEmail: config.fromEmail ? process.env.EMAIL_FROM_EMAIL : 'Not configured',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        configured: false,
        error: error.message,
        service: 'Brevo SMTP',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
const brevoSMTPService = new BrevoSMTPService();
module.exports = brevoSMTPService;