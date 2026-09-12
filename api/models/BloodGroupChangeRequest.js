const mongoose = require('mongoose');
const { VALID_BLOOD_GROUPS } = require('./BloodRequest');

/**
 * BloodGroupChangeRequest Schema
 *
 * Requirements:
 * - Triggered by user on Profile Screen when requesting blood group change.
 * - Queried by Phase 6 Admin Approval Queue on Blood Registry Approval screen.
 * - On approval: writes requestedGroup to user.bloodGroup permanently and marks isBloodGroupVerified: true.
 * - On rejection: records rejection reason, status: 'Rejected'.
 */
const bloodGroupChangeRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    currentGroup: {
      type: String,
      required: [true, 'Current blood group is required'],
      enum: VALID_BLOOD_GROUPS,
    },
    requestedGroup: {
      type: String,
      required: [true, 'Requested blood group is required'],
      enum: VALID_BLOOD_GROUPS,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
      default: '',
    },
    labReportUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

bloodGroupChangeRequestSchema.index({ status: 1, createdAt: -1 });

const BloodGroupChangeRequest = mongoose.model('BloodGroupChangeRequest', bloodGroupChangeRequestSchema);

module.exports = BloodGroupChangeRequest;
module.exports.BloodGroupChangeRequest = BloodGroupChangeRequest;
