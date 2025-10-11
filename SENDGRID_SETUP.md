# SendGrid Setup for Production Email

## Why SendGrid?
Render blocks SMTP connections to Gmail, causing email timeouts. SendGrid uses HTTPS API instead of SMTP, bypassing this restriction.

## Quick Setup (5 minutes)

### 1. Create SendGrid Account
1. Go to https://sendgrid.com/
2. Sign up for free (100 emails/day free tier)
3. Verify your email address

### 2. Create API Key
1. Go to Settings > API Keys
2. Click "Create API Key"
3. Name it: "TruViews Production"
4. Choose "Full Access"
5. Click "Create & View"
6. **Copy the API key** (you won't see it again!)

### 3. Add to Render Environment Variables
1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment"
4. Add new environment variable:
   ```
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Click "Save Changes"
6. Service will auto-deploy

### 4. Verify Sender Identity (Important!)
1. Go to Settings > Sender Authentication
2. Verify your email: `truviews.responder@gmail.com`
3. Check email and click verification link

## How It Works

The system now tries email services in this order:
1. **SendGrid** (if SENDGRID_API_KEY is set) - RECOMMENDED
2. **Gmail SMTP** (multiple configurations)
3. Falls back gracefully if one fails

## Expected Logs After Setup

```
📧 SendGrid is available as fallback email service
⏭️ Skipping SMTP verification in production (SendGrid available)
✅ Email service is ready to send emails (via SendGrid)
```

When sending emails:
```
📨 Attempting to send verification OTP to user@example.com (attempt 1/2)
❌ Failed to send verification OTP to user@example.com (attempt 1/2): Connection timeout
⏳ Retrying in 2000ms...
📨 Attempting to send verification OTP to user@example.com (attempt 2/2)
❌ Failed to send verification OTP to user@example.com (attempt 2/2): Connection timeout
🔄 Trying SendGrid as fallback...
✅ verification OTP sent successfully via SendGrid to user@example.com
```

## Testing
After deployment, test with:
```bash
curl -X POST https://truview-xc01.onrender.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

## Benefits
- ✅ No SMTP port blocking
- ✅ 100 emails/day free
- ✅ Better deliverability
- ✅ Email analytics
- ✅ Works on all platforms

## Troubleshooting

**"SendGrid API key not found"**
- Check environment variable is set in Render
- Verify no extra spaces in the key

**"Sender not verified"**
- Verify sender email in SendGrid dashboard
- Check spam folder for verification email

**Still timing out?**
- Check Render logs for SendGrid errors
- Verify API key is correct
- Contact SendGrid support

## Cost
- **Free tier**: 100 emails/day (enough for testing)
- **Essentials**: $19.95/month - 50,000 emails
- **Pro**: $89.95/month - 100,000 emails
