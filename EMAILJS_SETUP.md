# EmailJS Setup Guide for TruView

## Why EmailJS?
- ✅ **No server-side email handling** - eliminates SMTP issues
- ✅ **Client-side email sending** - bypasses Render's SMTP blocking
- ✅ **Free tier available** - 200 emails/month
- ✅ **Easy setup** - no complex configuration
- ✅ **Reliable delivery** - professional email service
- ✅ **Template management** - visual email editor

## Quick Setup (10 minutes)

### 1. Create EmailJS Account
1. Go to https://www.emailjs.com/
2. Click "Sign Up" and create account
3. Verify your email address
4. Choose "Personal" plan (free tier)

### 2. Add Email Service
1. Go to **Email Services** tab
2. Click **"Add New Service"**
3. Choose **Gmail** (recommended)
4. Click **"Connect Account"**
5. Sign in with your Gmail account
6. **Copy the Service ID** (e.g., `service_xxxxxxx`)

### 3. Create Email Templates
1. Go to **Email Templates** tab
2. Click **"Create New Template"**

#### Template 1: Verification OTP
- **Template ID:** `verification_otp`
- **Subject:** `Verify Your Email - TruView`
- Copy HTML from `EMAIL_TEMPLATES.md` → Verification OTP Template
- **Variables to add:**
  - `{{to_name}}` - Text
  - `{{to_email}}` - Text  
  - `{{otp_code}}` - Text
  - `{{user_name}}` - Text

#### Template 2: Password Reset OTP
- **Template ID:** `password_reset_otp`
- **Subject:** `Reset Your Password - TruView`
- Copy HTML from `EMAIL_TEMPLATES.md` → Password Reset OTP Template
- **Variables to add:**
  - `{{to_name}}` - Text
  - `{{to_email}}` - Text
  - `{{otp_code}}` - Text
  - `{{user_name}}` - Text

#### Template 3: Welcome Email
- **Template ID:** `welcome`
- **Subject:** `Welcome to TruView! 🎉`
- Copy HTML from `EMAIL_TEMPLATES.md` → Welcome Email Template
- **Variables to add:**
  - `{{to_name}}` - Text
  - `{{to_email}}` - Text
  - `{{user_name}}` - Text

#### Template 4: Review Notification (Admin)
- **Template ID:** `review_notification`
- **Subject:** `New Review Submitted - {{review_title}}`
- Copy HTML from `EMAIL_TEMPLATES.md` → Review Notification Template
- **Variables to add:**
  - `{{to_name}}` - Text
  - `{{to_email}}` - Text
  - `{{review_title}}` - Text
  - `{{review_description}}` - Text
  - `{{user_name}}` - Text
  - `{{company_name}}` - Text
  - `{{admin_email}}` - Text

#### Template 5: Test Email
- **Template ID:** `test_email`
- **Subject:** `Test Email from TruView`
- Copy HTML from `EMAIL_TEMPLATES.md` → Test Email Template
- **Variables to add:**
  - `{{to_name}}` - Text
  - `{{to_email}}` - Text
  - `{{current_date}}` - Text

### 4. Get Public Key
1. Go to **Account** → **General**
2. **Copy your Public Key** (e.g., `user_xxxxxxxxxxxxx`)

### 5. Configure Environment Variables

#### For Development (.env.local)
```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=user_xxxxxxxxxxxxx

# EmailJS Template IDs (create separate templates for each)
VITE_EMAILJS_VERIFICATION_TEMPLATE_ID=verification_otp
VITE_EMAILJS_PASSWORD_RESET_TEMPLATE_ID=password_reset_otp
```

#### For Production (Vercel/Render)
Add these environment variables in your deployment platform:

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add each variable with production values

**Render:**
1. Go to Service → Environment
2. Add each variable with production values

### 6. Test Email Service
```bash
# Start development server
npm run dev

# Test email functionality in browser console
# Or use the test email endpoint in your app
```

## Usage in Code

### Import Email Service
```typescript
import { emailService } from '../services/emailService';

// Check if EmailJS is configured
if (emailService.isReady()) {
  console.log('EmailJS is ready!');
} else {
  console.log('EmailJS not configured');
}
```

### Send Verification OTP
```typescript
const result = await emailService.sendVerificationOTP(
  'user@example.com',
  '123456',
  'John Doe'
);

if (result.success) {
  console.log('OTP sent successfully');
} else {
  console.error('Failed to send OTP:', result.error);
}
```

### Send Welcome Email
```typescript
const result = await emailService.sendWelcomeEmail(
  'user@example.com',
  'John Doe'
);
```

### Send Test Email
```typescript
const result = await emailService.sendTestEmail('test@example.com');
```

## Troubleshooting

### "EmailJS not configured" Error
- Check environment variables are set correctly
- Verify variable names start with `VITE_` (for Vite projects)
- Restart development server after adding variables

### "Template not found" Error
- Verify template IDs match exactly in environment variables
- Check both templates are created and published in EmailJS dashboard
- Ensure each template has correct variables
- Verify template IDs in .env.local match EmailJS dashboard

### "Service not found" Error
- Verify service ID is correct
- Check email service is connected in EmailJS dashboard
- Ensure Gmail account has 2FA enabled

### Emails Not Sending
- Check browser console for errors
- Verify Gmail account permissions
- Check EmailJS dashboard for delivery status
- Ensure email service is active

### Rate Limiting
- Free tier: 200 emails/month
- Check usage in EmailJS dashboard
- Upgrade to paid plan if needed

## EmailJS Dashboard Features

### Analytics
- Track email delivery rates
- Monitor bounce rates
- View sending statistics

### Template Editor
- Visual email editor
- HTML/CSS support
- Variable management
- Preview functionality

### Service Management
- Multiple email providers
- Service status monitoring
- Connection health checks

## Security Best Practices

### Environment Variables
- Never commit API keys to version control
- Use different keys for development/production
- Rotate keys regularly

### Email Content
- Sanitize user input before sending
- Validate email addresses
- Rate limit email sending

### Gmail Setup
- Use App Password (not regular password)
- Enable 2FA on Gmail account
- Monitor account activity

## Cost Breakdown

### Free Tier
- 200 emails/month
- 3 email services
- Basic templates
- Community support

### Paid Plans
- **Personal:** $15/month - 1,000 emails
- **Business:** $45/month - 10,000 emails
- **Enterprise:** Custom pricing

## Migration from Nodemailer

### What's Removed
- `nodemailer` package
- `@sendgrid/mail` package
- `googleapis` package
- SMTP configuration
- Server-side email handling

### What's Added
- `@emailjs/browser` package
- Client-side email service
- EmailJS templates
- Environment variables

### Benefits
- No SMTP blocking issues
- Simpler configuration
- Better reliability
- Visual template management
- Built-in analytics

## Support Resources

### Documentation
- EmailJS Docs: https://www.emailjs.com/docs/
- React Integration: https://www.emailjs.com/docs/sdk/react/
- Template Guide: https://www.emailjs.com/docs/templates/

### Community
- EmailJS Discord: https://discord.gg/emailjs
- GitHub Issues: https://github.com/emailjs-com/emailjs-sdk
- Stack Overflow: Tag `emailjs`

### Professional Support
- Email support for paid plans
- Priority support for enterprise
- Custom integration assistance
