# Brevo Email Templates for TruViews

This document contains email templates to be created in Brevo dashboard for TruViews application.

## Template Variables

All templates use these Brevo variables:
- `{{ params.userName }}` - User's first name
- `{{ params.otpCode }}` - 6-digit OTP code
- `{{ params.companyName }}` - Always "TruViews"

---

## 1. Email Verification Template

**Template Name:** `truview-verification-otp`
**Subject:** `Verify Your Email - TruViews`

### HTML Content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - TruViews</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header-subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .otp-container {
            background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
            border: 2px solid #fdba74;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        
        .otp-label {
            font-size: 14px;
            color: #c2410c;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }
        
        .otp-code {
            font-size: 36px;
            font-weight: 700;
            color: #f97316;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            background: white;
            padding: 15px 25px;
            border-radius: 8px;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
        }
        
        .otp-expiry {
            font-size: 13px;
            color: #c2410c;
            margin-top: 15px;
        }
        
        .security-notice {
            background: #fff7ed;
            border-left: 4px solid #f97316;
            padding: 20px;
            border-radius: 0 8px 8px 0;
            margin: 30px 0;
        }
        
        .security-notice-title {
            font-weight: 600;
            color: #c2410c;
            margin-bottom: 8px;
        }
        
        .security-notice-text {
            font-size: 14px;
            color: #9a3412;
            line-height: 1.6;
        }
        
        .footer {
            background: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
            color: #718096;
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .company-name {
            font-weight: 600;
            color: #4a5568;
        }
        
        .disclaimer {
            font-size: 12px;
            color: #a0aec0;
            margin-top: 20px;
            line-height: 1.5;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .header, .content, .footer {
                padding: 25px 20px;
            }
            
            .otp-code {
                font-size: 28px;
                letter-spacing: 4px;
                padding: 12px 20px;
            }
            
            .greeting {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">TruViews</div>
            <div class="header-subtitle">Email Verification Required</div>
        </div>
        
        <div class="content">
            <div class="greeting">Hello {{ params.userName }},</div>
            
            <div class="message">
                Welcome to TruViews! We're excited to have you join our community of authentic reviewers. 
                To complete your registration and secure your account, please verify your email address using the verification code below.
            </div>
            
            <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">{{ params.otpCode }}</div>
                <div class="otp-expiry">This code expires in 10 minutes</div>
            </div>
            
            <div class="security-notice">
                <div class="security-notice-title">Security Notice</div>
                <div class="security-notice-text">
                    If you didn't create an account with TruViews, please ignore this email. 
                    Your email address will not be used for any purpose without your consent.
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                Best regards,<br>
                <span class="company-name">The TruViews Team</span>
            </div>
            
            <div class="disclaimer">
                This is an automated security message. Please do not reply to this email.
                If you need assistance, please contact our support team through the TruViews platform.
            </div>
        </div>
    </div>
</body>
</html>
```

### Text Content:

```
TruViews - Email Verification

Hello {{ params.userName }}!

Welcome to TruViews! We're excited to have you join our community of authentic reviewers.

To complete your registration and secure your account, please verify your email address using the verification code below:

VERIFICATION CODE: {{ params.otpCode }}

This code expires in 10 minutes.

SECURITY NOTICE:
If you didn't create an account with TruViews, please ignore this email. Your email address will not be used for any purpose without your consent.

Best regards,
The TruViews Team

---
This is an automated security message. Please do not reply to this email.
If you need assistance, please contact our support team through the TruViews platform.
```

---

## 2. Password Reset Template

**Template Name:** `truview-password-reset-otp`
**Subject:** `Reset Your Password - TruViews`

### HTML Content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - TruViews</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header-subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .otp-container {
            background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
            border: 2px solid #fdba74;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        
        .otp-label {
            font-size: 14px;
            color: #c2410c;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }
        
        .otp-code {
            font-size: 36px;
            font-weight: 700;
            color: #f97316;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            background: white;
            padding: 15px 25px;
            border-radius: 8px;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
        }
        
        .otp-expiry {
            font-size: 13px;
            color: #c2410c;
            margin-top: 15px;
        }
        
        .security-alert {
            background: #fff7ed;
            border: 2px solid #fdba74;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .security-alert-title {
            font-weight: 700;
            color: #c2410c;
            margin-bottom: 12px;
            font-size: 16px;
        }
        
        .security-alert-text {
            font-size: 14px;
            color: #9a3412;
            line-height: 1.6;
        }
        
        .warning-notice {
            background: #fff7ed;
            border-left: 4px solid #f97316;
            padding: 20px;
            border-radius: 0 8px 8px 0;
            margin: 30px 0;
        }
        
        .warning-notice-title {
            font-weight: 600;
            color: #c2410c;
            margin-bottom: 8px;
        }
        
        .warning-notice-text {
            font-size: 14px;
            color: #9a3412;
            line-height: 1.6;
        }
        
        .footer {
            background: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
            color: #718096;
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .company-name {
            font-weight: 600;
            color: #4a5568;
        }
        
        .disclaimer {
            font-size: 12px;
            color: #a0aec0;
            margin-top: 20px;
            line-height: 1.5;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .header, .content, .footer {
                padding: 25px 20px;
            }
            
            .otp-code {
                font-size: 28px;
                letter-spacing: 4px;
                padding: 12px 20px;
            }
            
            .greeting {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">TruViews</div>
            <div class="header-subtitle">Password Reset Request</div>
        </div>
        
        <div class="content">
            <div class="greeting">Hello {{ params.userName }},</div>
            
            <div class="message">
                We received a request to reset your password for your TruViews account. 
                If this was you, please use the verification code below to proceed with resetting your password.
            </div>
            
            <div class="otp-container">
                <div class="otp-label">Password Reset Code</div>
                <div class="otp-code">{{ params.otpCode }}</div>
                <div class="otp-expiry">This code expires in 10 minutes</div>
            </div>
            
            <div class="security-alert">
                <div class="security-alert-title">Important Security Information</div>
                <div class="security-alert-text">
                    <strong>Did you request this password reset?</strong><br>
                    If yes, use the code above to reset your password.<br>
                    If no, please ignore this email - your account remains secure.
                </div>
            </div>
            
            <div class="warning-notice">
                <div class="warning-notice-title">Account Security Tips</div>
                <div class="warning-notice-text">
                    • Never share your verification codes with anyone<br>
                    • TruViews will never ask for your password via email<br>
                    • If you suspect unauthorized access, contact our support team immediately
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                Best regards,<br>
                <span class="company-name">The TruViews Security Team</span>
            </div>
            
            <div class="disclaimer">
                This is an automated security message. Please do not reply to this email.
                If you need assistance, please contact our support team through the TruViews platform.
            </div>
        </div>
    </div>
</body>
</html>
```

### Text Content:

```
TruViews - Password Reset Request

Hello {{ params.userName }}!

We received a request to reset your password for your TruViews account.

If this was you, please use the verification code below to proceed with resetting your password:

PASSWORD RESET CODE: {{ params.otpCode }}

This code expires in 10 minutes.

IMPORTANT SECURITY INFORMATION:
Did you request this password reset?
- If yes, use the code above to reset your password.
- If no, please ignore this email - your account remains secure.

ACCOUNT SECURITY TIPS:
• Never share your verification codes with anyone
• TruViews will never ask for your password via email
• If you suspect unauthorized access, contact our support team immediately

Best regards,
The TruViews Security Team

---
This is an automated security message. Please do not reply to this email.
If you need assistance, please contact our support team through the TruViews platform.
```

---

## 3. Login Verification Template (Optional)

**Template Name:** `truview-login-otp`
**Subject:** `Login Verification - TruViews`

### HTML Content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Verification - TruViews</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header-subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .otp-container {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border: 2px solid #86efac;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        
        .otp-label {
            font-size: 14px;
            color: #166534;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }
        
        .otp-code {
            font-size: 36px;
            font-weight: 700;
            color: #10b981;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            background: white;
            padding: 15px 25px;
            border-radius: 8px;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        }
        
        .otp-expiry {
            font-size: 13px;
            color: #166534;
            margin-top: 15px;
        }
        
        .footer {
            background: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
            color: #718096;
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .company-name {
            font-weight: 600;
            color: #4a5568;
        }
        
        .disclaimer {
            font-size: 12px;
            color: #a0aec0;
            margin-top: 20px;
            line-height: 1.5;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .header, .content, .footer {
                padding: 25px 20px;
            }
            
            .otp-code {
                font-size: 28px;
                letter-spacing: 4px;
                padding: 12px 20px;
            }
            
            .greeting {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">TruViews</div>
            <div class="header-subtitle">Login Verification</div>
        </div>
        
        <div class="content">
            <div class="greeting">Hello {{ params.userName }},</div>
            
            <div class="message">
                We detected a login attempt to your TruViews account. 
                To complete your login and ensure account security, please use the verification code below.
            </div>
            
            <div class="otp-container">
                <div class="otp-label">Login Verification Code</div>
                <div class="otp-code">{{ params.otpCode }}</div>
                <div class="otp-expiry">This code expires in 10 minutes</div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                Best regards,<br>
                <span class="company-name">The TruViews Team</span>
            </div>
            
            <div class="disclaimer">
                This is an automated security message. Please do not reply to this email.
                If you didn't attempt to login, please secure your account immediately.
            </div>
        </div>
    </div>
</body>
</html>
```

### Text Content:

```
TruViews - Login Verification

Hello {{ params.userName }}!

We detected a login attempt to your TruViews account.

To complete your login and ensure account security, please use the verification code below:

LOGIN VERIFICATION CODE: {{ params.otpCode }}

This code expires in 10 minutes.

Best regards,
The TruViews Team

---
This is an automated security message. Please do not reply to this email.
If you didn't attempt to login, please secure your account immediately.
```

---

## Brevo Setup Instructions

1. **Login to Brevo Dashboard**
2. **Go to Transactional → Templates**
3. **Create New Template** for each template above
4. **Use the exact template names** specified above
5. **Copy-paste the HTML and Text content**
6. **Test the templates** with sample data

## Template Parameters to Test

When testing in Brevo, use these sample parameters:
```json
{
  "userName": "John Doe",
  "otpCode": "123456",
  "companyName": "TruViews"
}
```

## Color Scheme

The templates use TruViews orange theme:
- Primary Orange: `#f97316`
- Secondary Orange: `#ea580c`
- Light Orange: `#fed7aa`
- Dark Orange: `#c2410c`

For login verification, green theme is used to differentiate from security alerts.