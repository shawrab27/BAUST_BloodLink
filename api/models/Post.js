const mongoose = require('mongoose');

/**
 * Post Schema
 *
 * Requirements:
 * - Standalone collection for community feed posts.
 * - Does NOT embed comments or reposts array. Uses atomic numeric counters
 *   (`commentCount`, `repostCount`, `loveCount`) updated when standalone
 *   Comment/Repost/PostLove documents are created/removed.
 * - Compound index on { createdAt: -1, _id: -1 } for stable cursor-based pagination.
 */
const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      maxlength: [2000, 'Post content cannot exceed 2000 characters'],
    },
    mediaUrl: {
      type: String,
      default: null,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    loveCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    repostCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bloodRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest',
      default: null,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
    reportedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reportReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for deterministic cursor pagination (newest first)
postSchema.index({ createdAt: -1, _id: -1 });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
module.exports.Post = Post;
