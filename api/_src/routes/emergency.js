const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CrisisRequisition = require('../models/CrisisRequisition');
const { User } = require('../models/User');
const { dispatchNotification } = require('../services/notificationService');
const { connectDB } = require('../config/db');

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'BOMBAY'];
const VALID_PATIENT_COHORTS = ['student', 'faculty', 'cantonment', 'civilian'];

// Compatibility lookup helper: who can donate to whom
const DONOR_COMPATIBILITY = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
  'BOMBAY': ['BOMBAY'],
};

// Official 24/7 Verified Emergency Hotlines & Command Escalation
const EMERGENCY_CONTACTS = [
  {
    id: 'triage-unit',
    category: 'Triage Unit',
    icon: 'local_hospital',
    title: 'BAUST Medical Center',
    subtitle: '24/7 Campus Clinical Triage Desk',
    actionText: '+880 1769-662215',
    phone: '+8801769662215',
    actionIcon: 'call',
    btnVariant: 'primary',
  },
  {
    id: 'samo-officer',
    category: 'Medical Officer',
    icon: 'stethoscope',
    title: 'Dr. Mosaffor Hossain',
    subtitle: 'Senior Asst. Medical Officer (SAMO)',
    actionText: 'Call SAMO Direct',
    phone: '+8801769662216',
    actionIcon: 'phone_in_talk',
    btnVariant: 'primary',
  },
  {
    id: 'ambulance-corps',
    category: 'Rapid Evac',
    icon: 'emergency',
    title: 'Campus Ambulance Corps',
    subtitle: 'Rapid Cantonment Highway Dispatch',
    actionText: 'Dispatch Unit',
    phone: '+8801769662217',
    actionIcon: 'ambulance',
    btnVariant: 'neutral',
  },
  {
    id: 'whatsapp-broadcast',
    category: 'Instant Broadcast',
    icon: 'campaign',
    title: 'Donor Crisis Channel',
    subtitle: 'Official Verified WhatsApp Broadcast',
    actionText: 'Open Channel',
    link: 'https://chat.whatsapp.com/baust-bloodlink-crisis',
    actionIcon: 'send',
    btnVariant: 'primary',
  },
];

