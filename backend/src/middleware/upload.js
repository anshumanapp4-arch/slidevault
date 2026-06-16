const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

/**
 * Cloudinary storage for preview images.
 * Stored in 'slides-showcase/previews' folder.
 */
const previewStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'slides-showcase/previews',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }],
  },
});

/**
 * Cloudinary storage for slide PDFs.
 * Stored in 'slides-showcase/pdfs' folder.
 * Note: resource_type must be 'raw' for non-image files like PDFs.
 */
const pdfStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'slides-showcase/pdfs',
    allowed_formats: ['pdf'],
    resource_type: 'raw',
  },
});

/**
 * Multer upload middleware for handling file uploads.
 * Uses memory storage as a base, then we manually upload to Cloudinary
 * in the controller for more control over the process.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'previewImage') {
    // Accept image files only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Preview image must be an image file (jpg, png, webp, gif)'), false);
    }
  } else if (file.fieldname === 'slideFile') {
    // Accept PDF files only
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Slide file must be a PDF'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
  },
});

/**
 * Middleware to handle both preview image and slide PDF uploads.
 */
const uploadSlideFiles = upload.fields([
  { name: 'previewImage', maxCount: 1 },
  { name: 'slideFile', maxCount: 1 },
]);

module.exports = { uploadSlideFiles, cloudinary };
