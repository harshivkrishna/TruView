# AWS S3 Setup Guide for TruView

## 1. Create S3 Bucket

1. Go to AWS S3 Console
2. Click "Create bucket"
3. Enter bucket name (e.g., `truviewproject`)
4. Choose region (e.g., `ap-south-1`)
5. **Important**: Uncheck "Block all public access" (we need public read access)
6. Click "Create bucket"

## 2. Configure Bucket Policy

After creating the bucket, go to the bucket and add this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

**Steps:**
1. Go to your bucket
2. Click "Permissions" tab
3. Click "Bucket policy"
4. Paste the above JSON (replace `YOUR-BUCKET-NAME` with your actual bucket name)
5. Click "Save changes"

## 3. Configure CORS (Cross-Origin Resource Sharing)

Add this CORS configuration to your bucket:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": []
    }
]
```

**Steps:**
1. Go to your bucket
2. Click "Permissions" tab
3. Scroll down to "Cross-origin resource sharing (CORS)"
4. Click "Edit"
5. Paste the above JSON
6. Click "Save changes"

## 4. Update Environment Variables

Add these to your `.env` file:

```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket-name
```

## 5. Create IAM User (if needed)

If you don't have AWS credentials:

1. Go to AWS IAM Console
2. Click "Users" → "Add user"
3. Enter username (e.g., `truview-upload`)
4. Select "Programmatic access"
5. Attach policy: `AmazonS3FullAccess` (or create custom policy)
6. Save the Access Key ID and Secret Access Key

## 6. Test Configuration

After setup, try uploading an image. The URL should be accessible publicly.

## Alternative: Use Local Storage

If you prefer not to use AWS S3, simply don't set the AWS environment variables. The system will automatically use local storage instead.

## Troubleshooting

### 403 Forbidden Error
- Check bucket policy is set correctly
- Ensure "Block all public access" is unchecked
- Verify CORS configuration

### Images Not Loading
- Check the generated URLs in browser console
- Verify bucket region matches your configuration
- Test URL directly in browser

### Upload Failures
- Check IAM permissions
- Verify environment variables
- Check bucket name spelling 