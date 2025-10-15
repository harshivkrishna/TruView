#!/usr/bin/env node
/**
 * Quick Email Test Script
 * Usage: node test-email-quick.js your-email@example.com
 */

require('dotenv').config();
const emailService = require('./services/emailService');

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.error('Usage: node test-email-quick.js your-email@example.com');
  process.exit(1);
}

console.log('📧 Sending test OTP email to:', email);
console.log('');

emailService.sendVerificationOTP(email, '123456', 'Test User')
  .then(result => {
    if (result.success) {
      console.log('✅ SUCCESS! Email sent');
      console.log('📬 Message ID:', result.messageId);
      console.log('\nCheck your inbox (and spam folder) at:', email);
    } else {
      console.log('❌ FAILED!');
      console.log('Error:', result.error);
    }
  })
  .catch(error => {
    console.error('💥 Error:', error.message);
    process.exit(1);
  });

