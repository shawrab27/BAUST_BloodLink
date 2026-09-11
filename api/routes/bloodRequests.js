const express = require('express');
const mongoose = require('mongoose');
const { body } = require('express-validator');
const { connectDB } = require('../config/db');
const {
  BloodRequest,
  VALID_BLOOD_GROUPS,
  VALID_COMPONENT_TYPES,
  VALID_URGENCY_LEVELS,
} = require('../models/BloodRequest');
const { User } = require('../models/User');
const { verifyToken, validateRequest } = require('../middleware/auth');

const router = express.Router();

// Fallback demo requests matching Stitch "Active Campus Requests" stream table
let DEMO_REQUESTS = [
  {
    _id: '6751b0000000000000000001',
    patientName: 'Patient #B702',
    diagnosis: 'Trauma ICU • Hemorrhage control',
    bloodGroup: 'B+',
    units: 2,
    componentType: 'whole_blood',
    urgency: 'Critical',
    hospital: 'CMH Saidpur Cantonment',
    hospitalAddress: 'Saidpur Cantonment, Nilphamari',
    hospitalBed: 'Trauma ICU Bed 04',
    contactName: 'Major Tanvir Ahmed',
    contactPhone: '+8801712345678',
    requiredDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000001',
      name: 'Major Tanvir Ahmed',
      institutionalId: 'CSE0120210001A12',
      phone: '+8801712345678',
      department: 'CSE',
      userType: 'Student',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000002',
    patientName: 'Patient #A319',
    diagnosis: 'Apheresis Unit • Acute Thrombocytopenia',
    bloodGroup: 'O-',
    units: 1,
    componentType: 'single_platelet',
    urgency: 'Critical',
    hospital: 'Rangpur Medical College',
    hospitalAddress: 'Medical East Gate, Rangpur',
    hospitalBed: 'Apheresis Bed 02',
    contactName: 'Dr. Karim Uddin',
    contactPhone: '+8801711223344',
    requiredDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000003',
      name: 'Dr. Mahfuzur Rahman',
      institutionalId: 'TEA0120210003C34',
      phone: '+8801733445566',
      department: 'CSE',
      userType: 'Teacher',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000003',
    patientName: 'Patient #N104',
    diagnosis: 'Orthopedic Elective • Hip Replacement',
    bloodGroup: 'A+',
    units: 1,
    componentType: 'packed_rbc',
    urgency: 'Scheduled',
    hospital: 'Saidpur Upazila Health Complex',
    hospitalAddress: 'Saidpur Town, Nilphamari',
    hospitalBed: 'Surgical Ward 3B',
    contactName: 'Nurse In-Charge Salma',
    contactPhone: '+8801733445566',
    requiredDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000004',
      name: 'Shamima Akter',
      institutionalId: 'ME0120210004D45',
      phone: '+8801744556677',
      department: 'ME',
      userType: 'Student',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000004',
    patientName: 'Patient #N208',
    diagnosis: 'Maternity Support • Emergency C-Section',
    bloodGroup: 'AB+',
    units: 2,
    componentType: 'whole_blood',
    urgency: 'Scheduled',
    hospital: 'Prime Medical College Hospital',
    hospitalAddress: 'Badarganj Road, Pirgachha',
    hospitalBed: 'Maternity Unit 12',
    contactName: 'Ward Sister Rebecca',
    contactPhone: '+8801755667788',
    requiredDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000008',
      name: 'Tahmina Sultana',
      institutionalId: 'BBA0120210008H89',
      phone: '+8801788990011',
      department: 'BBA',
      userType: 'Teacher',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
  },
];

/**
 * GET /api/blood-requests/stats — Overview counts for Blood Hub Dashboard
 */
