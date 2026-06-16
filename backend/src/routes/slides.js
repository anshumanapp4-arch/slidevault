const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadSlideFiles } = require('../middleware/upload');
const {
  getSlides,
  getSlideById,
  createSlide,
  updateSlide,
  deleteSlide,
  toggleLike,
  toggleBookmark,
  getAllTags,
  slideValidation,
} = require('../controllers/slideController');

// GET /api/slides/tags — Get all unique tags (must be before /:id)
router.get('/tags', getAllTags);

// GET /api/slides — List all slides (public, with pagination/search/filter/sort)
router.get('/', optionalAuth, getSlides);

// GET /api/slides/:id — Get single slide (public)
router.get('/:id', optionalAuth, getSlideById);

// POST /api/slides — Create new slide (protected, with file upload)
router.post('/', protect, uploadSlideFiles, slideValidation, validate, createSlide);

// PUT /api/slides/:id — Update slide (protected, author only)
router.put('/:id', protect, uploadSlideFiles, slideValidation, validate, updateSlide);

// DELETE /api/slides/:id — Delete slide (protected, author only)
router.delete('/:id', protect, deleteSlide);

// POST /api/slides/:id/like — Toggle like (protected)
router.post('/:id/like', protect, toggleLike);

// POST /api/slides/:id/bookmark — Toggle bookmark (protected)
router.post('/:id/bookmark', protect, toggleBookmark);

module.exports = router;
