const mongoose = require('mongoose');

/**
 * AuditLog Schema
 *
 * Requirements:
 * - Logs all administrative and sensitive operations.
 * - Queried by Phase 6 Module 7 (Audit Log Viewer).
 * - Read-only log for security compliance.
 */
const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Action is required'],
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performed By is required'],
      index: true,
    },
    targetType: {
      type: String,
      required: [true, 'Target Type is required'],
      enum: ['User', 'Post', 'BloodGroupChangeRequest', 'BloodRequest', 'Helpline', 'System'],
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

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
module.exports.AuditLog = AuditLog;
