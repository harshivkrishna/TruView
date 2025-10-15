# Amazon SES Setup Guide for TruView

This guide will help you set up Amazon SES (Simple Email Service) to replace EmailJS for sending emails in your TruView application.

## Prerequisites

- AWS Account
- Domain name (recommended for production)
- Access to AWS Console

## Step 1: Set Up AWS SES

### 1.1 Create AWS Account
If you don't have an AWS account, create one at [aws.amazon.com](https://aws.amazon.com)

### 1.2 Navigate to SES Console
1. Go to AWS Console
2. Search for "SES" or "Simple Email Service"
3. Select your preferred region (e.g., us-east-1)

### 1.3 Verify Your Email Domain (Recommended for Production)
1. In SES Console, go to "Verified identities"
2. Click "Create identity"
3. Choose "Domain"
4. Enter your domain (e.g., `truviews.in`)
5. Follow DNS verification steps
6. Wait for verification (can take up to 72 hours)

### 1.4 Verify Individual Email Address (For Testing)
If you don't have a domain yet:
1. Go to "Verified identities"
2. Click "Create identity"
3. Choose "Email address"
4. Enter your email address
5. Check your email and click the verification link

## Step 2: Request Production Access

By default, SES is in sandbox mode (can only send to verified emails).

### 2.1 Request Sending Limit Increase
1. In SES Console, go to "Account dashboard"
2. Click "Request production access"
3. Fill out the form:
   - **Mail type**: Transactional
   - **Website URL**: https://truviews.in
   - **Use case description**: 
     ```
     TruView is a review platform that sends transactional emails including:
     - Email verification OTPs for new user registration
     - Password reset OTPs for account recovery
     - Account-related notifications
     
     We expect to send approximately [X] emails per day to verified users only.
     ```
4. Submit the request
5. Wait for approval (usually 24-48 hours)

## Step 3: Create IAM User for SES

### 3.1 Create IAM User
1. Go to AWS IAM Console
2. Click "Users" → "Create user"
3. Username: `truview-ses-user`
4. Select "Programmatic access"

### 3.2 Attach SES Policy
1. Attach existing policy: `AmazonSESFullAccess`
2. Or create custom policy with minimal permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail",
                "ses:SendTemplatedEmail"
            ],
            "Resource": "*"
        }
    ]
}
```

### 3.3 Get Access Keys
1. After creating user, go to "Security credentials"
2. Click "Create access key"
3. Choose "Application running outside AWS"
4. Save the Access Key ID and Secret Access Key

## Step 4: Configure Your Application

### 4.1 Backend Environment Variables
Add these to your `.env` file:

```bash
# Amazon SES Configuration
AWS_ACCESS_KEY_ID=your-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
AWS_REGION=us-east-1

