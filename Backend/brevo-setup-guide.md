# Brevo Setup Guide for TruViews

## Your Brevo Credentials

✅ **API Key**: `WBQ9OPEMS1CL8s0v`
✅ **SMTP Server**: `smtp-relay.brevo.com`
✅ **Port**: `587`
✅ **Login**: `992d52001@smtp-brevo.com`
✅ **Password**: `WBQ9OPEMS1CL8s0v`

## Configuration Options

You have **2 ways** to send emails with Brevo:

### Option 1: API Method (Recommended) ✅
- Uses Brevo's REST API
- More reliable on hosting platforms
- Better error handling
- Currently implemented in your code

### Option 2: SMTP Method (Alternative)
- Uses traditional SMTP
- Can be used as fallback
- Similar to Gmail SMTP but more reliable

## Required Brevo Dashboard Configuration

### 1. Verify Sender Email Address

**IMPORTANT**: You must verify `connect@truviews.in` in Brevo dashboard.

**Steps:**
1. Login to [Brevo Dashboard](https://app.brevo.com)
2. Go to **Senders & IP** → **Senders**
3. Click **Add a sender**
4. Add email: `connect@truviews.in`
5. Add name: `TruViews Team`
6. **Verify the email** (check your email inbox)

### 2. Create Email Templates (Optional but Recommended)

**Steps:**
1. Go to **Transactional** → **Templates**
2. Create these templates using the markdown file provided:
   - `truview-verification-otp`
   - `truview-password-reset-otp`
   - `truview-login-otp` (optional)

### 3. Domain Authentication (Recommended for Production)

**For better deliverability:**
1. Go to **Senders & IP** → **Domains**
2. Add your domain: `truviews.in`
3. Follow DNS setup instructions
4. This improves email deliverability rates

## Current Implementation Status

✅ **API Key**: Added to .env file
✅ **Brevo Service**: Created and integrated
✅ **Auth Routes**: Updated to use Brevo
✅ **Templates**: Ready to create in dashboard

## Testing Your Setup

### 1. Test API Connection
```bash
curl https://truviews-api.onrender.com/email-test
```

### 2. Send Test Email
```bash
curl -X POST https://truviews-api.onrender.com/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

### 3. Test Registration Flow
- Try registering a new user
- Check if verification email is received

## Troubleshooting

### If emails are not sending:

1. **Check sender verification**:
   - Ensure `connect@truviews.in` is verified in Brevo dashboard

2. **Check API key**:
   - Verify the API key is correct in .env file
   - API key should be: `WBQ9OPEMS1CL8s0v`

3. **Check logs**:
   - Look at Render logs for error messages
   - Check `/email-test` endpoint response

### Common Issues:

**Error: "Sender not verified"**
- Solution: Verify `connect@truviews.in` in Brevo dashboard

**Error: "Invalid API key"**
- Solution: Double-check the API key in .env file

**Error: "Template not found"**
- Solution: Create templates in Brevo dashboard or use direct API calls

## Email Limits

**Brevo Free Plan:**
- 300 emails per day
- Unlimited contacts
- Brevo logo in emails

**Brevo Paid Plans:**
- Remove daily limits
- Remove Brevo logo
- Better deliverability
- Advanced features

## Next Steps

1. ✅ **Verify sender email** in Brevo dashboard
2. ✅ **Test the email service** using the endpoints
3. ✅ **Create email templates** (optional)
4. ✅ **Set up domain authentication** (for production)
5. ✅ **Monitor email delivery** in Brevo dashboard

## Alternative SMTP Configuration (If Needed)

If you want to use SMTP instead of API, update your .env:

```env
# Alternative: Brevo SMTP Configuration
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=992d52001@smtp-brevo.com
EMAIL_PASSWORD=WBQ9OPEMS1CL8s0v
EMAIL_FROM_EMAIL=connect@truviews.in
EMAIL_FROM_NAME=TruViews Team
```

But the **API method is recommended** and already implemented.

## Support

If you encounter issues:
1. Check Brevo dashboard for delivery logs
2. Check your application logs
3. Verify sender email is confirmed
4. Contact Brevo support if needed

Your setup should work perfectly once the sender email is verified! 🚀