router.get('/stats', async (req, res, next) => {
  try {
    let isDbConnected = false;
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        isDbConnected = true;
      } catch (err) {
        console.warn('[BloodRequests API] DB offline, using mock stats:', err.message);
      }
    }

    if (!isDbConnected) {
      return res.status(200).json({
        activeDonors: 142,
        fulfilledCases: 618,
        liveRequisitions: DEMO_REQUESTS.filter((r) => ['Pending', 'Matching'].includes(r.status)).length,
        avgMatchTimeMinutes: 18,
        timestamp: new Date().toISOString(),
      });
    }

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [activeDonors, fulfilledCases, liveRequisitions] = await Promise.all([
      User.countDocuments({
        $or: [{ lastDonationDate: null }, { lastDonationDate: { $lte: ninetyDaysAgo } }],
        availabilityStatus: 'Available',
      }),
      BloodRequest.countDocuments({ status: 'Fulfilled' }),
      BloodRequest.countDocuments({ status: { $in: ['Pending', 'Matching'] } }),
    ]);

    return res.status(200).json({
      activeDonors,
      fulfilledCases,
      liveRequisitions,
      avgMatchTimeMinutes: 18,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/blood-requests — List Requisitions (Cursor-Paginated 15-20)
 */
router.get('/', async (req, res, next) => {
  try {
    let isDbConnected = false;
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        isDbConnected = true;
      } catch (err) {
        console.warn('[BloodRequests API] DB offline, using mock list:', err.message);
      }
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 15, 20);
    const { status, bloodGroup, urgency, cursor } = req.query;

    if (!isDbConnected) {
      let filtered = [...DEMO_REQUESTS];

      if (status && status !== 'All') {
        filtered = filtered.filter((r) => r.status === status);
      }
      if (bloodGroup && bloodGroup !== 'All') {
        const bg = bloodGroup === 'Bombay' || bloodGroup === 'Bombay (hh)' ? 'BOMBAY' : bloodGroup;
        filtered = filtered.filter((r) => r.bloodGroup === bg);
      }
      if (urgency && urgency !== 'All') {
        filtered = filtered.filter((r) => r.urgency === urgency);
      }

      if (cursor) {
        const cursorDate = new Date(cursor).getTime();
        if (!isNaN(cursorDate)) {
          filtered = filtered.filter((r) => new Date(r.createdAt).getTime() < cursorDate);
        }
      }

      const hasMore = filtered.length > limit;
      const results = hasMore ? filtered.slice(0, limit) : filtered;
      const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].createdAt : null;

      return res.status(200).json({
        requests: results,
        nextCursor,
        hasMore,
        totalCount: DEMO_REQUESTS.length,
        timestamp: new Date().toISOString(),
      });
    }

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }
    if (bloodGroup && bloodGroup !== 'All') {
      const bg = bloodGroup === 'Bombay' || bloodGroup === 'Bombay (hh)' ? 'BOMBAY' : bloodGroup;
      query.bloodGroup = bg;
    }
    if (urgency && urgency !== 'All') {
      query.urgency = urgency;
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        query.createdAt = { $lt: cursorDate };
      }
    }

    const requests = await BloodRequest.find(query)
      .populate('requester', 'name institutionalId phone department userType')
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = requests.length > limit;
    const results = hasMore ? requests.slice(0, limit) : requests;
    const nextCursor = hasMore && results.length > 0
      ? results[results.length - 1].createdAt.toISOString()
      : null;

    const totalCount = await BloodRequest.countDocuments(query);

    return res.status(200).json({
      requests: results,
      nextCursor,
      hasMore,
      totalCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/blood-requests — Create Blood Requisition
 *
 * Enforces:
 * - 10-second Idempotency: Rejects duplicate submissions within 10 seconds
 * - Input validation via express-validator
 * - Authentication via verifyToken
 */
router.post(
  '/',
  verifyToken,
  [
    body('patientName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Patient or case name must be between 2 and 100 characters'),
    body('bloodGroup')
      .isIn(VALID_BLOOD_GROUPS)
      .withMessage(`Blood group must be one of: ${VALID_BLOOD_GROUPS.join(', ')}`),
    body('units')
      .isInt({ min: 1, max: 20 })
      .withMessage('Units must be an integer between 1 and 20'),
    body('componentType')
      .optional()
      .isIn(VALID_COMPONENT_TYPES)
      .withMessage(`Component type must be one of: ${VALID_COMPONENT_TYPES.join(', ')}`),
    body('urgency')
      .optional()
      .isIn(VALID_URGENCY_LEVELS)
      .withMessage(`Urgency must be one of: ${VALID_URGENCY_LEVELS.join(', ')}`),
    body('hospital')
      .trim()
      .notEmpty()
      .withMessage('Hospital name is required'),
    body('contactName')
      .trim()
      .notEmpty()
      .withMessage('Contact name is required'),
    body('contactPhone')
      .trim()
      .notEmpty()
      .withMessage('Contact phone number is required'),
    body('requiredDate')
      .notEmpty()
      .withMessage('Required date/time is mandatory'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      let isDbConnected = false;
      if (process.env.MONGODB_URI) {
        try {
          await connectDB();
          isDbConnected = true;
        } catch (err) {
          console.warn('[BloodRequests API] DB offline, using mock store:', err.message);
        }
      }

      const {
        patientName,
        patientAge,
        bloodGroup,
        units = 1,
        componentType = 'whole_blood',
        urgency = 'Urgent',
        hospital,
        hospitalAddress,
        hospitalBed,
        contactName,
        contactPhone,
        requiredDate,
        diagnosis,
        clinicalNotes,
      } = req.body;

      // ─── 10-SECOND IDEMPOTENCY GUARD ─────────────────────────────────────
      // Reject duplicate submissions from the same user within 10 seconds
      const tenSecondsAgo = new Date(Date.now() - 10000);

      if (!isDbConnected) {
        const duplicate = DEMO_REQUESTS.find(
          (r) =>
            (r.requester?._id?.toString() === req.user.id || r.requester === req.user.id) &&
            r.bloodGroup === bloodGroup &&
            r.hospital === hospital &&
            new Date(r.createdAt) >= tenSecondsAgo
        );

        if (duplicate) {
          return res.status(409).json({
            error: 'Duplicate Submission',
            message:
              'An identical requisition was submitted within the last 10 seconds. Duplicate submission prevented.',
            code: 'IDEMPOTENCY_REJECTION',
            duplicateId: duplicate._id,
            timestamp: new Date().toISOString(),
          });
        }

        const newReq = {
          _id: new mongoose.Types.ObjectId().toString(),
          patientName,
          patientAge: patientAge ? Number(patientAge) : null,
          bloodGroup,
          units,
          componentType,
          urgency,
          hospital,
          hospitalAddress: hospitalAddress || '',
          hospitalBed: hospitalBed || '',
          contactName,
          contactPhone,
          requiredDate: new Date(requiredDate).toISOString(),
          diagnosis: diagnosis || '',
          clinicalNotes: clinicalNotes || '',
          requester: {
            _id: req.user.id,
            name: req.user.name || 'Campus Requester',
            institutionalId: req.user.institutionalId || 'CSE0120210001A12',
            phone: contactPhone,
          },
          status: 'Pending',
          matchedDonors: [],
          responses: [],
          createdAt: new Date().toISOString(),
        };

        DEMO_REQUESTS.unshift(newReq);

        return res.status(201).json({
          message: 'Blood requisition created successfully',
          bloodRequest: newReq,
          timestamp: new Date().toISOString(),
        });
      }

      const duplicate = await BloodRequest.findOne({
        requester: req.user.id,
        bloodGroup,
        hospital,
        createdAt: { $gte: tenSecondsAgo },
      });

      if (duplicate) {
        return res.status(409).json({
          error: 'Duplicate Submission',
          message:
            'An identical requisition was submitted within the last 10 seconds. Duplicate submission prevented.',
          code: 'IDEMPOTENCY_REJECTION',
          duplicateId: duplicate._id,
          timestamp: new Date().toISOString(),
        });
      }

      // Create new Blood Request
      const bloodRequest = new BloodRequest({
        patientName,
        patientAge: patientAge ? Number(patientAge) : null,
        bloodGroup,
        units,
        componentType,
        urgency,
        hospital,
        hospitalAddress: hospitalAddress || '',
        hospitalBed: hospitalBed || '',
        contactName,
        contactPhone,
        requiredDate: new Date(requiredDate),
        diagnosis: diagnosis || '',
        clinicalNotes: clinicalNotes || '',
        requester: req.user.id,
        status: 'Pending',
      });

      await bloodRequest.save();

      return res.status(201).json({
        message: 'Blood requisition created successfully',
        bloodRequest,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/blood-requests/:id — Single Requisition
 */
router.get('/:id', async (req, res, next) => {
  try {
    await connectDB();

    const request = await BloodRequest.findById(req.params.id)
      .populate('requester', 'name institutionalId phone department userType')
      .populate('matchedDonors', 'name institutionalId phone bloodGroup department')
      .populate('responses.donor', 'name institutionalId phone bloodGroup');

    if (!request) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Blood requisition not found',
      });
    }

    return res.status(200).json({ request });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/blood-requests/:id/respond — Donor Response to Requisition
 */
router.patch(
  '/:id/respond',
  verifyToken,
  [
    body('status')
      .isIn(['Accepted', 'Declined', 'Completed'])
      .withMessage('Response status must be Accepted, Declined, or Completed'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      await connectDB();

      const request = await BloodRequest.findById(req.params.id);
      if (!request) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Blood requisition not found',
        });
      }

      // Check if user already responded
      const existingResponseIndex = request.responses.findIndex(
        (r) => r.donor.toString() === req.user.id
      );

      if (existingResponseIndex >= 0) {
        request.responses[existingResponseIndex].status = req.body.status;
        request.responses[existingResponseIndex].respondedAt = new Date();
      } else {
        request.responses.push({
          donor: req.user.id,
          status: req.body.status,
          respondedAt: new Date(),
        });
      }

      if (req.body.status === 'Accepted' && !request.matchedDonors.includes(req.user.id)) {
        request.matchedDonors.push(req.user.id);
        if (request.status === 'Pending') {
          request.status = 'Matching';
        }
      }

      await request.save();

      return res.status(200).json({
        message: 'Response recorded successfully',
        request,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
