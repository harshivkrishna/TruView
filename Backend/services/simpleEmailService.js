// Simple email service using basic HTTP requests
// This is a temporary solution until Brevo is activated

class SimpleEmailService {
  constructor() {
    console.log('🔧 Initializing Simple Email Service (Temporary)...');
    console.log('⚠️  This is a fallback service until Brevo is activated');
    
    this.fromEmail = process.env.EMAIL_FROM_EMAIL || 'connect@truviews.in';
    this.fromName = process.env.EMAIL_FROM_NAME || 'TruViews Team';
    
    console.log('✅ Simple Email Service initialized');
  }

  async sendVerificationOTP(email, otpCode, userName = 'User') {
    console.log('📧 [SIMULATION] Sending verification OTP...');
    console.log('  - To:', email);
    console.log('  - User:', userName);
    console.log('  - OTP:', otpCode);
    
    // For now, just log the email content
    console.log('📝 Email Content:');
    console.log('  Subject: Verify Your Email - TruViews');
    console.log('  Message: Welcome to TruViews! Your verification code is:', otpCode);
    console.log('  Expires: 10 minutes');
    
    // Simulate successful email sending
    return {
      success: true,
      message: 'Email simulated successfully (Brevo activation pending)',
      messageId: 'sim_' + Date.now(),
      service: 'Simulation',
      note: 'This is a simulation. Real emails will be sent once Brevo is activated.'
    };
  }

  async sendPasswordResetOTP(email, otpCode, userName = 'User') {
    console.log('🔒 [SIMULATION] Sending password reset OTP...');
    console.log('  - To:', email);
    console.log('  - User:', userName);
    console.log('  - OTP:', otpCode);
    
    // For now, just log the email content
    console.log('📝 Email Content:');
    console.log('  Subject: Reset Your Password - TruViews');
    console.log('  Message: Your password reset code is:', otpCode);
    console.log('  Expires: 10 minutes');
    
    // Simulate successful email sending
    return {
      success: true,
      message: 'Email simulated successfully (Brevo activation pending)',
      messageId: 'sim_' + Date.now(),
      service: 'Simulation',
      note: 'This is a simulation. Real emails will be sent once Brevo is activated.'
    };
  }

  isConfigured() {
    return true; // Always configured for simulation
  }

  getConfigStatus() {
    return {
      ready: true,
      service: 'Simulation',
      note: 'Temporary service until Brevo is activated'
    };
  }

  async checkEmailServiceHealth() {
    return {
      status: 'healthy',
      configured: true,
      service: 'Simple Email Service (Simulation)',
      note: 'This is a temporary simulation service until Brevo is activated',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new SimpleEmailService();