# SES Email Configuration
SES_FROM_EMAIL=noreply@truviews.in
SES_FROM_NAME=TruView Team
```

### 4.2 Update From Email
- If using verified domain: `noreply@truviews.in`
- If using verified email: use the exact verified email address

## Step 5: (Optional) Create SES Email Templates

You can create reusable email templates in SES using either AWS Console or AWS CLI:

### 5.1 Method 1: Using AWS Console
1. In SES Console, go to "Email templates"
2. Click "Create template"
3. Follow the template creation steps below

### 5.2 Method 2: Using AWS CLI (Recommended)

First, ensure AWS CLI is installed and configured:
```bash
# Install AWS CLI (if not already installed)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI with your credentials
aws configure
# Enter your AWS Access Key ID, Secret Access Key, Region (us-east-1), and output format (json)
```

#### 5.2.1 Create Verification OTP Template
```bash
aws ses create-template --region ap-south-1 --template '{
  "TemplateName": "truview-verification-otp",
  "SubjectPart": "Verify Your Email - TruView",
  "HtmlPart": "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>Verify Your Email - TruView</title><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: -apple-system, BlinkMacSystemFont, '\''Segoe UI'\'', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1f2937; background: #f8fafc; padding: 20px; } .container { max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 20px 40px rgba(0,0,0,0.08); border-radius: 20px; overflow: hidden; } .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 50px 40px; text-align: center; position: relative; } .header::after { content: '\'\''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #dc2626, #f97316, #ea580c); } .logo { font-size: 32px; font-weight: 700; margin-bottom: 12px; letter-spacing: -1px; } .tagline { font-size: 18px; opacity: 0.95; font-weight: 400; letter-spacing: 0.5px; } .content { padding: 50px 40px; } .greeting { font-size: 28px; font-weight: 600; color: #111827; margin-bottom: 24px; } .message { font-size: 17px; color: #4b5563; margin-bottom: 40px; line-height: 1.8; } .otp-section { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 1px solid #fed7aa; border-radius: 16px; padding: 40px; text-align: center; margin: 40px 0; position: relative; box-shadow: 0 8px 25px rgba(249, 115, 22, 0.1); } .otp-section::before { content: '\'\''; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 60px; height: 4px; background: linear-gradient(90deg, #f97316, #ea580c); border-radius: 0 0 8px 8px; } .otp-label { font-size: 15px; color: #9a3412; font-weight: 600; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1.2px; } .otp-code { font-size: 42px; font-weight: 800; color: #ea580c; letter-spacing: 12px; font-family: '\''SF Mono'\'', '\''Monaco'\'', '\''Inconsolata'\'', '\''Roboto Mono'\'', monospace; margin: 20px 0; text-shadow: 0 2px 8px rgba(234, 88, 12, 0.2); } .expiry-info { font-size: 14px; color: #9a3412; font-weight: 500; background: #fef3c7; padding: 12px 20px; border-radius: 8px; margin-top: 20px; } .security-notice { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left: 5px solid #ef4444; padding: 24px; margin: 40px 0; border-radius: 0 12px 12px 0; } .security-notice h4 { color: #dc2626; font-size: 16px; font-weight: 600; margin-bottom: 8px; } .security-notice p { font-size: 15px; color: #7f1d1d; margin: 0; line-height: 1.6; } .cta-section { text-align: center; margin: 40px 0; } .verify-button { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3); transition: transform 0.2s ease; } .verify-button:hover { transform: translateY(-2px); } .footer { background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 40px; text-align: center; border-top: 1px solid #e5e7eb; } .footer-brand { font-size: 16px; color: #374151; margin-bottom: 16px; font-weight: 500; } .company-name { color: #f97316; font-weight: 700; } .footer-links { margin: 20px 0; } .footer-link { display: inline-block; margin: 0 15px; color: #6b7280; text-decoration: none; font-size: 14px; font-weight: 500; } .footer-link:hover { color: #f97316; } .disclaimer { font-size: 13px; color: #9ca3af; margin-top: 20px; line-height: 1.5; } @media (max-width: 600px) { .container { margin: 10px; border-radius: 16px; } .header, .content, .footer { padding: 30px 25px; } .otp-code { font-size: 32px; letter-spacing: 8px; } .greeting { font-size: 24px; } .message { font-size: 16px; } }</style></head><body><div class=\"container\"><div class=\"header\"><div class=\"logo\">TruView</div><div class=\"tagline\">Authentic Reviews, Trusted Insights</div></div><div class=\"content\"><div class=\"greeting\">Hello {{userName}}</div><div class=\"message\">Welcome to TruView! We are excited to have you join our community of authentic reviewers. To complete your registration and secure your account, please verify your email address using the verification code below.</div><div class=\"otp-section\"><div class=\"otp-label\">Verification Code</div><div class=\"otp-code\">{{otpCode}}</div><div class=\"expiry-info\">This code expires in 10 minutes</div></div><div class=\"security-notice\"><h4>Security Notice</h4><p>If you did not create an account with TruView, please ignore this email. Your security is our priority and no action is required from you.</p></div></div><div class=\"footer\"><div class=\"footer-brand\">Best regards,<br>The <span class=\"company-name\">{{companyName}}</span> Team</div><div class=\"footer-links\"><a href=\"#\" class=\"footer-link\">Help Center</a><a href=\"#\" class=\"footer-link\">Privacy Policy</a><a href=\"#\" class=\"footer-link\">Terms of Service</a></div><div class=\"disclaimer\">This is an automated message, please do not reply to this email.<br>TruView - Building trust through authentic reviews.</div></div></div></body></html>",
  "TextPart": "TruView - Email Verification\n\nHello {{userName}}\n\nWelcome to TruView! We are excited to have you join our community of authentic reviewers.\n\nTo complete your registration and secure your account, please verify your email address using the verification code below:\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nVerification Code: {{otpCode}}\nExpires in: 10 minutes\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSECURITY NOTICE:\nIf you did not create an account with TruView, please ignore this email. Your security is our priority and no action is required from you.\n\nBest regards,\nThe {{companyName}} Team\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nThis is an automated message, please do not reply to this email.\nTruView - Building trust through authentic reviews."
}'
```

#### 5.2.2 Create Password Reset OTP Template
```bash
aws ses create-template --region ap-south-1 --template '{
  "TemplateName": "truview-password-reset-otp",
  "SubjectPart": "Reset Your Password - TruView",
  "HtmlPart": "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>Reset Your Password - TruView</title><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: -apple-system, BlinkMacSystemFont, '\''Segoe UI'\'', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1f2937; background: #f8fafc; padding: 20px; } .container { max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 20px 40px rgba(0,0,0,0.08); border-radius: 20px; overflow: hidden; } .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 50px 40px; text-align: center; position: relative; } .header::after { content: '\'\''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #991b1b, #dc2626, #b91c1c); } .logo { font-size: 32px; font-weight: 700; margin-bottom: 12px; letter-spacing: -1px; } .tagline { font-size: 18px; opacity: 0.95; font-weight: 400; letter-spacing: 0.5px; } .content { padding: 50px 40px; } .greeting { font-size: 28px; font-weight: 600; color: #111827; margin-bottom: 24px; } .message { font-size: 17px; color: #4b5563; margin-bottom: 40px; line-height: 1.8; } .otp-section { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 1px solid #fecaca; border-radius: 16px; padding: 40px; text-align: center; margin: 40px 0; position: relative; box-shadow: 0 8px 25px rgba(220, 38, 38, 0.1); } .otp-section::before { content: '\'\''; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 60px; height: 4px; background: linear-gradient(90deg, #dc2626, #b91c1c); border-radius: 0 0 8px 8px; } .otp-label { font-size: 15px; color: #991b1b; font-weight: 600; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1.2px; } .otp-code { font-size: 42px; font-weight: 800; color: #dc2626; letter-spacing: 12px; font-family: '\''SF Mono'\'', '\''Monaco'\'', '\''Inconsolata'\'', '\''Roboto Mono'\'', monospace; margin: 20px 0; text-shadow: 0 2px 8px rgba(220, 38, 38, 0.2); } .expiry-info { font-size: 14px; color: #991b1b; font-weight: 500; background: #fef3c7; padding: 12px 20px; border-radius: 8px; margin-top: 20px; } .security-alert { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-left: 5px solid #f59e0b; padding: 24px; margin: 40px 0; border-radius: 0 12px 12px 0; } .security-alert h4 { color: #92400e; font-size: 16px; font-weight: 600; margin-bottom: 8px; } .security-alert p { font-size: 15px; color: #92400e; margin: 0; line-height: 1.6; } .important-notice { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #7dd3fc; padding: 24px; margin: 30px 0; border-radius: 12px; } .important-notice h4 { color: #0369a1; font-size: 16px; font-weight: 600; margin-bottom: 8px; } .important-notice p { font-size: 15px; color: #0c4a6e; margin: 0; line-height: 1.6; } .footer { background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 40px; text-align: center; border-top: 1px solid #e5e7eb; } .footer-brand { font-size: 16px; color: #374151; margin-bottom: 16px; font-weight: 500; } .company-name { color: #dc2626; font-weight: 700; } .footer-links { margin: 20px 0; } .footer-link { display: inline-block; margin: 0 15px; color: #6b7280; text-decoration: none; font-size: 14px; font-weight: 500; } .footer-link:hover { color: #dc2626; } .disclaimer { font-size: 13px; color: #9ca3af; margin-top: 20px; line-height: 1.5; } @media (max-width: 600px) { .container { margin: 10px; border-radius: 16px; } .header, .content, .footer { padding: 30px 25px; } .otp-code { font-size: 32px; letter-spacing: 8px; } .greeting { font-size: 24px; } .message { font-size: 16px; } }</style></head><body><div class=\"container\"><div class=\"header\"><div class=\"logo\">TruView</div><div class=\"tagline\">Account Security Center</div></div><div class=\"content\"><div class=\"greeting\">Hello {{userName}}</div><div class=\"message\">We received a request to reset your password for your TruView account. To proceed with the password reset, please use the secure verification code below.</div><div class=\"otp-section\"><div class=\"otp-label\">Password Reset Code</div><div class=\"otp-code\">{{otpCode}}</div><div class=\"expiry-info\">This code expires in 10 minutes</div></div><div class=\"security-alert\"><h4>Security Notice</h4><p>If you did not request a password reset, please ignore this email and consider securing your account. Your current password remains unchanged and your account is safe.</p></div><div class=\"important-notice\"><h4>Account Protection</h4><p>For your security, this password reset link can only be used once. If you need additional help, please contact our support team through the official TruView website.</p></div></div><div class=\"footer\"><div class=\"footer-brand\">Best regards,<br>The <span class=\"company-name\">{{companyName}}</span> Security Team</div><div class=\"footer-links\"><a href=\"#\" class=\"footer-link\">Security Center</a><a href=\"#\" class=\"footer-link\">Help Center</a><a href=\"#\" class=\"footer-link\">Contact Support</a></div><div class=\"disclaimer\">This is an automated security message, please do not reply to this email.<br>TruView - Building trust through authentic reviews.</div></div></div></body></html>",
  "TextPart": "TruView - Password Reset Request\n\nHello {{userName}}\n\nWe received a request to reset your password for your TruView account.\n\nTo proceed with the password reset, please use the secure verification code below:\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPassword Reset Code: {{otpCode}}\nExpires in: 10 minutes\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSECURITY NOTICE:\nIf you did not request a password reset, please ignore this email and consider securing your account. Your current password remains unchanged and your account is safe.\n\nACCOUNT PROTECTION:\nFor your security, this password reset code can only be used once. If you need additional help, please contact our support team through the official TruView website.\n\nBest regards,\nThe {{companyName}} Security Team\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nThis is an automated security message, please do not reply to this email.\nTruView - Building trust through authentic reviews."
}'
```

#### 5.2.3 Verify Templates Were Created
```bash
# List all templates to verify creation
aws ses list-templates --region ap-south-1

