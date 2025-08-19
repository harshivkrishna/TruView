# Truviews Authentication Setup Guide

## Overview
This project now uses a traditional email/password authentication system with OTP verification instead of Firebase. The system includes:

- **Registration**: Email/password signup with OTP verification
- **Login**: Email/password authentication
- **Password Reset**: OTP-based password reset
- **Email Verification**: OTP-based email verification

## Backend Setup

### 1. Install Dependencies
```bash
cd Backend
npm install
```

### 2. Environment Variables
Create a `.env` file in the Backend directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/truviews

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Server Port
PORT=5000

# AWS Configuration (if using S3 for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
```

### 3. Email Setup (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASSWORD`

### 4. Start Backend Server
```bash
cd Backend
npm run dev
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd Frontend
npm install
```

### 2. Start Frontend Development Server
```bash
cd Frontend
npm run dev
```

## Authentication Flow

### Registration Flow
1. User fills registration form (email, password, name, phone)
2. Backend creates user with `emailVerified: false`
3. Backend generates 6-digit OTP and sends via email
4. User enters OTP in verification modal
5. Backend verifies OTP and sets `emailVerified: true`
6. User is logged in automatically

### Login Flow
1. User enters email and password
2. Backend validates credentials
3. If email is verified, user is logged in
4. If email is not verified, error message is shown

### Password Reset Flow
1. User enters email address
2. Backend generates OTP and sends via email
3. User enters OTP
4. User enters new password
5. Backend updates password

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/resend-verification` - Resend verification OTP
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP

### User Management
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID (admin only)
- `GET /api/users` - Get all users (admin only)

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt
- **JWT Tokens**: Secure authentication tokens
- **OTP Expiration**: OTPs expire after 10 minutes
- **Email Verification**: Required before login
- **Input Validation**: Server-side validation for all inputs

## Troubleshooting

### Email Not Sending
1. Check Gmail app password is correct
2. Ensure 2-factor authentication is enabled
3. Check email credentials in `.env` file
4. Check spam folder for emails

### OTP Not Working
1. Ensure OTP is entered within 10 minutes
2. Check email for correct OTP
3. Try resending OTP if expired

### Database Connection Issues
1. Ensure MongoDB is running
2. Check `MONGODB_URI` in `.env` file
3. Verify database permissions

## Production Deployment

### Environment Variables
- Change `JWT_SECRET` to a strong, unique key
- Use production MongoDB URI
- Configure production email service
- Set up proper CORS origins

### Security Considerations
- Use HTTPS in production
- Implement rate limiting
- Add request validation middleware
- Use environment-specific configurations
- Regular security audits

## File Structure

```
Backend/
├── config/
├── middleware/
│   └── auth.js          # JWT authentication middleware
├── models/
│   └── User.js          # User model with OTP fields
├── routes/
│   ├── auth.js          # Authentication routes
│   └── users.js         # User management routes
├── services/
│   └── emailService.js  # Nodemailer email service
└── server.js            # Main server file

Frontend/
├── src/
│   ├── components/auth/
│   │   ├── LoginModal.tsx
│   │   ├── RegisterModal.tsx
│   │   ├── ForgotPasswordModal.tsx
│   │   └── OTPVerificationModal.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication context
│   └── services/
│       └── api.ts           # API service
```

This setup provides a complete, secure authentication system without Firebase dependencies. 