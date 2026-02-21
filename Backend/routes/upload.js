const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const router = express.Router();

// Check if AWS is configured
const isAWSConfigured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET;

// Image compression settings
const IMAGE_QUALITY = 85; // JPEG quality (0-100)
const MAX_WIDTH = 1920; // Maximum width for images
const MAX_HEIGHT = 1080; // Maximum height for images
const THUMBNAIL_WIDTH = 400; // Thumbnail width
const THUMBNAIL_HEIGHT = 300; // Thumbnail height

let storage;
let upload;

if (isAWSConfigured) {
  // Use memory storage for AWS to allow image processing before upload
  storage = multer.memoryStorage();
} else {
  // Local storage configuration (fallback)
  const uploadsDir = path.join(__dirname, '../uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const folder = file.mimetype.startsWith('video') ? 'videos' : 'images';
      const folderPath = path.join(uploadsDir, folder);
      
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      
      cb(null, folderPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed'));
  }
};

upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter
});

// Compress and optimize image
async function compressImage(buffer, filename) {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    // Resize if image is too large
    let resizedImage = image;
    if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
      resizedImage = image.resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Convert to WebP for better compression (or JPEG if WebP not supported)
    const ext = path.extname(filename).toLowerCase();
    let compressedBuffer;
    let contentType;
    let newFilename = filename;
    
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      // Convert to WebP for better compression
      compressedBuffer = await resizedImage
        .webp({ quality: IMAGE_QUALITY, effort: 6 })
        .toBuffer();
      contentType = 'image/webp';
      newFilename = filename.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    } else if (ext === '.gif') {
      // Keep GIF as is (animated)
      compressedBuffer = buffer;
      contentType = 'image/gif';
    } else {
      // Default to JPEG
      compressedBuffer = await resizedImage
        .jpeg({ quality: IMAGE_QUALITY, progressive: true })
        .toBuffer();
      contentType = 'image/jpeg';
    }
    
    return { buffer: compressedBuffer, contentType, filename: newFilename };
  } catch (error) {
    console.error('Image compression error:', error);
    // Return original if compression fails
    return { buffer, contentType: 'image/jpeg', filename };
  }
}

// Upload to S3 with compression
async function uploadToS3WithCompression(file) {
  const { uploadToS3 } = require('../config/aws');
  const { s3Client } = require('../config/aws');
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const folder = file.mimetype.startsWith('video') ? 'videos' : 'images';
  const originalFilename = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
  const key = `${folder}/${originalFilename}`;
  
  let buffer = file.buffer;
  let contentType = file.mimetype;
  let finalKey = key;
  
  // Compress images
  if (file.mimetype.startsWith('image')) {
    const compressed = await compressImage(file.buffer, originalFilename);
    buffer = compressed.buffer;
    contentType = compressed.contentType;
    finalKey = `${folder}/${compressed.filename}`;
  }
  
  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: finalKey,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // Cache for 1 year
    Metadata: {
      'original-name': file.originalname,
      'upload-date': new Date().toISOString()
    }
  });
  
  await s3Client.send(command);
  
  // Generate CloudFront URL
  const cloudFrontDomain = process.env.AWS_CLOUDFRONT_DOMAIN;
  let finalUrl;
  
  if (cloudFrontDomain) {
    finalUrl = `https://${cloudFrontDomain}/${finalKey}`;
  } else {
    finalUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${finalKey}`;
  }
  
  return {
    type: file.mimetype.startsWith('video') ? 'video' : 'image',
    url: finalUrl,
    filename: finalKey,
    bucket: process.env.AWS_S3_BUCKET,
    contentType: contentType,
    compressed: file.mimetype.startsWith('image')
  };
}

router.post('/', upload.array('media', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedFiles = [];
    
    if (isAWSConfigured) {
      // Process and upload to S3 with compression
      for (const file of req.files) {
        try {
          const result = await uploadToS3WithCompression(file);
          uploadedFiles.push(result);
        } catch (error) {
          console.error('File upload error:', error);
          return res.status(500).json({ 
            message: 'Failed to upload file', 
            error: error.message 
          });
        }
      }
    } else {
      // Local storage - compress images
      for (const file of req.files) {
        const folder = file.mimetype.startsWith('video') ? 'videos' : 'images';
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        
        // Compress image if it's an image file
        if (file.mimetype.startsWith('image')) {
          try {
            const compressed = await compressImage(
              fs.readFileSync(file.path),
              file.filename
            );
            
            // Save compressed image
            const newPath = path.join(path.dirname(file.path), compressed.filename);
            fs.writeFileSync(newPath, compressed.buffer);
            
            // Delete original if filename changed
            if (newPath !== file.path) {
              fs.unlinkSync(file.path);
            }
            
            uploadedFiles.push({
              type: 'image',
              url: `${baseUrl}/uploads/${folder}/${compressed.filename}`,
              filename: compressed.filename,
              path: newPath,
              compressed: true
            });
          } catch (error) {
            console.error('Image compression error:', error);
            // Use original if compression fails
            uploadedFiles.push({
              type: 'image',
              url: `${baseUrl}/uploads/${folder}/${file.filename}`,
              filename: file.filename,
              path: file.path,
              compressed: false
            });
          }
        } else {
          // Video file - no compression
          uploadedFiles.push({
            type: 'video',
            url: `${baseUrl}/uploads/${folder}/${file.filename}`,
            filename: file.filename,
            path: file.path
          });
        }
      }
    }

    res.json({ files: uploadedFiles });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message, error: error.stack });
  }
});

module.exports = router;