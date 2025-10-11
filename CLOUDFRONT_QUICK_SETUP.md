# Quick CloudFront Setup Guide

## 🚨 Current Issue
You're getting `NS_BINDING_ABORTED` and `403 Forbidden` errors because the app is trying to access S3 URLs directly. CloudFront needs to be configured to serve these files.

## ⚡ Quick Fix

### 1. Set Environment Variable
Add this to your environment variables (Render dashboard or local .env file):

```bash
AWS_CLOUDFRONT_DOMAIN=your-distribution-id.cloudfront.net
```

### 2. Create CloudFront Distribution (if not done)

1. **Go to AWS CloudFront Console**
2. **Create Distribution**
3. **Origin Settings:**
   - Origin Domain: `truviews.s3.ap-south-1.amazonaws.com`
   - Origin Access: `Legacy access identities`
   - Origin Access Identity: Create new
4. **Default Cache Behavior:**
   - Viewer Protocol Policy: `Redirect HTTP to HTTPS`
   - Allowed HTTP Methods: `GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE`
5. **Distribution Settings:**
   - Price Class: `Use All Edge Locations`
6. **Create Distribution**

### 3. Update S3 Bucket Policy

Replace your S3 bucket policy with this (update the ARNs):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::truviews/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR-ACCOUNT-ID:distribution/YOUR-DISTRIBUTION-ID"
        }
      }
    }
  ]
}
```

### 4. Convert Existing URLs

Run this script to convert existing S3 URLs to CloudFront:

```bash
cd Backend
node scripts/convertExistingUrls.js
```

### 5. Deploy Changes

The backend will now:
- ✅ Generate CloudFront URLs for new uploads
- ✅ Convert existing S3 URLs to CloudFront URLs
- ✅ Show configuration status on startup

## 🔍 Verification

After setup, check your server logs. You should see:
```
=== CloudFront Configuration Check ===
AWS Configured: true
CloudFront Domain: your-distribution-id.cloudfront.net
✅ CloudFront is properly configured
```

## 🚀 Benefits

- ✅ No more `NS_BINDING_ABORTED` errors
- ✅ No more `403 Forbidden` errors  
- ✅ Faster image loading globally
- ✅ Better reliability
- ✅ HTTPS support

## 📝 Example URLs

**Before (S3):**
```
https://truviews.s3.ap-south-1.amazonaws.com/profile-photos/profile-1760016482438-797434245.jpg
```

**After (CloudFront):**
```
https://d1234567890abc.cloudfront.net/profile-photos/profile-1760016482438-797434245.jpg
```

## ⚠️ Important Notes

1. **CloudFront propagation takes 15-20 minutes**
2. **Set the environment variable before deploying**
3. **Run the conversion script after setting up CloudFront**
4. **Test with a new image upload to verify it works**