const mongoose = require('mongoose');

/**
 * Notification Schema — BAUST BloodLink
 *
 * Guaranteed fallback notification channel:
 * - Every notification is written here regardless of FCM push delivery outcome
 * - Polled by clients every 7-10s for in-app alert delivery
 * - Tied to specific user recipient with unread status tracking
 */

const VALID_NOTIFICATION_TYPES = ['EmergencySOS', 'BloodRequest', 'DonationMatch', 'System'];
const VALID_PRIORITIES = ['Normal', 'Emergency'];

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: VALID_NOTIFICATION_TYPES,
        message: '{VALUE} is not a valid notification type',
      },
      default: 'EmergencySOS',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message body is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    bloodRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: VALID_PRIORITIES,
        message: '{VALUE} is not a valid priority',
      },
      default: 'Emergency',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user's notifications sorted by recency
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
module.exports.VALID_NOTIFICATION_TYPES = VALID_NOTIFICATION_TYPES;
module.exports.VALID_PRIORITIES = VALID_PRIORITIES;
