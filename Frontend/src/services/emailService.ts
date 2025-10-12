import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

// Template IDs for different email types
const EMAILJS_TEMPLATES = {
  VERIFICATION_OTP: import.meta.env.VITE_EMAILJS_VERIFICATION_TEMPLATE_ID || 'verification_otp',
  PASSWORD_RESET: import.meta.env.VITE_EMAILJS_PASSWORD_RESET_TEMPLATE_ID || 'password_reset_otp'
};

// Debug: Log all environment variables
console.log('🔍 Environment Variables Debug:');
console.log('import.meta.env:', import.meta.env);
console.log('VITE_EMAILJS_SERVICE_ID:', import.meta.env.VITE_EMAILJS_SERVICE_ID);
console.log('VITE_EMAILJS_PUBLIC_KEY:', import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
console.log('VITE_EMAILJS_VERIFICATION_TEMPLATE_ID:', import.meta.env.VITE_EMAILJS_VERIFICATION_TEMPLATE_ID);
console.log('VITE_EMAILJS_PASSWORD_RESET_TEMPLATE_ID:', import.meta.env.VITE_EMAILJS_PASSWORD_RESET_TEMPLATE_ID);

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
    console.log('🔍 EmailJS Configuration Check:');
    console.log('Service ID:', EMAILJS_SERVICE_ID);
    console.log('Public Key:', EMAILJS_PUBLIC_KEY);
    console.log('Template ID:', templateId || EMAILJS_TEMPLATES.VERIFICATION_OTP);
    console.log('Template Params:', JSON.stringify(templateParams, null, 2));
    
    if (!this.isConfigured()) {
      console.error('❌ EmailJS not configured properly');
      return {
        success: false,
        message: 'EmailJS not configured',
        error: 'Missing EmailJS configuration. Please set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_PUBLIC_KEY, and all template ID environment variables.'
      };
    }

    try {
      console.log('📤 Attempting to send email via EmailJS...');
      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        templateId || EMAILJS_TEMPLATES.VERIFICATION_OTP,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      console.log('✅ Email sent successfully:', result);
      return {
        success: true,
        message: 'Email sent successfully'
      };
    } catch (error: any) {
      console.error('❌ Email sending failed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        text: error.text,
        response: error.response
      });
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

    console.log('📧 Sending verification OTP with params:', templateParams);
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
