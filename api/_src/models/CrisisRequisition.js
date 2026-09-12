const mongoose = require('mongoose');

/**
 * CrisisRequisition Schema — BAUST BloodLink Campus Crisis Command Center
 *
 * Tracks rapid emergency SOS requisitions, active dispatches, clinical site routing,
 * and post-fulfillment triage mission reports matching Stitch screen 7e4c042fb7a14beb99e165aa13ded322.
 */
const MissionReportSchema = new mongoose.Schema(
  {
    missionId: { type: String, trim: true },
    hospital: { type: String, trim: true },
    timeToFirstMatch: { type: String, default: '4m 18s' },
    notifiedCount: { type: Number, default: 12 },
    readyCount: { type: Number, default: 4 },
    infusedUnits: { type: Number, default: 1 },
    fcmPushPercent: { type: Number, default: 75 },
    smsFallbackPercent: { type: Number, default: 25 },
    verifiedBy: { type: String, default: 'Dr. Mosaffor Hossain (SAMO)' },
    verifiedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CrisisRequisitionSchema = new mongoose.Schema(
  {
    requisitionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    clinicalCase: {
      type: String,
      required: [true, 'Clinical case description is required'],
      trim: true,
    },
    patientDetails: {
      type: String,
      trim: true,
      default: '',
    },
    patientCohort: {
      type: String,
      enum: ['student', 'faculty', 'cantonment', 'civilian'],
      default: 'student',
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'BOMBAY'],
    },
    units: {
      type: Number,
      required: [true, 'Units is required'],
      min: 1,
      max: 20,
      default: 2,
    },
    destinationHospital: {
      type: String,
      required: [true, 'Destination clinical site is required'],
      trim: true,
      default: 'Saidpur CMH Emergency',
    },
    urgencyLevel: {
      type: String,
      enum: ['STAT', 'Critical', 'Normal'],
      default: 'STAT',
    },
    status: {
      type: String,
      enum: [
        'Donor En Route',
        'Escalated to Civil Def',
        'Matching Completed',
        'Fulfilled',
        'Active',
        'Cancelled',
      ],
      default: 'Donor En Route',
    },
    elapsedTime: {
      type: String,
      default: '00m 30s',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '+8801769662215',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    matchedDonors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    report: {
      type: MissionReportSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

CrisisRequisitionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.models.CrisisRequisition || mongoose.model('CrisisRequisition', CrisisRequisitionSchema);
