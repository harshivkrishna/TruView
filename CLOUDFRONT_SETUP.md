# CloudFront Setup Guide

This guide explains how to set up CloudFront to serve your S3 content and resolve the `NS_BINDING_ABORTED` error.

## Why CloudFront?

The `NS_BINDING_ABORTED` error occurs when browsers have issues connecting directly to S3 URLs. CloudFront provides:
- Better performance through global CDN
- More reliable connections
- HTTPS support
- Better caching

## Setup Steps

### 1. Create CloudFront Distribution

1. Go to AWS CloudFront console
2. Click "Create Distribution"
3. Configure the distribution:

**Origin Settings:**
- Origin Domain: Select your S3 bucket (e.g., `truviews.s3.ap-south-1.amazonaws.com`)
- Origin Path: Leave empty
- Origin Access: Use "S3 website" or "Legacy access identities" (recommended)

**Default Cache Behavior:**
- Viewer Protocol Policy: Redirect HTTP to HTTPS
- Allowed HTTP Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
- Cache Policy: CachingOptimized (or create custom policy)
- Origin Request Policy: CORS-S3Origin (if using CORS)

**Distribution Settings:**
- Price Class: Use All Edge Locations
- Alternate Domain Names: Add your custom domain (optional)
- SSL Certificate: Use AWS Certificate Manager (if using custom domain)

### 2. Configure S3 Bucket Policy

Update your S3 bucket policy to allow CloudFront access:

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
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::your-account-id:distribution/your-distribution-id"
        }
      }
    }
  ]
}
```

### 3. Update Environment Variables

Add the CloudFront domain to your environment variables:

```bash
AWS_CLOUDFRONT_DOMAIN=your-distribution-id.cloudfront.net
```

### 4. Run Migration Script

To convert existing S3 URLs to CloudFront URLs in your database:

```bash
cd Backend
node scripts/convertExistingUrls.js
```

### 5. Test the Setup

1. Upload a new profile photo
2. Check that the URL uses CloudFront domain
3. Verify images load without `NS_BINDING_ABORTED` errors

## Troubleshooting

### Common Issues:

1. **403 Forbidden**: Check S3 bucket policy and CloudFront origin access settings
2. **CORS Errors**: Ensure CORS is properly configured on S3 bucket
3. **Cache Issues**: CloudFront may cache old responses - use cache invalidation if needed

### Cache Invalidation:

If you need to clear CloudFront cache:

```bash
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Benefits After Migration

- ✅ No more `NS_BINDING_ABORTED` errors
- ✅ Faster image loading globally
- ✅ Better reliability
- ✅ HTTPS support
- ✅ Reduced S3 costs (CloudFront bandwidth is cheaper)

## Monitoring

Monitor your CloudFront distribution:
- CloudWatch metrics for cache hit ratio
- Request count and error rates
- Geographic distribution of requests
