// Email service - now using real Brevo service
// This file is kept for backward compatibility

const brevoEmailService = require('./brevoEmailService');

// Export the real Brevo service
module.exports = brevoEmailService;