const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const { connectDB } = require('../config/db');
const {
  User,
  VALID_DEPARTMENTS,
  VALID_BLOOD_GROUPS,
  VALID_GENDERS,
  VALID_USER_TYPES,
} = require('../models/User');
const { verifyToken, validateRequest, JWT_SECRET } = require('../middleware/auth');
const BloodGroupChangeRequest = require('../models/BloodGroupChangeRequest');

const router = express.Router();

/**
 * Helper to sign 8h JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      institutionalId: user.institutionalId,
      userType: user.userType,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// ─── POST /api/auth/register ────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('institutionalId')
      .trim()
      .toUpperCase()
      .matches(/^[a-zA-Z0-9]{16}$/)
      .withMessage('Institutional ID must be exactly 16 alphanumeric characters'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('A valid email address is required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('gender')
      .isIn(VALID_GENDERS)
      .withMessage(`Gender must be one of: ${VALID_GENDERS.join(', ')}`),
    body('department')
      .isIn(VALID_DEPARTMENTS)
      .withMessage(`Department must be one of: ${VALID_DEPARTMENTS.join(', ')}`),
    body('bloodGroup')
      .isIn(VALID_BLOOD_GROUPS)
      .withMessage(`Blood group must be one of: ${VALID_BLOOD_GROUPS.join(', ')}`),
    body('userType')
      .optional()
      .isIn(VALID_USER_TYPES)
      .withMessage(`User type must be one of: ${VALID_USER_TYPES.join(', ')}`),
    body('phone')
      .optional()
      .trim(),
    body('isDisasterVolunteer')
      .optional()
      .isBoolean()
      .withMessage('isDisasterVolunteer must be a boolean'),
    body('availabilityStatus')
      .optional()
      .isIn(['Available', 'Unavailable', 'Cooldown'])
      .withMessage('availabilityStatus must be Available, Unavailable, or Cooldown'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      await connectDB();

      const {
        institutionalId,
        name,
        email,
        password,
        gender,
        department,
        bloodGroup,
        userType = 'Student',
        studentDetails,
        teacherDetails,
        staffDetails,
        phone,
        isDisasterVolunteer = false,
        availabilityStatus = 'Available',
        fcmToken,
      } = req.body;

      // Check if user already exists by institutionalId or email
      const existingUser = await User.findOne({
        $or: [{ institutionalId }, { email }],
      });

      if (existingUser) {
        if (existingUser.institutionalId === institutionalId) {
          return res.status(409).json({
            error: 'Conflict',
            message: `User with Institutional ID '${institutionalId}' is already registered.`,
            field: 'institutionalId',
            timestamp: new Date().toISOString(),
          });
        }
        if (existingUser.email === email) {
          return res.status(409).json({
            error: 'Conflict',
            message: `User with email '${email}' is already registered.`,
            field: 'email',
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Create new user
      const user = new User({
        institutionalId,
        name,
        email,
        password,
        gender,
        department,
        bloodGroup,
        userType,
        studentDetails: userType === 'Student' ? studentDetails : undefined,
        teacherDetails: userType === 'Teacher' ? teacherDetails : undefined,
        staffDetails: userType === 'Staff' ? staffDetails : undefined,
        phone,
        isDisasterVolunteer,
        availabilityStatus,
        fcmToken: fcmToken || null,
      });

      await user.save();

      const token = generateToken(user);

      return res.status(201).json({
        message: 'Account created successfully',
        token,
        user: user.toSafeObject(),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      // Mongoose duplicate key fallback
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'identifier';
        return res.status(409).json({
          error: 'Conflict',
          message: `An account with that ${field} already exists.`,
          field,
          timestamp: new Date().toISOString(),
        });
      }
      next(err);
    }
  }
);

// ─── POST /api/auth/login ───────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('institutionalId')
      .trim()
      .toUpperCase()
      .matches(/^[a-zA-Z0-9]{16}$/)
      .withMessage('Institutional ID must be exactly 16 alphanumeric characters'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      await connectDB();

      const { institutionalId, password, fcmToken } = req.body;

      const user = await User.findOne({ institutionalId });
      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid Institutional ID or password.',
          timestamp: new Date().toISOString(),
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid Institutional ID or password.',
          timestamp: new Date().toISOString(),
        });
      }

      // Update fcmToken if provided in login call
      if (fcmToken && user.fcmToken !== fcmToken) {
        user.fcmToken = fcmToken;
        await user.save();
      }

      const token = generateToken(user);

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: user.toSafeObject(),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/auth/me ───────────────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    await connectDB();

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User account not found.',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      user: user.toSafeObject(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/auth/fcm-token ──────────────────────────────────────────────
router.patch(
  '/fcm-token',
  verifyToken,
  [
    body('fcmToken')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('fcmToken string is required'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      await connectDB();

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { fcmToken: req.body.fcmToken },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User account not found.',
        });
      }

      return res.status(200).json({
        message: 'FCM token updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/auth/availability ───────────────────────────────────────────
router.patch(
  '/availability',
  verifyToken,
  [
    body('availabilityStatus')
      .optional()
      .isIn(['Available', 'Unavailable', 'Cooldown'])
      .withMessage('availabilityStatus must be Available, Unavailable, or Cooldown'),
    body('isDisasterVolunteer')
      .optional()
      .isBoolean()
      .withMessage('isDisasterVolunteer must be a boolean'),
    body('lastDonationDate')
      .optional()
      .isISO8601()
      .withMessage('lastDonationDate must be a valid ISO8601 date'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      await connectDB();

      const updates = {};
      if (req.body.availabilityStatus !== undefined) {
        updates.availabilityStatus = req.body.availabilityStatus;
      }
      if (req.body.isDisasterVolunteer !== undefined) {
        updates.isDisasterVolunteer = req.body.isDisasterVolunteer;
      }
      if (req.body.lastDonationDate !== undefined) {
        updates.lastDonationDate = req.body.lastDonationDate;
      }

      const user = await User.findByIdAndUpdate(req.user.id, updates, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User account not found.',
        });
      }

      return res.status(200).json({
        message: 'Availability updated successfully',
        user: user.toSafeObject(),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

// In-memory fallback for blood group change requests when DB is disconnected
let mockBloodGroupRequests = [];

/**
 * POST /api/auth/blood-group-change-request
 * Submit a request to update blood group (reviewed by Admin)
 */
