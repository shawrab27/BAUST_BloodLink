const express = require('express');
const { connectDB } = require('../config/db');
const { User } = require('../models/User');

const router = express.Router();

/**
 * GET /api/donors — Search & Filter Registered Donors
 *
 * Implements:
 * - Server-side cursor pagination (strictly limited to 15-20 per page, default 18)
 * - Cooldown filter: 90 days interval
 *   - Active: lastDonationDate is null OR > 90 days ago
 *   - Cooldown: lastDonationDate within 90 days
 * - Filter by bloodGroup (A+, A-, B+, B-, AB+, AB-, O+, O-, BOMBAY)
 * - Filter by department (CSE, EEE, ME, ICT, ENG, BBA, AIS, IPE, CE)
 * - Filter by userType (Student, Teacher, Staff)
 * - Search by name or 16-character institutional ID
 */
// Fallback demo donors matching Stitch directory when MONGODB_URI is not configured
const DEMO_DONORS = [
  {
    _id: '6751a0000000000000000001',
    institutionalId: 'CSE0120210001A12',
    name: 'Tanvir Ahmed',
    department: 'CSE',
    userType: 'Student',
    studentDetails: { batch: '19', section: 'A', session: '2020-21' },
    bloodGroup: 'B+',
    availabilityStatus: 'Available',
    phone: '+8801712345678',
    totalDonations: 4,
    lastDonationDate: new Date(Date.now() - 114 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751a0000000000000000002',
    institutionalId: 'EEE0120210002B23',
    name: 'Nusrat Jahan Mim',
    department: 'EEE',
    userType: 'Student',
    studentDetails: { batch: '20', section: 'B', session: '2021-22' },
    bloodGroup: 'A+',
    availabilityStatus: 'Available',
    phone: '+8801722334455',
    totalDonations: 2,
    lastDonationDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751a0000000000000000003',
    institutionalId: 'TEA0120210003C34',
    name: 'Dr. Mahfuzur Rahman',
    department: 'CSE',
    userType: 'Teacher',
    teacherDetails: { designation: 'Associate Professor', roomNumber: 'Academic-401' },
    bloodGroup: 'O+',
    availabilityStatus: 'Available',
    phone: '+8801733445566',
    totalDonations: 7,
    lastDonationDate: null,
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751a0000000000000000004',
    institutionalId: 'ME0120210004D45',
    name: 'Shamima Akter',
    department: 'ME',
    userType: 'Student',
    studentDetails: { batch: '21', section: 'A', session: '2022-23' },
    bloodGroup: 'AB+',
    availabilityStatus: 'Available',
    phone: '+8801744556677',
    totalDonations: 3,
    lastDonationDate: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751a0000000000000000005',
    institutionalId: 'STF0120210005E56',
    name: 'Md. Al-Amin',
    department: 'ICT',
    userType: 'Staff',
    staffDetails: { designation: 'Lab Officer', workingSector: 'Hardware Lab' },
    bloodGroup: 'O-',
    availabilityStatus: 'Available',
    phone: '+8801755667788',
    totalDonations: 1,
    lastDonationDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751a0000000000000000006',
    institutionalId: 'CE0120210006F67',
    name: 'Farzana Yeasmin',
    department: 'CE',
    userType: 'Student',
    studentDetails: { batch: '22', section: 'A', session: '2023-24' },
    bloodGroup: 'A-',
    availabilityStatus: 'Available',
    phone: '+8801766778899',
    totalDonations: 5,
    lastDonationDate: new Date(Date.now() - 130 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751a0000000000000000007',
    institutionalId: 'IPE0120210007G78',
    name: 'Kazi Ariful Islam',
    department: 'IPE',
    userType: 'Student',
    studentDetails: { batch: '18', section: 'B', session: '2019-20' },
    bloodGroup: 'BOMBAY',
    availabilityStatus: 'Available',
    phone: '+8801777889900',
    totalDonations: 2,
    lastDonationDate: null,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751a0000000000000000008',
    institutionalId: 'BBA0120210008H89',
    name: 'Tahmina Sultana',
    department: 'BBA',
    userType: 'Teacher',
    teacherDetails: { designation: 'Lecturer', roomNumber: 'BBA-204' },
    bloodGroup: 'B-',
    availabilityStatus: 'Available',
    phone: '+8801788990011',
    totalDonations: 3,
    lastDonationDate: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '6751a0000000000000000009',
    institutionalId: 'AIS0120210009I90',
    name: 'Rakibul Hasan',
    department: 'AIS',
    userType: 'Student',
    studentDetails: { batch: '20', section: 'A', session: '2021-22' },
    bloodGroup: 'AB-',
    availabilityStatus: 'Available',
    phone: '+8801799001122',
    totalDonations: 4,
    lastDonationDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

router.get('/', async (req, res, next) => {
  try {
    let isDbConnected = false;
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        isDbConnected = true;
      } catch (err) {
        console.warn('[Donors API] DB connection failed, falling back to mock dataset:', err.message);
      }
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 18, 20);
    const { bloodGroup, department, userType, status = 'active', search, cursor } = req.query;

    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = new Date(Date.now() - ninetyDaysMs);

    if (!isDbConnected) {
      // In-memory filter over demo donors
      let filtered = [...DEMO_DONORS];

      if (bloodGroup && bloodGroup !== 'All') {
        const bg = bloodGroup === 'Bombay' || bloodGroup === 'Bombay (hh)' ? 'BOMBAY' : bloodGroup;
        filtered = filtered.filter((d) => d.bloodGroup === bg);
      }

      if (department && department !== 'All') {
        filtered = filtered.filter((d) => d.department === department);
      }

      if (userType && userType !== 'All') {
        filtered = filtered.filter((d) => d.userType === userType);
      }

      if (status === 'active') {
        filtered = filtered.filter(
          (d) => !d.lastDonationDate || new Date(d.lastDonationDate) <= ninetyDaysAgo
        );
      } else if (status === 'cooldown') {
        filtered = filtered.filter(
          (d) => d.lastDonationDate && new Date(d.lastDonationDate) > ninetyDaysAgo
        );
      }

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.institutionalId.toLowerCase().includes(q)
        );
      }

      if (cursor) {
        const cursorDate = new Date(cursor).getTime();
        if (!isNaN(cursorDate)) {
          filtered = filtered.filter((d) => new Date(d.createdAt).getTime() < cursorDate);
        }
      }

      const hasMore = filtered.length > limit;
      const results = hasMore ? filtered.slice(0, limit) : filtered;
      const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].createdAt : null;

      const now = Date.now();
      const formattedDonors = results.map((d) => {
        let isEligible = true;
        let daysSinceDonation = null;
        let cooldownDaysRemaining = 0;

        if (d.lastDonationDate) {
          const donationTime = new Date(d.lastDonationDate).getTime();
          const elapsedDays = Math.floor((now - donationTime) / (24 * 60 * 60 * 1000));
          daysSinceDonation = elapsedDays;

          if (elapsedDays < 90) {
            isEligible = false;
            cooldownDaysRemaining = 90 - elapsedDays;
          }
        }

        return {
          ...d,
          isDonorEligible: isEligible,
          daysSinceDonation,
          cooldownDaysRemaining,
        };
      });

      const activeCount = DEMO_DONORS.filter(
        (d) => !d.lastDonationDate || new Date(d.lastDonationDate) <= ninetyDaysAgo
      ).length;
      const cooldownCount = DEMO_DONORS.filter(
        (d) => d.lastDonationDate && new Date(d.lastDonationDate) > ninetyDaysAgo
      ).length;

      return res.status(200).json({
        donors: formattedDonors,
        nextCursor,
        hasMore,
        counts: {
          total: DEMO_DONORS.length,
          active: activeCount,
          cooldown: cooldownCount,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const andClauses = [];

    // 1. Blood group filter
    if (bloodGroup && bloodGroup !== 'All') {
      const bg = bloodGroup === 'Bombay' || bloodGroup === 'Bombay (hh)' ? 'BOMBAY' : bloodGroup;
      andClauses.push({ bloodGroup: bg });
    }

    // 2. Department filter
    if (department && department !== 'All') {
      andClauses.push({ department });
    }

    // 3. User Type / Role filter
    if (userType && userType !== 'All') {
      andClauses.push({ userType });
    }

    // 4. Cooldown / Status filter
    if (status === 'active') {
      andClauses.push({
        $or: [
          { lastDonationDate: null },
          { lastDonationDate: { $lte: ninetyDaysAgo } },
        ],
      });
      andClauses.push({ availabilityStatus: 'Available' });
    } else if (status === 'cooldown') {
      andClauses.push({ lastDonationDate: { $gt: ninetyDaysAgo } });
    }

    // 5. Search by name or institutionalId
    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(sanitized, 'i');
      andClauses.push({ $or: [{ name: searchRegex }, { institutionalId: searchRegex }] });
    }

    // 6. Cursor pagination (based on createdAt)
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        andClauses.push({ createdAt: { $lt: cursorDate } });
      }
    }

    const query = andClauses.length > 0 ? { $and: andClauses } : {};

    // Fetch donors sorted by createdAt descending
    const donors = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = donors.length > limit;
    const results = hasMore ? donors.slice(0, limit) : donors;
    const nextCursor = hasMore && results.length > 0
      ? results[results.length - 1].createdAt.toISOString()
      : null;

    // Attach computed donor metrics (cooldown days remaining, days since last donation)
    const now = Date.now();
    const formattedDonors = results.map((d) => {
      let isEligible = true;
      let daysSinceDonation = null;
      let cooldownDaysRemaining = 0;

      if (d.lastDonationDate) {
        const donationTime = new Date(d.lastDonationDate).getTime();
        const elapsedDays = Math.floor((now - donationTime) / (24 * 60 * 60 * 1000));
        daysSinceDonation = elapsedDays;

        if (elapsedDays < 90) {
          isEligible = false;
          cooldownDaysRemaining = 90 - elapsedDays;
        }
      }

      return {
        ...d,
        isDonorEligible: isEligible,
        daysSinceDonation,
        cooldownDaysRemaining,
      };
    });

    // Compute summary counts for UI badges
    const [totalCount, activeCount, cooldownCount] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({
        $or: [{ lastDonationDate: null }, { lastDonationDate: { $lte: ninetyDaysAgo } }],
        availabilityStatus: 'Available',
      }),
      User.countDocuments({ lastDonationDate: { $gt: ninetyDaysAgo } }),
    ]);

    return res.status(200).json({
      donors: formattedDonors,
      nextCursor,
      hasMore,
      counts: {
        total: totalCount,
        active: activeCount,
        cooldown: cooldownCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
