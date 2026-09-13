const mongoose = require('mongoose');

/**
 * BloodRequest Schema — BAUST BloodLink
 *
 * Requirements:
 * - Blood Group: enum ['A+','A-','B+','B-','AB+','AB-','O+','O-']
 * - Condition: enum ['Normal','Emergency'] (locked binary field, checked by Phase 4 Emergency SOS)
 * - Patient Type: enum ['Student','Teacher','Staff','Civilian'] (required)
 * - Units: 1 to 20
 * - Idempotency: indexed on requester and createdAt for 10-second duplicate check
 * - Cursor-paginated listings (15-20 items per page)
 */

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const VALID_CONDITIONS = ['Normal', 'Emergency'];
const VALID_PATIENT_TYPES = ['Student', 'Teacher', 'Staff', 'Civilian'];
const VALID_STATUSES = ['Pending', 'Matching', 'Fulfilled', 'Cancelled'];

const BloodRequestSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: [true, 'Patient name or case title is required'],
      trim: true,
      minlength: [2, 'Patient name must be at least 2 characters'],
      maxlength: [100, 'Patient name cannot exceed 100 characters'],
    },
    patientType: {
      type: String,
      required: [true, 'Patient type is required'],
      enum: {
        values: VALID_PATIENT_TYPES,
        message: '{VALUE} is not a valid patient type',
      },
    },
    patientAge: {
      type: Number,
      min: [0, 'Age cannot be negative'],
      max: [120, 'Age cannot exceed 120'],
      default: null,
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: {
        values: VALID_BLOOD_GROUPS,
        message: '{VALUE} is not a valid blood group',
      },
    },
    units: {
      type: Number,
      required: [true, 'Number of blood units (bags) is required'],
      min: [1, 'At least 1 unit is required'],
      max: [20, 'Maximum 20 units per requisition'],
      default: 1,
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: {
        values: VALID_CONDITIONS,
        message: '{VALUE} is not a valid condition',
      },
      default: 'Normal',
    },
    hospital: {
      type: String,
      required: [true, 'Hospital or medical facility name is required'],
      trim: true,
    },
    hospitalAddress: {
      type: String,
      trim: true,
      default: '',
    },
    hospitalBed: {
      type: String,
      trim: true,
      default: '',
    },
    contactName: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true,
    },
    requiredDate: {
      type: Date,
      required: [true, 'Date and time blood is required is mandatory'],
    },
    diagnosis: {
      type: String,
      trim: true,
      default: '',
    },
    clinicalNotes: {
      type: String,
      trim: true,
      default: '',
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requisition requester is required'],
    },
    status: {
      type: String,
      enum: {
        values: VALID_STATUSES,
        message: '{VALUE} is not a valid status',
      },
      default: 'Pending',
    },
    matchedDonors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    responses: [
      {
        donor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['Accepted', 'Declined', 'Completed'],
          default: 'Accepted',
        },
        respondedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for fast idempotency duplicate check (requester + createdAt)
BloodRequestSchema.index({ requester: 1, createdAt: -1 });
// Compound index for cursor pagination and filtering by bloodGroup & status
BloodRequestSchema.index({ status: 1, bloodGroup: 1, createdAt: -1 });

module.exports = {
  BloodRequest: mongoose.models.BloodRequest || mongoose.model('BloodRequest', BloodRequestSchema),
  VALID_BLOOD_GROUPS,
  VALID_CONDITIONS,
  VALID_PATIENT_TYPES,
  VALID_STATUSES,
};
