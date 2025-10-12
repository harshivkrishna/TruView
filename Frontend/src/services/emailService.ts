import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

// Template IDs for different email types
const EMAILJS_TEMPLATES = {
  VERIFICATION_OTP: import.meta.env.VITE_EMAILJS_VERIFICATION_TEMPLATE_ID || 'verification_otp',
  PASSWORD_RESET: import.meta.env.VITE_EMAILJS_PASSWORD_RESET_TEMPLATE_ID || 'password_reset_otp'
};

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

export interface EmailTemplateParams {
  to_email: string;
  to_name?: string;
  from_name?: string;
  subject: string;
  message: string;
  otp_code?: string;
  verification_link?: string;
  user_name?: string;
  company_name?: string;
  review_title?: string;
  review_description?: string;
  admin_email?: string;
  [key: string]: unknown;
}

export interface EmailResult {
  success: boolean;
  message: string;
  error?: string;
}

class EmailService {
  private isConfigured(): boolean {
    return !!(EMAILJS_SERVICE_ID && EMAILJS_PUBLIC_KEY);
  }

  private async sendEmail(templateParams: EmailTemplateParams, templateId?: string): Promise<EmailResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'EmailJS not configured',
        error: 'Missing EmailJS configuration. Please set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_PUBLIC_KEY, and all template ID environment variables.'
      };
    }

    try {
      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        templateId || EMAILJS_TEMPLATES.VERIFICATION_OTP,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      return {
        success: true,
        message: 'Email sent successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to send email',
        error: error.message || 'Unknown error'
      };
    }
  }

  // Send verification OTP
  async sendVerificationOTP(email: string, otpCode: string, userName?: string): Promise<EmailResult> {
    const templateParams: EmailTemplateParams = {
      to_email: email,
      to_name: userName || 'User',
      from_name: 'TruView Team',
      subject: 'Verify Your Email - TruView',
      message: `Your verification code is: ${otpCode}`,
      otp_code: otpCode,
      user_name: userName || 'User',
      // Add common EmailJS template variables
      reply_to: email,
      from_email: 'truviews.responder@gmail.com'
    };

    return this.sendEmail(templateParams, EMAILJS_TEMPLATES.VERIFICATION_OTP);
  }

  // Send password reset OTP
  async sendPasswordResetOTP(email: string, otpCode: string, userName?: string): Promise<EmailResult> {
    const templateParams: EmailTemplateParams = {
      to_email: email,
      to_name: userName || 'User',
      from_name: 'TruView Team',
      subject: 'Reset Your Password - TruView',
      message: `Your password reset code is: ${otpCode}`,
      otp_code: otpCode,
      user_name: userName || 'User'
    };

    return this.sendEmail(templateParams, EMAILJS_TEMPLATES.PASSWORD_RESET);
  }


  // Check if EmailJS is properly configured
  isReady(): boolean {
    return this.isConfigured();
  }

  // Get configuration status
  getConfigStatus(): { 
    serviceId: boolean; 
    publicKey: boolean; 
    templates: {
      verification: boolean;
      passwordReset: boolean;
    };
    ready: boolean;
  } {
    return {
      serviceId: !!EMAILJS_SERVICE_ID,
      publicKey: !!EMAILJS_PUBLIC_KEY,
      templates: {
        verification: !!EMAILJS_TEMPLATES.VERIFICATION_OTP,
        passwordReset: !!EMAILJS_TEMPLATES.PASSWORD_RESET
      },
      ready: this.isConfigured()
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
