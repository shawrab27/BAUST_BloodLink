const mongoose = require('mongoose');

/**
 * AuditLog Schema
 *
 * Requirements:
 * - adminId / performedBy: ref User
 * - action: String (e.g. APPROVE_BLOOD_GROUP_CHANGE, DELETE_POST, HIDE_POST, DISMISS_POST)
 * - targetId: String
 * - targetModel / targetType: String
 * - timestamp / createdAt: Date
 * - details: Mixed
 * - ipAddress: String
 */
const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Action is required'],
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    targetModel: {
      type: String,
      enum: ['User', 'Post', 'Comment', 'BloodGroupChangeRequest', 'BloodRequest', 'Helpline', 'System'],
      index: true,
    },
    targetType: {
      type: String,
      enum: ['User', 'Post', 'Comment', 'BloodGroupChangeRequest', 'BloodRequest', 'Helpline', 'System'],
      index: true,
    },
    targetId: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.pre('save', function (next) {
  if (!this.adminId && this.performedBy) this.adminId = this.performedBy;
  if (!this.performedBy && this.adminId) this.performedBy = this.adminId;
  if (!this.targetModel && this.targetType) this.targetModel = this.targetType;
  if (!this.targetType && this.targetModel) this.targetType = this.targetModel;
  next();
});

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
module.exports.AuditLog = AuditLog;
