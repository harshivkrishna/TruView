# Render Deployment Setup Guide

## Environment Variables Required on Render

You need to set the following environment variables in your Render dashboard:

### 1. Database
```
MONGODB_URI=your-mongodb-connection-string
```

### 2. JWT Secret
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Email Configuration (REQUIRED for password reset and verification)
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

**Important for Gmail:**
- You MUST use an "App Password", not your regular Gmail password
- To generate an App Password:
  1. Go to your Google Account settings
  2. Navigate to Security
  3. Enable 2-Step Verification if not already enabled
  4. Go to "App passwords" (search for it in settings)
  5. Generate a new app password for "Mail"
  6. Copy the 16-character password
  7. Use this password in the `EMAIL_PASSWORD` environment variable

### 4. Frontend URL
```
FRONTEND_URL=https://www.truviews.in
```

### 5. AWS S3 (Optional - for file uploads)
```
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
```

## Setting Environment Variables on Render

1. Go to your Render dashboard
2. Select your backend service
3. Click on "Environment" in the left sidebar
4. Click "Add Environment Variable"
5. Add each variable one by one
6. Click "Save Changes"
7. Your service will automatically redeploy with the new variables

## Troubleshooting

### Rate Limiting Issues
- The app now has relaxed rate limits:
  - General API: 200 requests per 15 minutes
  - Auth endpoints: 20 requests per 15 minutes (successful requests don't count)

### Email Not Sending
1. Check Render logs for email-related errors
2. Verify `EMAIL_USER` and `EMAIL_PASSWORD` are set correctly
3. Make sure you're using a Gmail App Password, not your regular password
4. Check if 2-Step Verification is enabled on your Google account
5. Look for error messages in the logs starting with "❌ Failed to send"

### Deployment Timeout
- The server is now optimized with:
  - Faster MongoDB connection (10s timeout)
  - Reduced connection pool size
  - Lightweight health checks
  - Trust proxy enabled for Render

### Database Connection Issues
- Ensure MongoDB allows connections from all IPs (0.0.0.0/0) or Render's IP addresses
- Check if MongoDB Atlas is accessible
- Verify the connection string is correct

## Health Check Endpoint

Render uses the `/health` endpoint to check if your service is running:
```
GET /health
Response: { "status": "OK", "timestamp": "..." }
```

## Quick Start

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Set the build command: `npm install`
5. Set the start command: `npm start`
6. Add all required environment variables
7. Deploy!

## Support

If you encounter issues:
1. Check Render logs for detailed error messages
2. Verify all environment variables are set
3. Test the `/health` endpoint
4. Check MongoDB connection status in logs

