const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    tags: {
      type: [String],
      default: [],
      // Normalize tags: lowercase and trim
      set: (tags) => tags.map((tag) => tag.toLowerCase().trim()).filter(Boolean),
    },
    previewImageUrl: {
      type: String,
      required: [true, 'Preview image is required'],
    },
    previewImagePublicId: {
      type: String, // Cloudinary public_id for deletion
    },
    slideUrl: {
      type: String,
      required: [true, 'Slide PDF is required'],
    },
    slidePublicId: {
      type: String, // Cloudinary public_id for deletion
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Text index for search across title and tags.
 * Compound index on tags for filtering, and createdAt for sorting.
 */
slideSchema.index({ title: 'text', tags: 'text' });
slideSchema.index({ tags: 1 });
slideSchema.index({ createdAt: -1 });
slideSchema.index({ likesCount: -1 });

module.exports = mongoose.model('Slide', slideSchema);
