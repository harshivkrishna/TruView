const { SESClient, SendEmailCommand, SendTemplatedEmailCommand } = require('@aws-sdk/client-ses');

class EmailService {
  constructor() {
    console.log('🔧 Initializing EmailService...');
    
    // Log configuration status
    console.log('📧 SES Configuration:');
    console.log('  - AWS Region:', process.env.AWS_REGION || 'ap-south-1');
    console.log('  - From Email:', process.env.SES_FROM_EMAIL || 'noreply@truviews.in');
    console.log('  - From Name:', process.env.SES_FROM_NAME || 'TruView Team');
    console.log('  - Verification Template:', process.env.SES_VERIFICATION_TEMPLATE || 'Not set');
    console.log('  - Password Reset Template:', process.env.SES_PASSWORD_RESET_TEMPLATE || 'Not set');
    console.log('  - AWS Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Missing');
    console.log('  - AWS Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Missing');
    
    // Initialize SES client
    const awsConfig = {
      region: process.env.AWS_REGION || 'ap-south-1',
    };
    
    // Only add credentials if they exist (AWS SDK will use default credential chain if not provided)
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      awsConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
      };
    }
    
    this.sesClient = new SESClient(awsConfig);
    
    // Email configuration
    this.fromEmail = process.env.SES_FROM_EMAIL || 'noreply@truviews.in';
    this.fromName = process.env.SES_FROM_NAME || 'TruView Team';
    
    console.log('✅ EmailService initialized successfully');
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
      const templateName = process.env.SES_VERIFICATION_TEMPLATE;
      console.log('  - Template Name:', templateName || 'Not configured, using raw email');
      
      if (templateName) {
        // Use SES template if configured
        console.log('📋 Using SES template for verification email');
        return await this.sendTemplatedEmail(templateName, email, {
          userName,
          otpCode,
          companyName: 'TruView'
        });
      } else {
        // Use raw email if no template configured
        console.log('📝 Using raw HTML email for verification');
        const subject = 'Verify Your Email - TruView';
        const htmlBody = this.getVerificationEmailHTML(userName, otpCode);
        const textBody = this.getVerificationEmailText(userName, otpCode);
        
        return await this.sendRawEmail(email, subject, htmlBody, textBody);
      }
    } catch (error) {
      console.error('❌ Error sending verification OTP:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId
      });
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
      const templateName = process.env.SES_PASSWORD_RESET_TEMPLATE;
      console.log('  - Template Name:', templateName || 'Not configured, using raw email');
      
      if (templateName) {
        // Use SES template if configured
        console.log('📋 Using SES template for password reset email');
        return await this.sendTemplatedEmail(templateName, email, {
          userName,
          otpCode,
          companyName: 'TruView'
        });
      } else {
        // Use raw email if no template configured
        console.log('📝 Using raw HTML email for password reset');
        const subject = 'Reset Your Password - TruView';
        const htmlBody = this.getPasswordResetEmailHTML(userName, otpCode);
        const textBody = this.getPasswordResetEmailText(userName, otpCode);
        
        return await this.sendRawEmail(email, subject, htmlBody, textBody);
      }
    } catch (error) {
      console.error('❌ Error sending password reset OTP:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId
      });
      return {
        success: false,
        message: 'Failed to send password reset email',
        error: error.message
      };
    }
  }

  /**
   * Send templated email using SES templates
   * @param {string} templateName - SES template name
   * @param {string} email - Recipient email
   * @param {object} templateData - Template variables
   * @returns {Promise<{success: boolean, message: string, error?: string}>}
   */
  async sendTemplatedEmail(templateName, email, templateData) {
    console.log('📋 Sending templated email...');
    console.log('  - Template:', templateName);
    console.log('  - To:', email);
    console.log('  - From:', `${this.fromName} <${this.fromEmail}>`);
    console.log('  - Template Data:', templateData);
    
    try {
      const command = new SendTemplatedEmailCommand({
        Source: `${this.fromName} <${this.fromEmail}>`,
        Destination: {
          ToAddresses: [email],
        },
        Template: templateName,
        TemplateData: JSON.stringify(templateData),
      });

      console.log('📤 Sending email command to SES...');
      const result = await this.sesClient.send(command);
      
      console.log('✅ Templated email sent successfully!');
      console.log('  - Message ID:', result.MessageId);
      
      return {
        success: true,
        message: 'Email sent successfully',
        messageId: result.MessageId
      };
    } catch (error) {
      console.error('❌ Error sending templated email:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId
      });
      throw error;
    }
  }

  /**
   * Send raw email without templates
   * @param {string} email - Recipient email
   * @param {string} subject - Email subject
   * @param {string} htmlBody - HTML body
   * @param {string} textBody - Text body
   * @returns {Promise<{success: boolean, message: string, error?: string}>}
   */
  async sendRawEmail(email, subject, htmlBody, textBody) {
    console.log('📝 Sending raw email...');
    console.log('  - To:', email);
    console.log('  - From:', `${this.fromName} <${this.fromEmail}>`);
    console.log('  - Subject:', subject);
    console.log('  - HTML Body Length:', htmlBody.length, 'characters');
    console.log('  - Text Body Length:', textBody.length, 'characters');
    
    try {
      const command = new SendEmailCommand({
        Source: `${this.fromName} <${this.fromEmail}>`,
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          },
        },
      });

      console.log('📤 Sending raw email command to SES...');
      const result = await this.sesClient.send(command);
      
      console.log('✅ Raw email sent successfully!');
      console.log('  - Message ID:', result.MessageId);
      
      return {
        success: true,
        message: 'Email sent successfully',
        messageId: result.MessageId
      };
    } catch (error) {
      console.error('❌ Error sending raw email:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId
      });
      throw error;
    }
  }

  /**
   * Get verification email HTML template
   */
  getVerificationEmailHTML(userName, otpCode) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - TruView</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 Email Verification</h1>
        <p>Welcome to TruView!</p>
    </div>
    
    <div class="content">
        <h2>Hello ${userName}!</h2>
        <p>Thank you for registering with TruView. To complete your registration, please verify your email address using the OTP code below:</p>
        
        <div class="otp-box">
            <p>Your verification code is:</p>
            <div class="otp-code">${otpCode}</div>
            <p><small>This code will expire in 10 minutes</small></p>
        </div>
        
        <p>If you didn't create an account with TruView, please ignore this email.</p>
        
        <div class="footer">
            <p>Best regards,<br>The TruView Team</p>
            <p><small>This is an automated message, please do not reply to this email.</small></p>
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
Hello ${userName}!

