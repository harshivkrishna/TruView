# Render Email Service Fix

## Problem
Render is blocking SMTP connections to Gmail, causing `ETIMEDOUT` errors when trying to send emails.

## Solutions

### Option 1: Use SendGrid (Recommended)
1. Sign up for SendGrid: https://sendgrid.com/
2. Create an API key
3. Add to Render environment variables:
   ```
   SENDGRID_API_KEY=your-sendgrid-api-key
   ```
4. The system will automatically use SendGrid as fallback when Gmail fails

### Option 2: Use Mailgun
1. Sign up for Mailgun: https://www.mailgun.com/
2. Get your API key and domain
3. Add to Render environment variables:
   ```
   MAILGUN_API_KEY=your-mailgun-api-key
   MAILGUN_DOMAIN=your-mailgun-domain
   ```

### Option 3: Use Gmail with Different Settings
The system now tries multiple Gmail configurations automatically:
- SSL on port 465
- TLS on port 587
- Minimal configuration

### Option 4: Use SMTP Relay Service
Consider using services like:
- Amazon SES
- Postmark
- Mailjet

## Current Status
The email service now includes:
- ✅ Multiple Gmail configurations
- ✅ SendGrid fallback support
- ✅ Enhanced error logging
- ✅ Automatic retry logic

## Testing
Use the test endpoint to verify email functionality:
```bash
curl -X POST https://your-render-url.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

## Environment Variables Needed
```
EMAIL_USER=truviews.responder@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
SENDGRID_API_KEY=your-sendgrid-api-key (optional)
```

## Next Steps
1. Deploy the updated code
2. Check logs for which configuration works
3. If all fail, set up SendGrid as recommended
4. Test email functionality using the test endpoint
