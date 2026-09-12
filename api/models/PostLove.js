const mongoose = require('mongoose');

/**
 * PostLove Schema
 *
 * Tracks which users have liked/loved which post to prevent duplicate loves
 * and enable an atomic toggle.
 */
const postLoveSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

postLoveSchema.index({ post: 1, user: 1 }, { unique: true });

const PostLove = mongoose.model('PostLove', postLoveSchema);

module.exports = PostLove;
module.exports.PostLove = PostLove;
