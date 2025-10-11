const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Check if AWS is configured
const isAWSConfigured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET;

// Import CloudFront functions at top level
let convertToCloudFrontUrl, generateCloudFrontUrl;
if (isAWSConfigured) {
  const { convertToCloudFrontUrl: converter, generateCloudFrontUrl: generator } = require('../config/aws');
  convertToCloudFrontUrl = converter;
  generateCloudFrontUrl = generator;
} else {
  convertToCloudFrontUrl = (url) => url;
  generateCloudFrontUrl = (key) => null;
}

let storage;
let upload;

if (isAWSConfigured) {
  // AWS S3 storage configuration
  const multerS3 = require('multer-s3');
  const { s3Client } = require('../config/aws');
  
  storage = multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const folder = file.mimetype.startsWith('video') ? 'videos' : 'images';
      cb(null, `${folder}/${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
    // Removed acl: 'public-read' because bucket doesn't allow ACLs
  });
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

router.post('/', upload.array('media', 5), (err, req, res, next) => {
  if (err) {
    console.error('Multer error:', err);
    return res.status(500).json({ message: 'File upload error', error: err.message });
  }
  next();
}, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => {
      if (isAWSConfigured) {
        // Generate CloudFront URL directly from S3 key
        const cloudFrontUrl = generateCloudFrontUrl(file.key) || convertToCloudFrontUrl(file.location);
        const urlWithCacheBust = cloudFrontUrl.includes('?') ? `${cloudFrontUrl}&t=${Date.now()}` : `${cloudFrontUrl}?t=${Date.now()}`;
        
        return {
          type: file.mimetype.startsWith('video') ? 'video' : 'image',
          url: urlWithCacheBust, // CloudFront URL with cache busting
          filename: file.key,  // S3 key
          bucket: file.bucket,
          originalUrl: file.location, // Keep original S3 URL for fallback
          cloudFrontUrl: cloudFrontUrl // CloudFront URL without cache busting
        };
      } else {
        // Local storage response
        const folder = file.mimetype.startsWith('video') ? 'videos' : 'images';
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        return {
          type: file.mimetype.startsWith('video') ? 'video' : 'image',
          url: `${baseUrl}/uploads/${folder}/${file.filename}`, // Full URL
          filename: file.filename,
          path: file.path
        };
      }
    });

    res.json({ files: uploadedFiles });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message, error: error.stack });
  }
});

module.exports = router;