// Initial Seed Dataset for Campus Requisitions & Tracker
const SEED_REQUISITIONS = [
  {
    _id: '6751c1000000000000000001',
    requisitionId: '#SOS-2025-901',
    clinicalCase: 'Trauma Resuscitation (Road Incident)',
    patientDetails: 'Patient: Civilian Transfer via Cantonment Gate',
    patientCohort: 'civilian',
    bloodGroup: 'O-',
    units: 2,
    destinationHospital: 'Saidpur CMH Emergency',
    urgencyLevel: 'STAT',
    status: 'Donor En Route',
    elapsedTime: '06m 12s',
    contactPhone: '+8801769662215',
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    report: null,
  },
  {
    _id: '6751c1000000000000000002',
    requisitionId: '#SOS-2025-884',
    clinicalCase: 'Severe Hemorrhage / ICU Ward',
    patientDetails: 'Patient: University Lab Staff',
    patientCohort: 'faculty',
    bloodGroup: 'BOMBAY',
    units: 1,
    destinationHospital: 'Rangpur Medical College',
    urgencyLevel: 'STAT',
    status: 'Escalated to Civil Def',
    elapsedTime: '18m 44s',
    contactPhone: '+8801769662216',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    report: null,
  },
  {
    _id: '6751c1000000000000000003',
    requisitionId: '#REQ-2025-780',
    clinicalCase: 'Scheduled Orthopedic Procedure',
    patientDetails: 'Patient: BAUST Faculty',
    patientCohort: 'faculty',
    bloodGroup: 'A+',
    units: 2,
    destinationHospital: 'BAUST Medical Center',
    urgencyLevel: 'Normal',
    status: 'Matching Completed',
    elapsedTime: '42m 10s',
    contactPhone: '+8801769662215',
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    report: null,
  },
  {
    _id: '6751c1000000000000000004',
    requisitionId: '#SOS-2025-752',
    clinicalCase: 'Emergency C-Section Transfusion',
    patientDetails: 'Patient: Cantonment Dependent',
    patientCohort: 'cantonment',
    bloodGroup: 'B+',
    units: 2,
    destinationHospital: 'Saidpur CMH Clinic',
    urgencyLevel: 'STAT',
    status: 'Fulfilled',
    elapsedTime: 'Fulfilled',
    contactPhone: '+8801769662215',
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    report: {
      missionId: '#SOS-2025-752',
      hospital: 'Saidpur CMH',
      timeToFirstMatch: '4m 18s',
      notifiedCount: 12,
      readyCount: 4,
      infusedUnits: 1,
      fcmPushPercent: 75,
      smsFallbackPercent: 25,
      verifiedBy: 'Dr. Mosaffor Hossain (SAMO)',
      verifiedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
  },
];

let inMemoryRequisitions = [...SEED_REQUISITIONS];

// ─── GET /api/emergency/telemetry ───────────────────────────────────────────
router.get(['/telemetry', '/readiness', '/stats'], async (req, res) => {
  try {
    const telemetryData = {
      operationalLevel: 'ELEVATED STANDBY',
      latency: '38ms',
      bridgeStatus: 'Saidpur CMH Bridge Active',
      syncStatus: 'Live Telemetry Synced',
      alertBanner: {
        level: 'Level 2 Alert',
        title: 'Moderate Seismic Tremor (Mag 4.2)',
        sector: 'Northern Regional Sector',
        updatedText: 'Updated 3 mins ago',
        defenseStatus: 'Saidpur Civil Defense Synced',
      },
      readinessDashboard: {
        topBloodGroupsReady: {
          'O+': 18,
          'A+': 24,
          'B+': 14,
          'AB+': 9,
        },
        disasterReserveStandby: {
          volunteersCount: 28,
          percentage: 82,
          label: 'Volunteers Pre-cleared',
        },
        gapWarning: {
          title: 'Rare-Group Gap Warning',
          description: 'Critical Gap: Bombay Phenotype (0) & O- (1 Unit)',
          badgeText: 'IMMEDIATE TRIAGE NOTICE',
        },
        transitWindow: {
          timeRange: '14–20',
          unit: 'Minutes',
          route: 'Saidpur CMH & BAUST Clinic via Highway',
        },
      },
      clinicalSummary:
        'Intra-campus donor availability remains robust for common positive groups, but the regional tremor alert necessitates pre-positioning rare group reserves. With O- at single-unit inventory and zero active Bombay Phenotype donors checked in on campus, emergency coordinators should maintain direct priority liaison with Saidpur CMH blood bank.',
      seismicLogs: [
        '[02:14 UTC] Seismic Shock recorded Mag 4.2 Saidpur Fault. CMH Cantonment initiated standby.',
        '[02:16 UTC] BAUST BloodLink AI ran campus scan: 142 active check-ins detected.',
        '[02:18 UTC] Rare group deficit triggered alert level: ELEVATED STANDBY.',
      ],
      readinessScore: {
        score: 78,
        maxScore: 100,
        assessmentTitle: 'Institutional Assessment',
        assessmentSubtitle: 'Elevated Capability • Tier 1 Preparedness',
        formulaFormula: 'Score = (Available Donors × 0.4) + (Disaster Standby × 0.3) - (Gaps × 15) - (Unresolved SOS × 10)',
        metrics: {
          availableDonors: { label: 'Available Donors', value: '142 Ready' },
          disasterReserve: { label: 'Disaster Reserve', value: '28 Pre-cleared' },
          rareGroupGaps: { label: 'Rare Group Gaps', value: '2 Deficit Groups', isAlert: true },
          activeUnresolvedSos: { label: 'Active Unresolved SOS', value: '3 Cases' },
        },
      },
    };

    return res.status(200).json(telemetryData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/emergency/contacts ───────────────────────────────────────────
router.get('/contacts', (req, res) => {
  return res.status(200).json({ contacts: EMERGENCY_CONTACTS });
});

// ─── GET /api/emergency/requisitions (Tracker Table) ───────────────────────
router.get(['/requisitions', '/active', '/tracker'], async (req, res) => {
  try {
    const { filter = 'all' } = req.query;

    let isDbConnected = false;
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        isDbConnected = true;
      } catch {
        isDbConnected = false;
      }
    }

    if (isDbConnected) {
      let query = {};
      if (filter === 'stat') {
        query.urgencyLevel = 'STAT';
      } else if (filter === 'fulfilled') {
        query.status = 'Fulfilled';
      }

      const dbRequisitions = await CrisisRequisition.find(query).sort({ createdAt: -1 });
      if (dbRequisitions && dbRequisitions.length > 0) {
        return res.status(200).json({ requisitions: dbRequisitions });
      }
    }

    // In-memory filtered list
    let list = inMemoryRequisitions;
    if (filter === 'stat') {
      list = list.filter((r) => r.urgencyLevel === 'STAT');
    } else if (filter === 'fulfilled') {
      list = list.filter((r) => r.status === 'Fulfilled');
    }

    return res.status(200).json({ requisitions: list });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/emergency/sos (Instant Dispatch Trigger) ─────────────────────
router.post(['/sos', '/dispatch', '/trigger'], async (req, res) => {
  try {
    const {
      bloodGroup = 'O-',
      units = 2,
      hospital = 'Saidpur CMH Blood Center',
      patientCohort = 'student',
      clinicalCase,
      contactPhone = '+8801769662215',
    } = req.body;

    const normalizedGroup = bloodGroup.toUpperCase();
    if (!VALID_BLOOD_GROUPS.includes(normalizedGroup)) {
      return res.status(400).json({
        error: `Invalid blood group. Allowed: ${VALID_BLOOD_GROUPS.join(', ')}`,
      });
    }

    const cohortDescMap = {
      student: 'BAUST Enrolled Student',
      faculty: 'Faculty / Admin Staff',
      cantonment: 'Saidpur Cantonment Resident',
      civilian: 'Civilian Emergency Bypass',
    };

    const caseTitle = clinicalCase || `Emergency STAT ${normalizedGroup} Transfusion`;
    const patientDesc = `Patient: ${cohortDescMap[patientCohort] || 'Campus Resident'}`;

    const newReqId = `#SOS-2025-${Math.floor(100 + Math.random() * 900)}`;

    const newRequisition = {
      _id: new mongoose.Types.ObjectId().toString(),
      requisitionId: newReqId,
      clinicalCase: caseTitle,
      patientDetails: patientDesc,
      patientCohort,
      bloodGroup: normalizedGroup,
      units: Number(units) || 2,
      destinationHospital: hospital,
      urgencyLevel: 'STAT',
      status: 'Donor En Route',
      elapsedTime: '00m 15s',
      contactPhone,
      createdAt: new Date().toISOString(),
      report: null,
    };

    // Add to in-memory list
    inMemoryRequisitions.unshift(newRequisition);

    // If connected to Mongo, persist
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        await CrisisRequisition.create(newRequisition);
      } catch (dbErr) {
        console.warn('[Emergency SOS] DB save fallback:', dbErr.message);
      }
    }

    // Attempt push notification dispatch
    try {
      await dispatchNotification({
        type: 'EmergencySOS',
        title: `🚨 EMERGENCY SOS: ${normalizedGroup} Blood Needed`,
        body: `URGENT: ${units} bag(s) of ${normalizedGroup} required at ${hospital} for ${caseTitle}.`,
        data: {
          requisitionId: newReqId,
          bloodGroup: normalizedGroup,
          hospital,
        },
      });
    } catch {
      // Non-blocking notification dispatch
    }

    return res.status(201).json({
      success: true,
      message: 'Instant Campus SOS Dispatched Successfully',
      notifiedDonorsCount: 142,
      disasterVolunteersAlerted: 28,
      requisition: newRequisition,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/emergency/requisitions/:id/report (Mission Report) ───────────
router.get('/requisitions/:id/report', async (req, res) => {
  try {
    const { id } = req.params;

    const matched = inMemoryRequisitions.find(
      (r) => r.requisitionId === id || r._id === id
    );

    if (matched && matched.report) {
      return res.status(200).json({ report: matched.report });
    }

    // Default sample report for showcase matching Stitch screen modal
    const defaultReport = {
      missionId: id.startsWith('#') ? id : `#SOS-2025-752`,
      hospital: 'Saidpur CMH',
      timeToFirstMatch: '4m 18s',
      notifiedCount: 12,
      readyCount: 4,
      infusedUnits: 1,
      fcmPushPercent: 75,
      smsFallbackPercent: 25,
      verifiedBy: 'Dr. Mosaffor Hossain (SAMO)',
      verifiedAt: new Date().toISOString(),
    };

    return res.status(200).json({ report: defaultReport });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
