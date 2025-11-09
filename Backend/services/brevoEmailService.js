const brevo = require('@getbrevo/brevo');

class BrevoEmailService {
  constructor() {
    console.log('🔧 Initializing Brevo Email Service...');
    
    // Log configuration status
    console.log('📧 Brevo Configuration:');
    console.log('  - API Key:', process.env.BREVO_API_KEY ? 'Set' : 'Missing');
    console.log('  - From Email:', process.env.EMAIL_FROM_EMAIL || 'connect@truviews.in');
    console.log('  - From Name:', process.env.EMAIL_FROM_NAME || 'TruViews Team');
    
    // Initialize Brevo API client
    this.apiInstance = new brevo.TransactionalEmailsApi();
    this.apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    
    // Email configuration
    this.fromEmail = process.env.EMAIL_FROM_EMAIL || 'connect@truviews.in';
    this.fromName = process.env.EMAIL_FROM_NAME || 'TruViews Team';
    
    console.log('✅ Brevo Email Service initialized successfully');
  }

  /**
   * Send verification OTP email
   * @param {string} email - Recipient email
   * @param {string} otpCode - OTP code
   * @param {string} userName - User's name
   * @returns {Promise<{success: boolean, message: string, error?: string}>}
   */
  async sendVerificationOTP(email, otpCode, userName = 'User') {
    console.log('📧 Starting verification OTP email send via Brevo...');
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
    console.log('🔒 Starting password reset OTP email send via Brevo...');
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
   * Send email using Brevo API
   * @param {string} email - Recipient email
   * @param {string} subject - Email subject
   * @param {string} htmlBody - HTML body
   * @param {string} textBody - Text body
   * @returns {Promise<{success: boolean, message: string, error?: string}>}
   */
  async sendEmail(email, subject, htmlBody, textBody) {
    console.log('📝 Sending email via Brevo API...');
    console.log('  - To:', email);
    console.log('  - From:', `${this.fromName} <${this.fromEmail}>`);
    console.log('  - Subject:', subject);
    
    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      
      sendSmtpEmail.sender = {
        name: this.fromName,
        email: this.fromEmail
      };
      
      sendSmtpEmail.to = [{
        email: email
      }];
      
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlBody;
      sendSmtpEmail.textContent = textBody;
      
      // Add headers for better deliverability
      sendSmtpEmail.headers = {
        'X-Mailin-custom': 'custom_header_1:custom_value_1|custom_header_2:custom_value_2',
        'charset': 'iso-8859-1'
      };

      console.log('📤 Sending email via Brevo API...');
      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      
      console.log('✅ Email sent successfully via Brevo!');
      console.log('  - Message ID:', result.messageId);
      
      return {
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
        service: 'Brevo'
      };
    } catch (error) {
      console.error('❌ Error sending email via Brevo:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response?.text || error.response
      });
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
        }
        
        .logo {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header-subtitle {
            font-size: 16px;
            opacity: 0.9;
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
        }
        
        .otp-label {
            font-size: 14px;
            color: #c2410c;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
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
        }
        
        .otp-expiry {
            font-size: 13px;
            color: #c2410c;
            margin-top: 15px;
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
                <div class="security-notice-title">Security Notice</div>
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
        }
        
        .logo {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header-subtitle {
            font-size: 16px;
            opacity: 0.9;
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
        }
        
        .otp-label {
            font-size: 14px;
            color: #c2410c;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
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
        }
        
        .otp-expiry {
            font-size: 13px;
            color: #c2410c;
            margin-top: 15px;
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
                <div class="security-alert-title">Important Security Information</div>
                <div class="security-alert-text">
                    <strong>Did you request this password reset?</strong><br>
                    If yes, use the code above to reset your password.<br>
                    If no, please ignore this email - your account remains secure.
                </div>
            </div>
            
            <div class="warning-notice">
                <div class="warning-notice-title">Account Security Tips</div>
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
    return !!(process.env.BREVO_API_KEY && process.env.EMAIL_FROM_EMAIL);
  }

  /**
   * Get configuration status
   */
  getConfigStatus() {
    return {
      apiKey: !!process.env.BREVO_API_KEY,
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
      
      return {
        status: config.ready ? 'healthy' : 'unhealthy',
        configured: config.ready,
        service: 'Brevo',
        fromEmail: config.fromEmail ? process.env.EMAIL_FROM_EMAIL : 'Not configured',
        apiKey: config.apiKey ? 'Set' : 'Missing',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Brevo email service health check failed:', error);
      return {
        status: 'unhealthy',
        configured: false,
        error: error.message,
        service: 'Brevo',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
const brevoEmailService = new BrevoEmailService();
module.exports = brevoEmailService;