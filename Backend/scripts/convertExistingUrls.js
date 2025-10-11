const mongoose = require('mongoose');
const User = require('../models/User');
const Review = require('../models/Review');
const { convertToCloudFrontUrl } = require('../config/aws');

// Check if AWS is configured
const isAWSConfigured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET;

if (!isAWSConfigured) {
  console.log('AWS not configured. Exiting conversion.');
  process.exit(0);
}

if (!process.env.AWS_CLOUDFRONT_DOMAIN) {
  console.log('AWS_CLOUDFRONT_DOMAIN not configured. Please set this environment variable.');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/truviews');

async function convertExistingUrls() {
  try {
    console.log('Starting URL conversion to CloudFront...');
    console.log('CloudFront Domain:', process.env.AWS_CLOUDFRONT_DOMAIN);

    // Convert User avatars
    console.log('Converting User avatars...');
    const users = await User.find({ 
      avatar: { 
        $regex: /\.s3\./,
        $exists: true,
        $ne: null
      } 
    });
    console.log(`Found ${users.length} users with S3 avatar URLs`);

    for (const user of users) {
      const cloudFrontUrl = convertToCloudFrontUrl(user.avatar);
      await User.updateOne(
        { _id: user._id },
        { avatar: cloudFrontUrl }
      );
      console.log(`Updated user ${user._id}: ${user.avatar} -> ${cloudFrontUrl}`);
    }

    // Convert Review media URLs and author avatars
    console.log('Converting Review URLs...');
    const reviews = await Review.find({ 
      $or: [
        { 'media.url': { $regex: /\.s3\./ } },
        { 'author.avatar': { $regex: /\.s3\./ } }
      ]
    });
    console.log(`Found ${reviews.length} reviews with S3 URLs`);

    for (const review of reviews) {
      let updated = false;
      const updateData = {};

      // Update author avatar
      if (review.author && review.author.avatar && review.author.avatar.includes('s3.amazonaws.com')) {
        updateData['author.avatar'] = convertToCloudFrontUrl(review.author.avatar);
        updated = true;
        console.log(`Review ${review._id} author avatar: ${review.author.avatar} -> ${updateData['author.avatar']}`);
      }

      // Update media URLs
      if (review.media && Array.isArray(review.media)) {
        const updatedMedia = review.media.map(media => {
          if (media.url && media.url.includes('s3.amazonaws.com')) {
            const cloudFrontUrl = convertToCloudFrontUrl(media.url);
            console.log(`Review ${review._id} media: ${media.url} -> ${cloudFrontUrl}`);
            return { ...media, url: cloudFrontUrl };
          }
          return media;
        });
        
        // Check if any media URLs were updated
        const hasChanges = review.media.some((media, index) => 
          media.url !== updatedMedia[index].url
        );
        
        if (hasChanges) {
          updateData.media = updatedMedia;
          updated = true;
        }
      }

      if (updated) {
        await Review.updateOne(
          { _id: review._id },
          { $set: updateData }
        );
        console.log(`Updated review ${review._id}`);
      }
    }

    console.log('URL conversion completed successfully!');
  } catch (error) {
    console.error('URL conversion failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run conversion
convertExistingUrls();