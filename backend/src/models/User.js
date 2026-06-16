const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: function () {
        // Password is required only if the user is NOT using OAuth
        return !this.googleId && !this.githubId;
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
      default: '', // Will be set to gravatar URL in pre-save
    },
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Slide',
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook: Hash password before saving if it's been modified.
 * Also generates a default gravatar URL from the email.
 */
userSchema.pre('save', async function (next) {
  // Generate gravatar if no avatar set
  if (!this.avatar) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(this.email.toLowerCase()).digest('hex');
    this.avatar = `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
  }

  // Only hash the password if it has been modified and exists
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare a candidate password with the stored hashed password.
 * @param {string} candidatePassword - The password to compare
 * @returns {Promise<boolean>} - True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // OAuth users might not have a password
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Remove sensitive fields when converting to JSON.
 */
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