# Get specific template details
aws ses get-template --region ap-south-1 --template-name truview-verification-otp
aws ses get-template --region ap-south-1 --template-name truview-password-reset-otp
```

### 5.3 Update Environment Variables
If using templates, add these to your backend `.env` file:
```bash
SES_VERIFICATION_TEMPLATE=truview-verification-otp
SES_PASSWORD_RESET_TEMPLATE=truview-password-reset-otp
```

### 5.4 Template Variables
Your templates use these variables that will be populated by the backend:
- `{{userName}}` - User's first name
- `{{otpCode}}` - The OTP code
- `{{companyName}}` - Will be set to "TruView"

## Step 6: Testing

### 6.1 Test in Sandbox Mode
- Send test emails to verified email addresses
- Check AWS SES sending statistics

### 6.2 Test After Production Access
- Test with any email address
- Monitor bounce and complaint rates

## Step 7: Monitoring and Best Practices

### 7.1 Set Up CloudWatch Alarms
Monitor:
- Bounce rate (keep < 5%)
- Complaint rate (keep < 0.1%)
- Sending quota usage

### 7.2 Handle Bounces and Complaints
Set up SNS notifications for bounces and complaints to maintain good sender reputation.

### 7.3 Email Best Practices
- Use clear, recognizable sender names
- Include unsubscribe links (for marketing emails)
- Keep bounce rates low
- Don't send to invalid email addresses

## Troubleshooting

### Common Issues:

1. **"Email address not verified"**
   - Verify your from email address in SES Console

2. **"Sending quota exceeded"**
   - Request higher sending limits
   - Check your daily sending quota

3. **"Message rejected"**
   - Check if you're still in sandbox mode
   - Verify recipient email if in sandbox

4. **High bounce rate**
   - Validate email addresses before sending
   - Remove invalid emails from your list

## Cost Estimation

SES Pricing (as of 2024):
- First 62,000 emails per month: $0.10 per 1,000 emails
- Beyond that: $0.10 per 1,000 emails
- Data transfer: $0.12 per GB

For most applications, SES is very cost-effective compared to other email services.

## Migration Checklist

- [ ] AWS Account created
- [ ] SES service set up in preferred region
- [ ] Domain or email address verified
- [ ] Production access requested and approved
- [ ] IAM user created with SES permissions
- [ ] Access keys generated and stored securely
- [ ] Environment variables configured
- [ ] Application tested with SES
- [ ] EmailJS dependencies removed
- [ ] Monitoring set up (optional)

## Support

For issues with this setup:
1. Check AWS SES documentation
2. Review CloudWatch logs
3. Check application logs for detailed error messages
4. Contact AWS Support for SES-specific issues
