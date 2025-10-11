const { convertToCloudFrontUrl, generateCloudFrontUrl } = require('../config/aws');

// Check CloudFront configuration
const checkCloudFrontConfig = () => {
  const isAWSConfigured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET;
  const isCloudFrontConfigured = process.env.AWS_CLOUDFRONT_DOMAIN;

  console.log('=== CloudFront Configuration Check ===');
  console.log('AWS Configured:', isAWSConfigured);
  console.log('CloudFront Domain:', process.env.AWS_CLOUDFRONT_DOMAIN || 'NOT SET');
  console.log('S3 Bucket:', process.env.AWS_S3_BUCKET || 'NOT SET');
  console.log('AWS Region:', process.env.AWS_REGION || 'us-east-1');

  if (isAWSConfigured && !isCloudFrontConfigured) {
    console.warn('⚠️  WARNING: AWS is configured but CloudFront domain is not set!');
    console.warn('   This will cause S3 URLs to be used, which may result in 403 errors.');
    console.warn('   Please set AWS_CLOUDFRONT_DOMAIN environment variable.');
  } else if (isAWSConfigured && isCloudFrontConfigured) {
    console.log('✅ CloudFront is properly configured');
    
    // Test URL conversion
    const testS3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/test-image.jpg`;
    const testKey = 'test-image.jpg';
    
    console.log('Testing URL conversion:');
    console.log('S3 URL:', testS3Url);
    console.log('Converted CloudFront URL:', convertToCloudFrontUrl(testS3Url));
    console.log('Generated CloudFront URL:', generateCloudFrontUrl(testKey));
  } else if (!isAWSConfigured) {
    console.log('ℹ️  AWS not configured - using local storage');
  }

  console.log('=====================================');
};

module.exports = { checkCloudFrontConfig };