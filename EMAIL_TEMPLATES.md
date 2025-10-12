# Email Templates for TruView

This document contains the email templates used in the TruView application. These templates are designed to be used with EmailJS service.

## Template Variables

Common variables used across templates:
- `{{to_name}}` - Recipient's name
- `{{to_email}}` - Recipient's email address
- `{{from_name}}` - Sender's name (usually "TruView Team")
- `{{subject}}` - Email subject
- `{{message}}` - Main message content
- `{{otp_code}}` - OTP verification code
- `{{user_name}}` - User's name

---

## 1. Verification OTP Template

**Template ID:** `verification_otp`

**Subject:** Verify Your Email - TruView

**HTML Content:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - TruView</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: #fff; border: 2px solid #ff6b35; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #ff6b35; letter-spacing: 5px; }
        .button { background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to TruView!</h1>
            <p>Verify your email address to get started</p>
        </div>
        <div class="content">
            <h2>Hello {{to_name}},</h2>
            <p>Thank you for signing up with TruView! To complete your registration and start sharing authentic reviews, please verify your email address.</p>
            
            <div class="otp-box">
                <p><strong>Your verification code is:</strong></p>
                <div class="otp-code">{{otp_code}}</div>
                <p><small>This code will expire in 10 minutes</small></p>
            </div>
            
            <p>Enter this code in the verification form to activate your account.</p>
            
            <p>If you didn't create an account with TruView, please ignore this email.</p>
            
            <div class="footer">
                <p>Best regards,<br>The TruView Team</p>
                <p><small>This is an automated message. Please do not reply to this email.</small></p>
            </div>
        </div>
    </div>
</body>
</html>
```

---

## 2. Password Reset OTP Template

**Template ID:** `password_reset_otp`

**Subject:** Reset Your Password - TruView

**HTML Content:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - TruView</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: #fff; border: 2px solid #dc3545; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 5px; }
        .button { background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
            <p>Secure your account with a new password</p>
        </div>
        <div class="content">
            <h2>Hello {{to_name}},</h2>
            <p>We received a request to reset your password for your TruView account.</p>
            
            <div class="otp-box">
                <p><strong>Your password reset code is:</strong></p>
                <div class="otp-code">{{otp_code}}</div>
                <p><small>This code will expire in 10 minutes</small></p>
            </div>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                    <li>Never share this code with anyone</li>
                    <li>TruView will never ask for your password via email</li>
                    <li>If you didn't request this reset, please contact support immediately</li>
                </ul>
            </div>
            
            <p>Enter this code in the password reset form to create a new password for your account.</p>
            
            <div class="footer">
                <p>Best regards,<br>The TruView Security Team</p>
                <p><small>This is an automated message. Please do not reply to this email.</small></p>
            </div>
        </div>
    </div>
</body>
</html>
```


---

## EmailJS Setup Instructions

### 1. Create EmailJS Account
1. Go to https://www.emailjs.com/
2. Sign up for a free account
3. Verify your email address

### 2. Add Email Service
1. Go to Email Services
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions
5. Note the Service ID

### 3. Create Email Templates
1. Go to Email Templates
2. Create templates with the IDs mentioned above:
   - `verification_otp`
   - `password_reset_otp`
3. Copy the HTML content from this document
4. Save each template

### 4. Get Public Key
1. Go to Account > General
2. Copy your Public Key

### 5. Add to Environment Variables
Add these to your `.env` file:
```
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_EMAILJS_VERIFICATION_TEMPLATE_ID=verification_otp
VITE_EMAILJS_PASSWORD_RESET_TEMPLATE_ID=password_reset_otp
```

### 6. Test Configuration
Use the test email functionality to verify everything is working.

---

## Template Customization

### Colors
- Primary: `#ff6b35` (Orange)
- Success: `#28a745` (Green)
- Danger: `#dc3545` (Red)
- Info: `#17a2b8` (Blue)
- Warning: `#ffc107` (Yellow)

### Fonts
- Primary: Arial, sans-serif
- Fallback: system fonts

### Responsive Design
All templates are mobile-responsive and will work on all devices.

### Branding
Replace "TruView" with your actual brand name and update colors as needed.
