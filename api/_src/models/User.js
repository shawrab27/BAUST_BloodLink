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
    // ── OAuth / Auth Provider fields ──────────────────────────────────────
    authProvider: {
      type: String,
      enum: ['local', 'google', 'facebook', 'github'],
      default: 'local',
    },
    oauthId: {
      type: String,
      default: null,
      index: true,
      sparse: true, // allow multiple nulls
    },
    /**
     * accountStatus:
     * - 'Verified': Full campus account (local registration OR completed OAuth upgrade)
     * - 'Guest': OAuth login only — no institutionalId/bloodGroup yet
     *
     * CRITICAL: Every gated route checks req.user.accountStatus === 'Verified' server-side.
     * Hiding UI buttons is cosmetic only and never the real gate.
     */
    accountStatus: {
      type: String,
      enum: ['Guest', 'Verified'],
      default: 'Verified', // existing local accounts remain Verified
    },

    // ── Core identity — required for Verified accounts only ───────────────
    institutionalId: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values for Guest accounts
      trim: true,
      uppercase: true,
      match: [/^[a-zA-Z0-9]{16}$/, 'Institutional ID must be exactly 16 alphanumeric characters'],
      validate: {
        validator: function (v) {
          // Required only for Verified accounts
          if (this.accountStatus === 'Verified' && this.authProvider === 'local') {
            return !!v;
          }
          return true;
        },
        message: 'Institutional ID is required for campus accounts',
      },
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
      // Not required for OAuth users
      minlength: [8, 'Password must be at least 8 characters'],
      validate: {
        validator: function (v) {
          if (this.authProvider === 'local') return !!v && v.length >= 8;
          return true; // OAuth users have no password
        },
        message: 'Password is required for local accounts (min 8 characters)',
      },
    },
    gender: {
      type: String,
      enum: {
        values: [...VALID_GENDERS, null],
        message: '{VALUE} is not a valid gender. Allowed: Male, Female',
      },
      default: null,
      validate: {
        validator: function (v) {
          if (this.accountStatus === 'Verified') return VALID_GENDERS.includes(v);
          return true;
        },
        message: 'Gender is required for verified campus accounts',
      },
    },
    department: {
      type: String,
      enum: {
        values: [...VALID_DEPARTMENTS, null],
        message: '{VALUE} is not a valid BAUST department',
      },
      default: null,
      validate: {
        validator: function (v) {
          if (this.accountStatus === 'Verified') return VALID_DEPARTMENTS.includes(v);
          return true;
        },
        message: 'Department is required for verified campus accounts',
      },
    },
    bloodGroup: {
      type: String,
      enum: {
        values: [...VALID_BLOOD_GROUPS, null],
        message: '{VALUE} is not a valid blood group',
      },
      default: null,
      validate: {
        validator: function (v) {
          if (this.accountStatus === 'Verified') return VALID_BLOOD_GROUPS.includes(v);
          return true;
        },
        message: 'Blood group is required for verified campus accounts',
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
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
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
// Skipped for OAuth accounts which have no password field
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method — safe-guards against OAuth accounts with no password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
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
  user.isGuest = this.accountStatus === 'Guest';
  return user;
};

// Export model and constants for reuse (supports both direct and destructured import)
const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
UserModel.User = UserModel;
UserModel.VALID_DEPARTMENTS = VALID_DEPARTMENTS;
UserModel.VALID_BLOOD_GROUPS = VALID_BLOOD_GROUPS;
UserModel.VALID_GENDERS = VALID_GENDERS;
UserModel.VALID_USER_TYPES = VALID_USER_TYPES;

module.exports = UserModel;
