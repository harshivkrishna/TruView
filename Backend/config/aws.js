const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Convert S3 URL to CloudFront URL
const convertToCloudFrontUrl = (s3Url) => {
  if (!process.env.AWS_CLOUDFRONT_DOMAIN) {
    console.warn('AWS_CLOUDFRONT_DOMAIN not configured. Using S3 URL:', s3Url);
    return s3Url; // Return original S3 URL if CloudFront domain not configured
  }
  
  // Extract the key from S3 URL
  const urlParts = s3Url.split('/');
  const key = urlParts.slice(3).join('/'); // Remove bucket and region parts
  
  // Return CloudFront URL
  const cloudFrontUrl = `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`;
  console.log('Converted S3 URL to CloudFront:', s3Url, '->', cloudFrontUrl);
  return cloudFrontUrl;
};

// Generate CloudFront URL directly from key
const generateCloudFrontUrl = (key) => {
  if (!process.env.AWS_CLOUDFRONT_DOMAIN) {
    console.warn('AWS_CLOUDFRONT_DOMAIN not configured. Cannot generate CloudFront URL for key:', key);
    return null;
  }
  
  return `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`;
};

// Upload file to S3
const uploadToS3 = async (buffer, fileName, contentType) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
  });

  try {
    const result = await s3Client.send(command);
    const s3Location = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;
    const cloudFrontLocation = convertToCloudFrontUrl(s3Location);
    
    return {
      Location: cloudFrontLocation, // Return CloudFront URL instead of S3 URL
      S3Location: s3Location, // Keep original S3 URL for reference
      Key: fileName,
      ETag: result.ETag,
    };
  } catch (error) {
    // console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

module.exports = { s3Client, uploadToS3, convertToCloudFrontUrl, generateCloudFrontUrl };