const { body } = require('express-validator');
const Slide = require('../models/Slide');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

/**
 * Helper: Upload a buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {object} options - Cloudinary upload options
 * @returns {Promise<object>} - Cloudinary upload result
 */
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
};

/**
 * Validation rules for creating/updating a slide.
 */
const slideValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('tags').optional(),
];

/**
 * @desc    Get all slides with pagination, search, filter, and sort
 * @route   GET /api/slides
 * @access  Public
 *
 * Query params:
 *   page   - Page number (default: 1)
 *   limit  - Items per page (default: 12)
 *   search - Search term (matches title and tags)
 *   tags   - Comma-separated tag filter
 *   sort   - Sort order: 'latest' | 'oldest' | 'popular' (default: 'latest')
 */
const getSlides = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    // Build query filter
    const filter = {};

    // Search by title and tags using regex (more flexible than text index for partial matches)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { tags: searchRegex },
      ];
    }

    // Filter by tags (comma-separated, matches any)
    if (req.query.tags) {
      const tagArray = req.query.tags
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);
      if (tagArray.length > 0) {
        filter.tags = { $in: tagArray };
      }
    }

    // Sort options
    let sortOption = { createdAt: -1 }; // Default: latest first
    if (req.query.sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (req.query.sort === 'popular') {
      sortOption = { likesCount: -1, createdAt: -1 };
    }

    // Execute query with pagination
    const [slides, totalSlides] = await Promise.all([
      Slide.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email avatar')
        .lean(),
      Slide.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalSlides / limit);

    res.json({
      success: true,
      slides,
      page,
      totalPages,
      totalSlides,
      hasMore: page < totalPages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single slide by ID
 * @route   GET /api/slides/:id
 * @access  Public
 */
const getSlideById = async (req, res, next) => {
  try {
    const slide = await Slide.findById(req.params.id)
      .populate('author', 'name email avatar')
      .lean();

    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found',
      });
    }

    res.json({
      success: true,
      slide,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new slide with file uploads
 * @route   POST /api/slides
 * @access  Protected
 */
const createSlide = async (req, res, next) => {
  try {
    const { title, description, tags } = req.body;

    // Validate files are present
    if (!req.files || !req.files.previewImage || !req.files.slideFile) {
      return res.status(400).json({
        success: false,
        message: 'Both preview image and slide PDF are required.',
      });
    }

    // Upload preview image to Cloudinary
    const imageResult = await uploadToCloudinary(
      req.files.previewImage[0].buffer,
      {
        folder: 'slides-showcase/previews',
        transformation: [
          { width: 800, height: 600, crop: 'limit', quality: 'auto' },
        ],
      }
    );

    // Upload PDF to Cloudinary (as raw file type)
    const pdfResult = await uploadToCloudinary(
      req.files.slideFile[0].buffer,
      {
        folder: 'slides-showcase/pdfs',
        resource_type: 'raw',
      }
    );

    // Parse tags from comma-separated string
    const parsedTags = tags
      ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    // Create slide document
    const slide = await Slide.create({
      title,
      description,
      tags: parsedTags,
      previewImageUrl: imageResult.secure_url,
      previewImagePublicId: imageResult.public_id,
      slideUrl: pdfResult.secure_url,
      slidePublicId: pdfResult.public_id,
      author: req.user._id,
    });

    // Populate author info before returning
    await slide.populate('author', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Slide uploaded successfully',
      slide,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a slide (author only)
 * @route   PUT /api/slides/:id
 * @access  Protected
 */
const updateSlide = async (req, res, next) => {
  try {
    const slide = await Slide.findById(req.params.id);

    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found',
      });
    }

    // Check ownership
    if (slide.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this slide.',
      });
    }

    // Update text fields
    const { title, description, tags } = req.body;
    if (title) slide.title = title;
    if (description) slide.description = description;
    if (tags) {
      slide.tags = tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    }

    // If new preview image uploaded, replace on Cloudinary
    if (req.files && req.files.previewImage) {
      // Delete old image from Cloudinary
      if (slide.previewImagePublicId) {
        await cloudinary.uploader.destroy(slide.previewImagePublicId);
      }

      const imageResult = await uploadToCloudinary(
        req.files.previewImage[0].buffer,
        {
          folder: 'slides-showcase/previews',
          transformation: [
            { width: 800, height: 600, crop: 'limit', quality: 'auto' },
          ],
        }
      );
      slide.previewImageUrl = imageResult.secure_url;
      slide.previewImagePublicId = imageResult.public_id;
    }

    // If new PDF uploaded, replace on Cloudinary
    if (req.files && req.files.slideFile) {
      // Delete old PDF from Cloudinary
      if (slide.slidePublicId) {
        await cloudinary.uploader.destroy(slide.slidePublicId, {
          resource_type: 'raw',
        });
      }

      const pdfResult = await uploadToCloudinary(
        req.files.slideFile[0].buffer,
        {
          folder: 'slides-showcase/pdfs',
          resource_type: 'raw',
        }
      );
      slide.slideUrl = pdfResult.secure_url;
      slide.slidePublicId = pdfResult.public_id;
    }

    await slide.save();
    await slide.populate('author', 'name email avatar');

    res.json({
      success: true,
      message: 'Slide updated successfully',
      slide,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a slide (author only)
 * @route   DELETE /api/slides/:id
 * @access  Protected
 */
const deleteSlide = async (req, res, next) => {
  try {
    const slide = await Slide.findById(req.params.id);

    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found',
      });
    }

    // Check ownership
    if (slide.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this slide.',
      });
    }

    // Delete files from Cloudinary
    if (slide.previewImagePublicId) {
      await cloudinary.uploader.destroy(slide.previewImagePublicId);
    }
    if (slide.slidePublicId) {
      await cloudinary.uploader.destroy(slide.slidePublicId, {
        resource_type: 'raw',
      });
    }

    await Slide.findByIdAndDelete(req.params.id);

    // Also remove from all users' bookmarks
    await User.updateMany(
      { bookmarks: req.params.id },
      { $pull: { bookmarks: req.params.id } }
    );

    res.json({
      success: true,
      message: 'Slide deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle like on a slide
 * @route   POST /api/slides/:id/like
 * @access  Protected
 */
const toggleLike = async (req, res, next) => {
  try {
    const slide = await Slide.findById(req.params.id);

    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found',
      });
    }

    const userId = req.user._id;
    const isLiked = slide.likes.includes(userId);

    if (isLiked) {
      // Unlike: remove user from likes array
      slide.likes = slide.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      slide.likesCount = Math.max(0, slide.likesCount - 1);
    } else {
      // Like: add user to likes array
      slide.likes.push(userId);
      slide.likesCount += 1;
    }

    await slide.save();

    res.json({
      success: true,
      isLiked: !isLiked,
      likesCount: slide.likesCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle bookmark on a slide
 * @route   POST /api/slides/:id/bookmark
 * @access  Protected
 */
const toggleBookmark = async (req, res, next) => {
  try {
    const slide = await Slide.findById(req.params.id);

    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found',
      });
    }

    const user = await User.findById(req.user._id);
    const isBookmarked = user.bookmarks.includes(req.params.id);

    if (isBookmarked) {
      user.bookmarks = user.bookmarks.filter(
        (id) => id.toString() !== req.params.id
      );
    } else {
      user.bookmarks.push(req.params.id);
    }

    await user.save();

    res.json({
      success: true,
      isBookmarked: !isBookmarked,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all unique tags (for filter UI)
 * @route   GET /api/slides/tags
 * @access  Public
 */
const getAllTags = async (req, res, next) => {
  try {
    const tags = await Slide.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]);

    res.json({
      success: true,
      tags: tags.map((t) => ({ name: t._id, count: t.count })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSlides,
  getSlideById,
  createSlide,
  updateSlide,
  deleteSlide,
  toggleLike,
  toggleBookmark,
  getAllTags,
  slideValidation,
};
