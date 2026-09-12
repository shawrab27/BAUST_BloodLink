const mongoose = require('mongoose');

/**
 * Repost Schema
 *
 * Requirements:
 * - SEPARATE standalone collection referencing Post by ID.
 * - Never embedded as an array inside Post.
 * - Unique compound index on { post: 1, user: 1 } to prevent duplicate reposts per user.
 */
const repostSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    quote: {
      type: String,
      trim: true,
      maxlength: [500, 'Quote cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

repostSchema.index({ post: 1, user: 1 }, { unique: true });

const Repost = mongoose.model('Repost', repostSchema);

module.exports = Repost;
module.exports.Repost = Repost;