Thank you for registering with TruView. To complete your registration, please verify your email address using the OTP code below:

Your verification code is: ${otpCode}

This code will expire in 10 minutes.

If you didn't create an account with TruView, please ignore this email.

Best regards,
The TruView Team

This is an automated message, please do not reply to this email.
`;
  }

  /**
   * Get password reset email HTML template
   */
  getPasswordResetEmailHTML(userName, otpCode) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - TruView</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: #fff; border: 2px solid #ff6b6b; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #ff6b6b; letter-spacing: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 Password Reset</h1>
        <p>TruView Account Security</p>
    </div>
    
    <div class="content">
        <h2>Hello ${userName}!</h2>
        <p>We received a request to reset your password for your TruView account. Use the OTP code below to reset your password:</p>
        
        <div class="otp-box">
            <p>Your password reset code is:</p>
            <div class="otp-code">${otpCode}</div>
            <p><small>This code will expire in 10 minutes</small></p>
        </div>
        
        <div class="warning">
            <p><strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your account remains secure.</p>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>The TruView Team</p>
            <p><small>This is an automated message, please do not reply to this email.</small></p>
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
Hello ${userName}!

We received a request to reset your password for your TruView account. Use the OTP code below to reset your password:

Your password reset code is: ${otpCode}

This code will expire in 10 minutes.

Security Notice: If you didn't request a password reset, please ignore this email. Your account remains secure.

Best regards,
The TruView Team

This is an automated message, please do not reply to this email.
`;
  }

  /**
   * Check if SES is properly configured
   */
  isConfigured() {
    return !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.SES_FROM_EMAIL
    );
  }

  /**
   * Get configuration status
   */
  getConfigStatus() {
    return {
      accessKeyId: !!process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      region: !!process.env.AWS_REGION,
      fromEmail: !!process.env.SES_FROM_EMAIL,
      fromName: !!process.env.SES_FROM_NAME,
      verificationTemplate: !!process.env.SES_VERIFICATION_TEMPLATE,
      passwordResetTemplate: !!process.env.SES_PASSWORD_RESET_TEMPLATE,
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
        region: process.env.AWS_REGION || 'ap-south-1',
        fromEmail: process.env.SES_FROM_EMAIL || 'Not configured',
        templatesConfigured: !!(config.verificationTemplate && config.passwordResetTemplate)
      };
    } catch (error) {
      console.error('❌ Email service health check failed:', error);
      return {
        status: 'unhealthy',
        configured: false,
        error: error.message
      };
    }
  }

}

// Export singleton instance
const emailService = new EmailService();
module.exports = emailService;
