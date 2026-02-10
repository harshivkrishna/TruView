const nodemailer = require('nodemailer');

class GmailService {
  constructor() {
    console.log('🔧 Initializing Optimized Gmail Service...');
    
    // Initialize Gmail transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    
    this.fromEmail = process.env.GMAIL_USER || 'noreply@truviews.com';
    this.fromName = 'TruViews';
    
    console.log('✅ Gmail Service initialized');
  }

  /**
   * Verify Gmail connection
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Gmail connection verified');
      return true;
    } catch (error) {
      console.error('❌ Gmail connection failed:', error);
      return false;
    }
  }

  /**
   * Send email using Gmail
   * @param {string} email - Recipient email
   * @param {string} subject - Email subject
   * @param {string} htmlBody - HTML body
   * @param {string} textBody - Text body
   * @returns {Promise<{success: boolean, message: string, error?: string}>}
   */
  async sendEmail(email, subject, htmlBody, textBody) {
    console.log('📝 Sending email via Gmail...');
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

      console.log('📤 Sending email via Gmail...');
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully via Gmail!');
      console.log('  - Message ID:', result.messageId);
      
      return {
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
        service: 'Gmail'
      };
    } catch (error) {
      console.error('❌ Error sending email via Gmail:', error);
      throw error;
    }
  }

  getVerificationEmailHTML(userName, otpCode) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - TruViews</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc; margin: 0; padding: 10px; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px 20px; text-align: center; }
        .logo { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .header-subtitle { font-size: 14px; }
        .content { padding: 30px 20px; }
        .greeting { font-size: 20px; font-weight: 600; color: #1a202c; margin-bottom: 15px; }
        .message { font-size: 15px; color: #4a5568; margin-bottom: 25px; line-height: 1.7; }
        .otp-container { background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); border: 2px solid #fdba74; border-radius: 12px; padding: 20px 15px; text-align: center; margin: 25px 0; }
        .otp-label { font-size: 12px; color: #c2410c; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
        .otp-code { font-size: 28px; font-weight: 700; color: #f97316; letter-spacing: 4px; font-family: 'Courier New', monospace; background: white; padding: 12px 15px; border-radius: 8px; display: inline-block; word-break: break-all; max-width: 100%; }
        .otp-expiry { font-size: 12px; color: #c2410c; margin-top: 10px; }
        .footer { background: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; color: #718096; font-size: 13px; }
        
        @media only screen and (max-width: 600px) {
            body { padding: 5px; }
            .email-container { border-radius: 8px; }
            .header { padding: 25px 15px; }
            .logo { font-size: 24px; }
            .header-subtitle { font-size: 13px; }
            .content { padding: 25px 15px; }
            .greeting { font-size: 18px; }
            .message { font-size: 14px; }
            .otp-container { padding: 15px 10px; margin: 20px 0; }
            .otp-code { font-size: 24px; letter-spacing: 3px; padding: 10px 12px; }
            .footer { padding: 15px; font-size: 12px; }
        }
        
        @media only screen and (max-width: 400px) {
            .otp-code { font-size: 20px; letter-spacing: 2px; padding: 10px; }
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
                Welcome to TruViews! Please verify your email address using the code below:
            </div>
            <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otpCode}</div>
                <div class="otp-expiry">This code expires in 10 minutes</div>
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc; margin: 0; padding: 10px; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px 20px; text-align: center; }
        .logo { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .header-subtitle { font-size: 14px; }
        .content { padding: 30px 20px; }
        .greeting { font-size: 20px; font-weight: 600; color: #1a202c; margin-bottom: 15px; }
        .message { font-size: 15px; color: #4a5568; margin-bottom: 25px; line-height: 1.7; }
        .otp-container { background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); border: 2px solid #fdba74; border-radius: 12px; padding: 20px 15px; text-align: center; margin: 25px 0; }
        .otp-label { font-size: 12px; color: #c2410c; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
        .otp-code { font-size: 28px; font-weight: 700; color: #f97316; letter-spacing: 4px; font-family: 'Courier New', monospace; background: white; padding: 12px 15px; border-radius: 8px; display: inline-block; word-break: break-all; max-width: 100%; }
        .otp-expiry { font-size: 12px; color: #c2410c; margin-top: 10px; }
        .security-alert { background: #fff7ed; border: 2px solid #fdba74; border-radius: 12px; padding: 20px 15px; margin: 25px 0; }
        .security-alert-title { font-weight: 700; color: #c2410c; margin-bottom: 8px; font-size: 14px; }
        .security-alert-text { font-size: 13px; color: #9a3412; line-height: 1.6; }
        .footer { background: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; color: #718096; font-size: 13px; }
        
        @media only screen and (max-width: 600px) {
            body { padding: 5px; }
            .email-container { border-radius: 8px; }
            .header { padding: 25px 15px; }
            .logo { font-size: 24px; }
            .header-subtitle { font-size: 13px; }
            .content { padding: 25px 15px; }
            .greeting { font-size: 18px; }
            .message { font-size: 14px; }
            .otp-container { padding: 15px 10px; margin: 20px 0; }
            .otp-code { font-size: 24px; letter-spacing: 3px; padding: 10px 12px; }
            .security-alert { padding: 15px 12px; margin: 20px 0; }
            .security-alert-title { font-size: 13px; }
            .security-alert-text { font-size: 12px; }
            .footer { padding: 15px; font-size: 12px; }
        }
        
        @media only screen and (max-width: 400px) {
            .otp-code { font-size: 20px; letter-spacing: 2px; padding: 10px; }
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
                We received a request to reset your password. Use the code below to reset your password:
            </div>
            <div class="otp-container">
                <div class="otp-label">Password Reset Code</div>
                <div class="otp-code">${otpCode}</div>
                <div class="otp-expiry">This code expires in 10 minutes</div>
            </div>
            <div class="security-alert">
                <div class="security-alert-title">Security Notice</div>
                <div class="security-alert-text">
                    If you didn't request this password reset, please ignore this email. Your account remains secure.
                </div>
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
    return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  }

  /**
   * Get configuration status
   */
  getConfigStatus() {
    return {
      gmailUser: !!process.env.GMAIL_USER,
      gmailAppPassword: !!process.env.GMAIL_APP_PASSWORD,
      fromEmail: !!this.fromEmail,
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
        service: 'Gmail',
        fromEmail: config.fromEmail ? this.fromEmail : 'Not configured',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        configured: false,
        error: error.message,
        service: 'Gmail',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
const gmailService = new GmailService();
module.exports = gmailService;
