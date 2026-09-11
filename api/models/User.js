const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema — BAUST BloodLink
 *
 * Enforces all server-side data rules:
 * - Institutional ID: exactly 16 alphanumeric characters, regex ^[a-zA-Z0-9]{16}$, unique
 * - Gender: enum ['Male','Female'] only
 * - Department: enum ['CSE','EEE','ME','ICT','ENG','BBA','AIS','IPE','CE']
 * - Blood Group: enum ['A+','A-','B+','B-','AB+','AB-','O+','O-','BOMBAY']
 * - Role: enum ['Student','Teacher','Staff','Admin']
 * - Role sub-documents for Student / Teacher / Staff
 * - Donor cooldown: ineligible if lastDonationDate within 90 days (null = eligible)
 * - bcrypt hashing: salt rounds 10 minimum
 */

const VALID_DEPARTMENTS = ['CSE', 'EEE', 'ME', 'ICT', 'ENG', 'BBA', 'AIS', 'IPE', 'CE'];
const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'BOMBAY'];
const VALID_GENDERS = ['Male', 'Female'];
const VALID_USER_TYPES = ['Student', 'Teacher', 'Staff', 'Admin'];

// Sub-document schemas for specific roles
const StudentDetailsSchema = new mongoose.Schema(
  {
    batch: { type: String, trim: true, default: '' },
    section: { type: String, trim: true, default: '' },
    session: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const TeacherDetailsSchema = new mongoose.Schema(
  {
    designation: { type: String, trim: true, default: '' },
    roomNumber: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const StaffDetailsSchema = new mongoose.Schema(
  {
    designation: { type: String, trim: true, default: '' },
    office: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    institutionalId: {
      type: String,
      required: [true, 'Institutional ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[a-zA-Z0-9]{16}$/, 'Institutional ID must be exactly 16 alphanumeric characters'],
    },
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: VALID_GENDERS,
        message: '{VALUE} is not a valid gender. Allowed: Male, Female',
      },
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: {
        values: VALID_DEPARTMENTS,
        message: '{VALUE} is not a valid BAUST department',
      },
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: {
        values: VALID_BLOOD_GROUPS,
        message: '{VALUE} is not a valid blood group',
      },
    },
    isBloodGroupVerified: {
      type: Boolean,
      default: false,
    },
    userType: {
      type: String,
      required: [true, 'User role/type is required'],
      enum: {
        values: VALID_USER_TYPES,
        message: '{VALUE} is not a valid user type',
      },
      default: 'Student',
    },
    // Role specific subdocuments
    studentDetails: {
      type: StudentDetailsSchema,
      default: () => ({}),
    },
    teacherDetails: {
      type: TeacherDetailsSchema,
      default: () => ({}),
    },
    staffDetails: {
      type: StaffDetailsSchema,
      default: () => ({}),
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    availabilityStatus: {
      type: String,
      enum: ['Available', 'Unavailable', 'Cooldown'],
      default: 'Available',
    },
    lastDonationDate: {
      type: Date,
      default: null,
    },
    isDisasterVolunteer: {
      type: Boolean,
      default: false,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    donationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Hash password with bcrypt (salt rounds 10 minimum)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check donor cooldown: Ineligible if lastDonationDate within 90 days (null = eligible)
UserSchema.methods.isEligibleDonor = function () {
  if (!this.lastDonationDate) return true;
  const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - new Date(this.lastDonationDate).getTime();
  return elapsed >= ninetyDaysInMs;
};

// Return safe user representation (never leak password)
UserSchema.methods.toSafeObject = function () {
  const user = this.toObject();
  delete user.password;
  user.isDonorEligible = this.isEligibleDonor();
  return user;
};

// Export model and constants for reuse
module.exports = {
  User: mongoose.models.User || mongoose.model('User', UserSchema),
  VALID_DEPARTMENTS,
  VALID_BLOOD_GROUPS,
  VALID_GENDERS,
  VALID_USER_TYPES,
};
