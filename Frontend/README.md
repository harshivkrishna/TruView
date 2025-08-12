# BrutalReviews - MERN Stack Review Platform

A modern, production-ready review platform built with the MERN stack, featuring OTP-based authentication, AWS CDN integration, and social media sharing.

## Features

### Authentication
- **Email OTP Authentication**: Secure login/signup using email OTP verification
- **Password Reset**: OTP-based password reset functionality
- **JWT Tokens**: Secure session management with JSON Web Tokens

### Review System
- **Rich Review Creation**: Upload images/videos, rate experiences, add sentiment tags
- **Sentiment Tagging**: Honest | Brutal | Fair | Rant | Praise | Caution
- **Social Media Sharing**: Share reviews directly to Instagram, Facebook, WhatsApp, Twitter/X
- **Advanced Search & Filtering**: Find reviews by category, rating, date, location
- **Trending & Discovery**: Discover trending reviews and community challenges

### Media Management
- **AWS S3 Integration**: Scalable media storage with CDN delivery
- **Image & Video Support**: Upload and display multimedia content
- **Profile Pictures**: User avatar management through AWS

### Admin Features
- **Admin Dashboard**: Comprehensive platform management
- **Content Moderation**: Review and manage reported content
- **User Management**: Monitor user activity and statistics
- **Analytics**: Platform insights and growth metrics

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Nodemailer** for email services
- **Multer S3** for file uploads
- **AWS SDK** for cloud services

### Infrastructure
- **AWS S3** for media storage
- **AWS CloudFront** for CDN (recommended)
- **MongoDB Atlas** (recommended for production)

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- AWS Account with S3 bucket
- Gmail account for email services

### 1. Clone Repository
```bash
git clone <repository-url>
cd trustpilot-clone-mern
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Environment Configuration

Create `.env` file in the `server` directory:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/trustpilot-clone

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Server
PORT=5000
```

### 4. AWS Setup

1. **Create S3 Bucket**:
   - Create a new S3 bucket in AWS Console
   - Enable public read access for uploaded files
   - Configure CORS policy for web uploads

2. **IAM User Setup**:
   - Create IAM user with S3 permissions
   - Generate access keys
   - Add keys to environment variables

3. **S3 Bucket Policy** (example):
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

### 5. Email Setup (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_PASS`

### 6. Run the Application

```bash
# Start backend server
cd server
npm run dev

# In another terminal, start frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Deployment on AWS

### Recommended Architecture
- **Frontend**: AWS S3 + CloudFront
- **Backend**: AWS EC2 or AWS ECS
- **Database**: MongoDB Atlas
- **Media Storage**: AWS S3
- **CDN**: AWS CloudFront

### Frontend Deployment (S3 + CloudFront)
```bash
# Build the frontend
npm run build

# Upload dist/ folder to S3 bucket
# Configure CloudFront distribution
# Set up custom domain (optional)
```

### Backend Deployment (EC2)
```bash
# Launch EC2 instance
# Install Node.js and PM2
# Clone repository
# Install dependencies
# Set environment variables
# Start with PM2
pm2 start server/server.js --name "brutareviews-api"
```

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP for login/signup/reset
- `POST /api/auth/verify-otp` - Verify OTP and authenticate
- `POST /api/auth/reset-password` - Reset password with OTP

### Reviews
- `GET /api/reviews` - Get reviews with filtering
- `POST /api/reviews` - Create new review
- `GET /api/reviews/:id` - Get single review
- `PATCH /api/reviews/:id/upvote` - Upvote review

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/profile/:id` - Update user profile

### Media
- `POST /api/upload` - Upload media files to S3

### Admin
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/reviews` - Get all reviews for moderation
- `GET /api/admin/users` - Get all users
- `GET /api/admin/reports` - Get reported content

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact: your-email@example.com

---

Built with ❤️ using the MERN stack and AWS cloud services.