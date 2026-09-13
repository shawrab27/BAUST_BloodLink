const express = require('express');
const mongoose = require('mongoose');
const { body } = require('express-validator');
const { connectDB } = require('../config/db');
const {
  BloodRequest,
  VALID_BLOOD_GROUPS,
  VALID_CONDITIONS,
  VALID_PATIENT_TYPES,
} = require('../models/BloodRequest');
const { User } = require('../models/User');
const { verifyToken, validateRequest, requireVerifiedAccount } = require('../middleware/auth');

const router = express.Router();

// Fallback demo requests matching Stitch "Active Campus Requests" stream table (18 entries for multi-page demonstration)
let DEMO_REQUESTS = [
  {
    _id: '6751b0000000000000000001',
    patientName: 'Patient #B702',
    patientType: 'Civilian',
    diagnosis: 'Trauma ICU • Hemorrhage control',
    bloodGroup: 'B+',
    units: 2,
    condition: 'Emergency',
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
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000002',
    patientName: 'Patient #A319',
    patientType: 'Student',
    diagnosis: 'Apheresis Unit • Acute Thrombocytopenia',
    bloodGroup: 'O-',
    units: 1,
    condition: 'Emergency',
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
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000003',
    patientName: 'Patient #N104',
    patientType: 'Staff',
    diagnosis: 'Orthopedic Elective • Hip Replacement',
    bloodGroup: 'A+',
    units: 1,
    condition: 'Normal',
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
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000004',
    patientName: 'Patient #N208',
    patientType: 'Teacher',
    diagnosis: 'Maternity Support • Emergency C-Section',
    bloodGroup: 'AB+',
    units: 2,
    condition: 'Normal',
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
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000005',
    patientName: 'Patient #S512',
    patientType: 'Student',
    diagnosis: 'Emergency OT • Multiple Fracture Fixation',
    bloodGroup: 'A-',
    units: 2,
    condition: 'Emergency',
    hospital: 'CMH Saidpur Cantonment',
    hospitalAddress: 'Saidpur Cantonment, Nilphamari',
    hospitalBed: 'Emergency OT 01',
    contactName: 'Capt. Rakib Hasan',
    contactPhone: '+8801719876543',
    requiredDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000005',
      name: 'Capt. Rakib Hasan',
      institutionalId: 'EEE0120210005E56',
      phone: '+8801719876543',
      department: 'EEE',
      userType: 'Student',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000006',
    patientName: 'Patient #C890',
    patientType: 'Civilian',
    diagnosis: 'Cardiac ICU • Acute Coronary Revascularization',
    bloodGroup: 'O+',
    units: 3,
    condition: 'Emergency',
    hospital: 'Rangpur Community Medical College',
    hospitalAddress: 'Medical Purbopara, Rangpur',
    hospitalBed: 'CCU Bed 05',
    contactName: 'Dr. Shahinur Alam',
    contactPhone: '+8801722334455',
    requiredDate: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000006',
      name: 'Dr. Shahinur Alam',
      institutionalId: 'CIV0120210006F67',
      phone: '+8801722334455',
      department: 'Civil',
      userType: 'Teacher',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000007',
    patientName: 'Patient #T341',
    patientType: 'Teacher',
    diagnosis: 'Post-Op Surgical Support • Cholecystectomy',
    bloodGroup: 'B-',
    units: 1,
    condition: 'Normal',
    hospital: "Doctor's Community Hospital Saidpur",
    hospitalAddress: 'Bangabandhu Sarak, Saidpur',
    hospitalBed: 'Post-Op Ward 2',
    contactName: 'Prof. Anisur Rahman',
    contactPhone: '+8801733446677',
    requiredDate: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000007',
      name: 'Prof. Anisur Rahman',
      institutionalId: 'IPE0120210007G78',
      phone: '+8801733446677',
      department: 'IPE',
      userType: 'Teacher',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000008',
    patientName: 'Patient #S902',
    patientType: 'Student',
    diagnosis: 'Hematology Ward • Aplastic Anemia Support',
    bloodGroup: 'AB-',
    units: 1,
    condition: 'Emergency',
    hospital: 'Rangpur Medical College',
    hospitalAddress: 'Medical East Gate, Rangpur',
    hospitalBed: 'Hematology Unit 08',
    contactName: 'Ashikur Rahman',
    contactPhone: '+8801744557788',
    requiredDate: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000008',
      name: 'Ashikur Rahman',
      institutionalId: 'CSE0120210008H89',
      phone: '+8801744557788',
      department: 'CSE',
      userType: 'Student',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000009',
    patientName: 'Patient #N614',
    patientType: 'Staff',
    diagnosis: 'General Surgery • Gastrointestinal Resection',
    bloodGroup: 'O+',
    units: 2,
    condition: 'Normal',
    hospital: 'Saidpur Railway Hospital',
    hospitalAddress: 'Station Road, Saidpur',
    hospitalBed: 'General Ward 4A',
    contactName: 'Abdul Malek',
    contactPhone: '+8801755668899',
    requiredDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000009',
      name: 'Abdul Malek',
      institutionalId: 'STA0120210009I90',
      phone: '+8801755668899',
      department: 'Admin',
      userType: 'Staff',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 130 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000010',
    patientName: 'Patient #C405',
    patientType: 'Civilian',
    diagnosis: 'Trauma ICU • Road Traffic Accident',
    bloodGroup: 'A+',
    units: 2,
    condition: 'Emergency',
    hospital: 'CMH Rangpur Cantonment',
    hospitalAddress: 'Cantonment Area, Rangpur',
    hospitalBed: 'ICU Bed 03',
    contactName: 'Lt. Farhana Yasmin',
    contactPhone: '+8801766779900',
    requiredDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000010',
      name: 'Lt. Farhana Yasmin',
      institutionalId: 'CSE0120210010J01',
      phone: '+8801766779900',
      department: 'CSE',
      userType: 'Student',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000011',
    patientName: 'Patient #S721',
    patientType: 'Student',
    diagnosis: 'Orthopedic Elective • Knee Arthroscopy',
    bloodGroup: 'B+',
    units: 1,
    condition: 'Normal',
    hospital: 'Prime Medical College Hospital',
    hospitalAddress: 'Badarganj Road, Pirgachha',
    hospitalBed: 'Surgical Ward 1A',
    contactName: 'Zubair Hossain',
    contactPhone: '+8801777880011',
    requiredDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000011',
      name: 'Zubair Hossain',
      institutionalId: 'EEE0120210011K12',
      phone: '+8801777880011',
      department: 'EEE',
      userType: 'Student',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 170 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000012',
    patientName: 'Patient #T118',
    patientType: 'Teacher',
    diagnosis: 'Emergency Dialysis • Acute Renal Anemia',
    bloodGroup: 'O-',
    units: 2,
    condition: 'Emergency',
    hospital: 'Saidpur Upazila Health Complex',
    hospitalAddress: 'Saidpur Town, Nilphamari',
    hospitalBed: 'Emergency Unit 01',
    contactName: 'Dr. Tariq Aziz',
    contactPhone: '+8801788991122',
    requiredDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000012',
      name: 'Dr. Tariq Aziz',
      institutionalId: 'TEA0120210012L23',
      phone: '+8801788991122',
      department: 'ME',
      userType: 'Teacher',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 190 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000013',
    patientName: 'Patient #N309',
    patientType: 'Staff',
    diagnosis: 'Cardiology Support • Pacemaker Implantation',
    bloodGroup: 'AB+',
    units: 1,
    condition: 'Normal',
    hospital: 'Rangpur Medical College',
    hospitalAddress: 'Medical East Gate, Rangpur',
    hospitalBed: 'Cardiology Ward 5',
    contactName: 'Moniruzzaman',
    contactPhone: '+8801799002233',
    requiredDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000013',
      name: 'Moniruzzaman',
      institutionalId: 'STA0120210013M34',
      phone: '+8801799002233',
      department: 'Security',
      userType: 'Staff',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000014',
    patientName: 'Patient #S884',
    patientType: 'Student',
    diagnosis: 'Pediatric ICU • Thalassemia Major Crisis',
    bloodGroup: 'A-',
    units: 1,
    condition: 'Emergency',
    hospital: 'CMH Saidpur Cantonment',
    hospitalAddress: 'Saidpur Cantonment, Nilphamari',
    hospitalBed: 'Pediatric ICU 02',
    contactName: 'Nusrat Jahan',
    contactPhone: '+8801700113344',
    requiredDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000014',
      name: 'Nusrat Jahan',
      institutionalId: 'BBA0120210014N45',
      phone: '+8801700113344',
      department: 'BBA',
      userType: 'Student',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 230 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000015',
    patientName: 'Patient #C192',
    patientType: 'Civilian',
    diagnosis: 'Orthopedic Ward • Spinal Decompression',
    bloodGroup: 'B-',
    units: 2,
    condition: 'Normal',
    hospital: "Doctor's Community Hospital Saidpur",
    hospitalAddress: 'Bangabandhu Sarak, Saidpur',
    hospitalBed: 'Ortho Unit 04',
    contactName: 'Saidul Islam',
    contactPhone: '+8801711224455',
    requiredDate: new Date(Date.now() + 60 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000015',
      name: 'Saidul Islam',
      institutionalId: 'CIV0120210015O56',
      phone: '+8801711224455',
      department: 'Civilian',
      userType: 'Student',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 250 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000016',
    patientName: 'Patient #S633',
    patientType: 'Student',
    diagnosis: 'Trauma Emergency • Crush Injury Resuscitation',
    bloodGroup: 'O+',
    units: 3,
    condition: 'Emergency',
    hospital: 'Rangpur Community Medical College',
    hospitalAddress: 'Medical Purbopara, Rangpur',
    hospitalBed: 'Trauma Ward 2B',
    contactName: 'Siam Chowdhury',
    contactPhone: '+8801722335566',
    requiredDate: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000016',
      name: 'Siam Chowdhury',
      institutionalId: 'CSE0120210016P67',
      phone: '+8801722335566',
      department: 'CSE',
      userType: 'Student',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 270 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000017',
    patientName: 'Patient #T942',
    patientType: 'Teacher',
    diagnosis: 'General Medicine • Severe Anemia Management',
    bloodGroup: 'A+',
    units: 1,
    condition: 'Normal',
    hospital: 'CMH Saidpur Cantonment',
    hospitalAddress: 'Saidpur Cantonment, Nilphamari',
    hospitalBed: 'General Medicine 06',
    contactName: 'Dr. Shahriar Kabir',
    contactPhone: '+8801733446688',
    requiredDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000017',
      name: 'Dr. Shahriar Kabir',
      institutionalId: 'TEA0120210017Q78',
      phone: '+8801733446688',
      department: 'CSE',
      userType: 'Teacher',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 290 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751b0000000000000000018',
    patientName: 'Patient #C550',
    patientType: 'Civilian',
    diagnosis: 'Burn & Plastic • Intensive Reconstructive Unit',
    bloodGroup: 'AB-',
    units: 1,
    condition: 'Emergency',
    hospital: 'Prime Medical College Hospital',
    hospitalAddress: 'Badarganj Road, Pirgachha',
    hospitalBed: 'Burn Unit Bed 02',
    contactName: 'Kabir Hossain',
    contactPhone: '+8801744558899',
    requiredDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    requester: {
      _id: '6751a0000000000000000018',
      name: 'Kabir Hossain',
      institutionalId: 'CIV0120210018R89',
      phone: '+8801744558899',
      department: 'Civilian',
      userType: 'Student',
    },
    matchedDonors: [],
    responses: [],
    createdAt: new Date(Date.now() - 310 * 60 * 1000).toISOString(),
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
        liveRequisitions: DEMO_REQUESTS.length,
        avgMatchTimeMinutes: 18,
        timestamp: new Date().toISOString(),
      });
    }

    const [activeDonors, fulfilledCases, liveRequisitions] = await Promise.all([
      User.countDocuments({ isDonorEligible: true, isAvailableForDonation: true }),
      BloodRequest.countDocuments({ status: 'Fulfilled' }),
      BloodRequest.countDocuments({ status: { $in: ['Pending', 'In-Progress'] } }),
    ]);

    return res.status(200).json({
      activeDonors: activeDonors || 142,
      fulfilledCases: fulfilledCases || 618,
      liveRequisitions: liveRequisitions || DEMO_REQUESTS.length,
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

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const { status, bloodGroup, condition, cursor } = req.query;

    if (!isDbConnected) {
      let filtered = [...DEMO_REQUESTS];

      if (status && status !== 'All') {
        filtered = filtered.filter((r) => r.status === status);
      }
      if (bloodGroup && bloodGroup !== 'All') {
        filtered = filtered.filter((r) => r.bloodGroup === bloodGroup);
      }
      if (condition && condition !== 'All') {
        filtered = filtered.filter((r) => r.condition === condition);
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
      query.bloodGroup = bloodGroup;
    }
    if (condition && condition !== 'All') {
      query.condition = condition;
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
  requireVerifiedAccount,
  [
    body('patientName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Patient or case name must be between 2 and 100 characters'),
    body('patientType')
      .isIn(VALID_PATIENT_TYPES)
      .withMessage(`Patient type must be one of: ${VALID_PATIENT_TYPES.join(', ')}`),
    body('bloodGroup')
      .isIn(VALID_BLOOD_GROUPS)
      .withMessage(`Blood group must be one of: ${VALID_BLOOD_GROUPS.join(', ')}`),
    body('units')
      .isInt({ min: 1, max: 20 })
      .withMessage('Units must be an integer between 1 and 20'),
    body('condition')
      .optional()
      .isIn(VALID_CONDITIONS)
      .withMessage(`Condition must be one of: ${VALID_CONDITIONS.join(', ')}`),
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
        patientType,
        patientAge,
        bloodGroup,
        units = 1,
        condition = 'Normal',
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
          patientType,
          patientAge: patientAge ? Number(patientAge) : null,
          bloodGroup,
          units,
          condition,
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
        patientType,
        patientAge: patientAge ? Number(patientAge) : null,
        bloodGroup,
        units,
        condition,
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
  requireVerifiedAccount,
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
module.exports.mockBloodRequests = DEMO_REQUESTS;