router.post(
  '/blood-group-change-request',
  verifyToken,
  [
    body('requestedGroup')
      .isIn(VALID_BLOOD_GROUPS)
      .withMessage(`requestedGroup must be one of: ${VALID_BLOOD_GROUPS.join(', ')}`),
    body('reason').optional().isString().trim(),
    body('note').optional().isString().trim(),
    body('labReportUrl').optional().isString().trim(),
    body('documentUrl').optional().isString().trim(),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { requestedGroup, reason, note, labReportUrl, documentUrl } = req.body;
      const finalNote = note || reason || '';
      const finalDocUrl = documentUrl || labReportUrl || '';
      const userId = req.user.id || req.user.userId;
      const dbActive = mongoose.connection.readyState === 1;

      if (dbActive) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
        }

        // Check if there is already a pending request
        const existing = await BloodGroupChangeRequest.findOne({ user: userId, status: 'Pending' });
        if (existing) {
          return res.status(400).json({
            error: 'Duplicate Request',
            message: 'You already have a pending blood group verification request under review.',
          });
        }

        const requestDoc = new BloodGroupChangeRequest({
          user: userId,
          currentGroup: user.bloodGroup,
          requestedGroup,
          reason: finalNote,
          note: finalNote,
          labReportUrl: finalDocUrl,
          documentUrl: finalDocUrl,
          status: 'Pending',
        });

        await requestDoc.save();
        await requestDoc.populate('user', 'name institutionalId department userType bloodGroup');

        return res.status(201).json({
          message: 'Blood group verification request submitted for admin review.',
          request: requestDoc,
        });
      }

      // Mock fallback
      const existing = mockBloodGroupRequests.find((r) => r.user.toString() === userId.toString() && r.status === 'Pending');
      if (existing) {
        return res.status(400).json({
          error: 'Duplicate Request',
          message: 'You already have a pending blood group verification request under review.',
        });
      }

      const mockReq = {
        _id: new mongoose.Types.ObjectId().toString(),
        user: userId,
        currentGroup: req.user.bloodGroup || 'A+',
        requestedGroup,
        reason: finalNote,
        note: finalNote,
        labReportUrl: finalDocUrl,
        documentUrl: finalDocUrl,
        status: 'Pending',
        createdAt: new Date(),
      };
      mockBloodGroupRequests.unshift(mockReq);

      return res.status(201).json({
        message: 'Blood group verification request submitted for admin review.',
        request: mockReq,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/auth/blood-group-change-request
 * Get user's active/latest blood group change request status
 */
router.get('/blood-group-change-request', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    const dbActive = mongoose.connection.readyState === 1;

    if (dbActive) {
      const requestDoc = await BloodGroupChangeRequest.findOne({ user: userId })
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json({ request: requestDoc || null });
    }

    const mockReq = mockBloodGroupRequests.find((r) => r.user.toString() === userId.toString());
    return res.status(200).json({ request: mockReq || null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.mockBloodGroupRequests = mockBloodGroupRequests;
