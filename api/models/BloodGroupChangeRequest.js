const mongoose = require('mongoose');
const { VALID_BLOOD_GROUPS } = require('./BloodRequest');

/**
 * BloodGroupChangeRequest Schema
 *
 * Requirements:
 * - user (ref User)
 * - currentGroup
 * - requestedGroup
 * - documentUrl / labReportUrl
 * - note / reason
 * - status: enum ['Pending', 'Approved', 'Rejected']
 * - reviewedBy (ref User)
 * - reviewedAt (Date)
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
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      default: '',
    },
    documentUrl: {
      type: String,
      trim: true,
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

// Synchronize note/reason and documentUrl/labReportUrl before saving
bloodGroupChangeRequestSchema.pre('save', function (next) {
  if (!this.note && this.reason) this.note = this.reason;
  if (!this.reason && this.note) this.reason = this.note;
  if (!this.documentUrl && this.labReportUrl) this.documentUrl = this.labReportUrl;
  if (!this.labReportUrl && this.documentUrl) this.labReportUrl = this.documentUrl;
  next();
});

bloodGroupChangeRequestSchema.index({ status: 1, createdAt: -1 });

const BloodGroupChangeRequest = mongoose.model('BloodGroupChangeRequest', bloodGroupChangeRequestSchema);

module.exports = BloodGroupChangeRequest;
module.exports.BloodGroupChangeRequest = BloodGroupChangeRequest;
