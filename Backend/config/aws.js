const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

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
    return {
      Location: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`,
      Key: fileName,
      ETag: result.ETag,
    };
  } catch (error) {
    // console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

module.exports = { s3Client, uploadToS3 };