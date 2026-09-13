const mongoose = require('mongoose');

/**
 * Guest Schema
 *
 * Dedicated collection for guest sessions and anonymous/social explorers.
 * Allows independent CRUD operations on guest visitors anytime without
 * conflating verified campus donors.
 */
const guestSchema = new mongoose.Schema(
  {
    guestId: {
      type: String,
      unique: true,
      index: true,
      default: () => `GST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    },
    name: {
      type: String,
      trim: true,
      default: 'Guest Explorer',
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: null,
    },
    provider: {
      type: String,
      enum: ['anonymous', 'google', 'facebook', 'github', 'direct'],
      default: 'anonymous',
    },
    oauthUid: {
      type: String,
      trim: true,
      default: null,
    },
    deviceInfo: {
      type: String,
      trim: true,
      default: '',
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Converted', 'Blocked'],
      default: 'Active',
      index: true,
    },
    convertedToUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    bookmarks: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

guestSchema.index({ createdAt: -1 });

const Guest = mongoose.model('Guest', guestSchema);

module.exports = Guest;
module.exports.Guest = Guest;
