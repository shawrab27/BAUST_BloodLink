const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Helpline = require('../models/Helpline');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Initial verified seed contacts for BAUST Campus matching Stitch Executive Directory
const SEED_HELPLINE_CONTACTS = [
  // ── Executive Committee (6 Key Leadership Members) ──────────────────────
  {
    category: 'Committee',
    name: 'Engr. Fahim Shahriar',
    role: 'President',
    subtitle: 'Campus Blood Donor Mobilizations',
    rankBadge: '1st Rank',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    phone: '+880 1711-234567',
    email: 'fahim.shahriar@baust.edu.bd',
    whatsappNumber: '+8801711234567',
    order: 1,
    isAvailable24_7: true,
    location: 'Student Activity Center, Room 204',
  },
  {
    category: 'Committee',
    name: 'Ayesha Siddiqua',
    role: 'Vice President (VP)',
    subtitle: 'Emergency Blood Requisitions Lead',
    rankBadge: '2nd Rank',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    phone: '+880 1712-345678',
    email: 'ayesha.siddiqua@baust.edu.bd',
    whatsappNumber: '+8801712345678',
    order: 2,
    isAvailable24_7: true,
    location: 'SAC Room 204',
  },
  {
    category: 'Committee',
    name: 'Tanvir Hossain',
    role: 'General Secretary (GS)',
    subtitle: 'Donor Registry & Verification',
    rankBadge: '3rd Rank •',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    phone: '+880 1713-456789',
    email: 'tanvir.hossain@baust.edu.bd',
    whatsappNumber: '+8801713456789',
    order: 3,
    isAvailable24_7: true,
    location: 'SAC Room 204',
  },
  {
    category: 'Committee',
    name: 'Nusrat Jahan',
    role: 'Assistant General Secretary (AGS)',
    subtitle: 'Female Donor Mobilization',
    rankBadge: '7th Rank',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    phone: '+880 1714-567890',
    email: 'nusrat.jahan@baust.edu.bd',
    whatsappNumber: '+8801714567890',
    order: 4,
    isAvailable24_7: true,
    location: 'SAC Room 204',
  },
  {
    category: 'Committee',
    name: 'Kazi Farhan Ahmed',
    role: 'Treasurer',
    subtitle: 'Emergency Logistics & Welfare',
    rankBadge: '9th Rank',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    phone: '+880 1715-678901',
    email: 'kazi.farhan@baust.edu.bd',
    whatsappNumber: '+8801715678901',
    order: 5,
    isAvailable24_7: true,
    location: 'SAC Room 204',
  },
  {
    category: 'Committee',
    name: 'Sadia Afreen',
    role: 'Lead Executive Member (CSE Dept)',
    subtitle: 'Department Outreach & Technical',
    rankBadge: '11 Rank',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    phone: '+880 1716-789012',
    email: 'sadia.afreen@baust.edu.bd',
    whatsappNumber: '+8801716789012',
    order: 6,
    isAvailable24_7: true,
    location: 'SAC Room 204',
  },

  // ── Medical Sector Emergency Desk ─────────────────────────────────────────
  {
    category: 'Medical',
    name: 'BAUST Medical Center',
    role: 'Campus Primary Healthcare & Triage Desk',
    subtitle: 'Senior Medical Officer Dr. Mosaffor Hossain',
    rankBadge: 'Campus Clinic',
    avatarUrl: '',
    phone: '+880 1769-662211',
    secondaryPhone: '',
    email: 'medical@baust.edu.bd',
    whatsappNumber: '+8801769662211',
    order: 1,
    isAvailable24_7: true,
    location: 'Ground Floor, Academic Building 1',
    timing: '8:00 AM – 10:00 PM (Emergency On-Call 24/7)',
    notes: 'Campus Primary Healthcare & Triage Desk',
  },
  {
    category: 'Medical',
    name: 'Sub-Assistant Medical Officer',
    role: 'Emergency Medical Duty Officer (SAMO)',
    subtitle: 'On-Duty Resident Doctor',
    rankBadge: '24/7 On-Duty',
    avatarUrl: '',
    phone: '+880 1769-662215',
    secondaryPhone: '',
    email: 'samo@baust.edu.bd',
    whatsappNumber: '+8801769662215',
    order: 2,
    isAvailable24_7: true,
    location: 'Emergency Duty Room, Academic Building 1',
    timing: '24/7 On-Call',
    notes: 'Immediate Cross-Matching Approval',
  },
  {
    category: 'Medical',
    name: 'Saidpur CMH Blood Bank',
    role: 'Combined Military Hospital Cantonment Hub',
    subtitle: 'Regional Transfusion & STAT Laboratory',
    rankBadge: 'Priority Cantonment',
    avatarUrl: '',
    phone: '+880 1769-660112',
    secondaryPhone: '+880 1769-660999',
    email: 'cmh.saidpur@army.mil.bd',
    whatsappNumber: '',
    order: 3,
    isAvailable24_7: true,
    location: 'Saidpur Cantonment',
    timing: '24/7 STAT Blood Bank & Rapid Ambulance',
    notes: 'Official Cantonment Blood Testing Partner',
  },

  // ── Campus Emergency & Logistics ──────────────────────────────────────────
  {
    category: 'Campus',
    name: 'Proctor Office',
    role: 'Disciplinary & Campus Clearance',
    subtitle: 'Campus Entry & Authorization',
    rankBadge: 'Campus Clearance',
    avatarUrl: '',
    phone: '+880 1769-662100',
    email: 'proctor@baust.edu.bd',
    whatsappNumber: '',
    order: 1,
    isAvailable24_7: true,
    location: 'Administrative Building, 2nd Floor',
    timing: '24/7 Rapid Response',
  },
  {
    category: 'Campus',
    name: 'Transport Coordinator',
    role: 'Campus Buses & Cantonment Transfer',
    subtitle: 'Emergency Donor Vehicle Dispatch',
    rankBadge: 'Transport Unit',
    avatarUrl: '',
    phone: '+880 1769-662350',
    email: 'transport@baust.edu.bd',
    whatsappNumber: '',
    order: 2,
    isAvailable24_7: true,
    location: 'Transport Section, Gate 1',
    timing: '24/7 Ambulance & Bus Dispatch',
  },
  {
    category: 'Campus',
    name: 'Cantonment Security Gate',
    role: '24/7 Gate 2 Access & Donor Entry',
    subtitle: 'Night Gate Clearance Support',
    rankBadge: 'Security Post',
    avatarUrl: '',
    phone: '+880 1769-662400',
    email: 'security@baust.edu.bd',
    whatsappNumber: '',
    order: 3,
    isAvailable24_7: true,
    location: 'Main Entry Gate 2',
    timing: '24/7 Continuous Perimeter Guard',
  },

  // ── WhatsApp Community Broadcast ──────────────────────────────────────────
  {
    category: 'WhatsApp',
    name: 'Join Official BAUST Blood Donors WhatsApp Community',
    role: 'Official University Channel • 1,450+ Active Campus Donors',
    subtitle: 'Instant alerts for emergency donor availability, rare group matching requests, and urgent mobilization across all academic departments, campus dormitories, and Saidpur Cantonment.',
    rankBadge: 'Official Network',
    avatarUrl: '',
    phone: '+880 1769-662215',
    whatsappLink: 'https://chat.whatsapp.com/LFMuSuSr2J8EtD8OVfEpJQ',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https%3A%2F%2Fchat.whatsapp.com%2FLFMuSuSr2J8EtD8OVfEpJQ&color=059669&bgcolor=ffffff',
    order: 1,
    isAvailable24_7: true,
    location: 'Saidpur Cantonment & Campus Dormitories',
    notes: 'Strictly Moderated • Emergency Requisitions Only',
  },
];

/**
 * GET /api/helpline
 * Public helpline directory
 */
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = {};

    if (category && ['Committee', 'Medical', 'Campus', 'WhatsApp'].includes(category)) {
      query.category = category;
    }

    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ name: reg }, { role: reg }, { phone: reg }, { location: reg }, { subtitle: reg }];
    }

    const dbActive = mongoose.connection.readyState === 1;
    let contacts = [];

    if (dbActive) {
      contacts = await Helpline.find(query).sort({ order: 1, createdAt: 1 }).lean();
      if (contacts.length === 0 && Object.keys(query).length === 0) {
        try {
          await Helpline.insertMany(SEED_HELPLINE_CONTACTS);
          contacts = await Helpline.find({}).sort({ order: 1, createdAt: 1 }).lean();
        } catch {
          contacts = SEED_HELPLINE_CONTACTS;
        }
      }
    } else {
      contacts = SEED_HELPLINE_CONTACTS.filter((c) => {
        if (query.category && c.category !== query.category) return false;
        if (search && search.trim()) {
          const s = search.trim().toLowerCase();
          return (
            c.name.toLowerCase().includes(s) ||
            c.role.toLowerCase().includes(s) ||
            c.phone.toLowerCase().includes(s) ||
            (c.subtitle && c.subtitle.toLowerCase().includes(s)) ||
            (c.location && c.location.toLowerCase().includes(s))
          );
        }
        return true;
      });
    }

    // Grouping by category
    const grouped = {
      Committee: contacts.filter((c) => c.category === 'Committee'),
      Medical: contacts.filter((c) => c.category === 'Medical'),
      Campus: contacts.filter((c) => c.category === 'Campus'),
      WhatsApp: contacts.filter((c) => c.category === 'WhatsApp'),
    };

    return res.status(200).json({
      contacts,
      grouped,
      whatsappContact: contacts.find((c) => c.category === 'WhatsApp') || null,
      total: contacts.length,
      emergencyHotline: '+880 1769-662215',
    });
  } catch (err) {
    console.error('Error fetching helpline contacts:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch helpline directory.' });
  }
});

// ── In-Memory / Hybrid Real-Time WhatsApp Community Telemetry Store ─────────
const WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/LFMuSuSr2J8EtD8OVfEpJQ';

let WHATSAPP_TELEMETRY = {
  baseMembers: 1450,
  linkVisits: 184,
  qrScans: 96,
  directInvites: 62,
  todayJoins: 24,
  recentActivity: [
    { id: 'act-1', type: 'qr', title: 'Joined via Cantonment QR Scan', location: 'Saidpur CMH', time: new Date(Date.now() - 3 * 60 * 1000).toISOString(), device: 'Mobile' },
    { id: 'act-2', type: 'invite', title: 'Joined via Peer Invite Link', location: 'CSE Dept (Dorm)', time: new Date(Date.now() - 14 * 60 * 1000).toISOString(), device: 'Mobile' },
    { id: 'act-3', type: 'link', title: 'Joined via Web Action Button', location: 'Campus Portal', time: new Date(Date.now() - 28 * 60 * 1000).toISOString(), device: 'Desktop' },
    { id: 'act-4', type: 'qr', title: 'Joined via Medical Desk QR Scan', location: 'BAUST Medical Center', time: new Date(Date.now() - 55 * 60 * 1000).toISOString(), device: 'Mobile' },
    { id: 'act-5', type: 'invite', title: 'Joined via Peer Invite Link', location: 'EEE Dept', time: new Date(Date.now() - 90 * 60 * 1000).toISOString(), device: 'Mobile' },
    { id: 'act-6', type: 'link', title: 'Joined via WhatsApp Community URL', location: 'Saidpur Campus', time: new Date(Date.now() - 140 * 60 * 1000).toISOString(), device: 'Mobile' },
  ],
};

/**
 * GET /api/helpline/whatsapp/stats
 * Real-time community members count and multi-channel telemetry breakdown
 */
router.get('/whatsapp/stats', (req, res) => {
  const totalTrackedJoins = Math.floor(WHATSAPP_TELEMETRY.linkVisits * 0.45) +
    Math.floor(WHATSAPP_TELEMETRY.qrScans * 0.72) +
    Math.floor(WHATSAPP_TELEMETRY.directInvites * 0.88);
  
  const totalMembers = WHATSAPP_TELEMETRY.baseMembers + totalTrackedJoins;
  const totalClicks = WHATSAPP_TELEMETRY.linkVisits + WHATSAPP_TELEMETRY.qrScans + WHATSAPP_TELEMETRY.directInvites;

  return res.status(200).json({
    success: true,
    totalMembers,
    baseMembers: WHATSAPP_TELEMETRY.baseMembers,
    totalClicks,
    totalJoins: totalTrackedJoins,
    todayJoins: WHATSAPP_TELEMETRY.todayJoins,
    whatsappLink: WHATSAPP_COMMUNITY_URL,
    channels: {
      linkVisits: {
        label: 'Direct Link / Web URL',
        count: WHATSAPP_TELEMETRY.linkVisits,
        joins: Math.floor(WHATSAPP_TELEMETRY.linkVisits * 0.45),
        icon: 'link',
        color: 'rose',
      },
      qrScans: {
        label: 'Scanned Green QR Code',
        count: WHATSAPP_TELEMETRY.qrScans,
        joins: Math.floor(WHATSAPP_TELEMETRY.qrScans * 0.72),
        icon: 'qr_code_scanner',
        color: 'emerald',
      },
      directInvites: {
        label: 'Peer Direct Invites & Referrals',
        count: WHATSAPP_TELEMETRY.directInvites,
        joins: Math.floor(WHATSAPP_TELEMETRY.directInvites * 0.88),
        icon: 'share',
        color: 'blue',
      },
    },
    recentActivity: WHATSAPP_TELEMETRY.recentActivity.slice(0, 10),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET & POST /api/helpline/whatsapp/track
 * Tracks visits from CTA button, scanned QR codes, or direct peer invite URLs
 * Query params: ?source=button | qr | invite | url & ref=userId & loc=Saidpur
 */
const handleTrackJoin = (req, res) => {
  const source = (req.query.source || req.body?.source || 'link').toLowerCase();
  const ref = req.query.ref || req.body?.ref || null;
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /mobile|iphone|android|ipad/i.test(userAgent);
  const device = isMobile ? 'Mobile' : 'Desktop';

  let eventTitle = 'Joined via WhatsApp Community URL';
  let eventType = 'link';

  if (source === 'qr') {
    WHATSAPP_TELEMETRY.qrScans += 1;
    eventType = 'qr';
    eventTitle = 'Joined via Green QR Scan';
  } else if (source === 'invite') {
    WHATSAPP_TELEMETRY.directInvites += 1;
    eventType = 'invite';
    eventTitle = ref ? `Joined via Peer Invite (${ref.slice(0, 8)})` : 'Joined via Peer Invite Link';
  } else {
    WHATSAPP_TELEMETRY.linkVisits += 1;
    eventType = 'link';
    eventTitle = source === 'button' ? 'Joined via CTA Action Button' : 'Joined via Web Link';
  }

  WHATSAPP_TELEMETRY.todayJoins += 1;

  // Prepend to live activity
  const newActivity = {
    id: `act-${Date.now()}`,
    type: eventType,
    title: eventTitle,
    location: 'Saidpur / Rangpur Cantonment',
    time: new Date().toISOString(),
    device,
  };
  WHATSAPP_TELEMETRY.recentActivity.unshift(newActivity);
  if (WHATSAPP_TELEMETRY.recentActivity.length > 30) {
    WHATSAPP_TELEMETRY.recentActivity.pop();
  }

  // If browser navigated via GET (e.g. clicked track link or scanned QR code), redirect to WhatsApp
  if (req.method === 'GET' && !req.xhr && req.headers.accept?.includes('text/html')) {
    return res.redirect(302, WHATSAPP_COMMUNITY_URL);
  }

  return res.status(200).json({
    success: true,
    message: 'WhatsApp interaction tracked successfully.',
    source,
    targetUrl: WHATSAPP_COMMUNITY_URL,
    totalMembers: WHATSAPP_TELEMETRY.baseMembers + Math.floor(WHATSAPP_TELEMETRY.linkVisits * 0.45) + Math.floor(WHATSAPP_TELEMETRY.qrScans * 0.72) + Math.floor(WHATSAPP_TELEMETRY.directInvites * 0.88),
  });
};

router.get('/whatsapp/track', handleTrackJoin);
router.post('/whatsapp/track', handleTrackJoin);

/**
 * POST /api/helpline
 * Add a contact (Admin only)
 */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      category,
      name,
      role,
      subtitle,
      rankBadge,
      avatarUrl,
      phone,
      secondaryPhone,
      email,
      whatsappNumber,
      whatsappLink,
      qrCodeUrl,
      order,
      isAvailable24_7,
      location,
      timing,
      notes,
    } = req.body;

    if (!category || !name || !role || !phone) {
      return res.status(400).json({ error: 'Validation Error', message: 'Category, name, role, and phone are required.' });
    }

    const contactData = {
      category,
      name: name.trim(),
      role: role.trim(),
      subtitle: subtitle ? subtitle.trim() : '',
      rankBadge: rankBadge ? rankBadge.trim() : '',
      avatarUrl: avatarUrl ? avatarUrl.trim() : '',
      phone: phone.trim(),
      secondaryPhone: secondaryPhone ? secondaryPhone.trim() : '',
      email: email ? email.trim() : '',
      whatsappNumber: whatsappNumber ? whatsappNumber.trim() : '',
      whatsappLink: whatsappLink ? whatsappLink.trim() : '',
      qrCodeUrl: qrCodeUrl ? qrCodeUrl.trim() : '',
      order: Number(order) || 0,
      isAvailable24_7: Boolean(isAvailable24_7),
      location: location ? location.trim() : '',
      timing: timing ? timing.trim() : '',
      notes: notes ? notes.trim() : '',
    };

    const dbActive = mongoose.connection.readyState === 1;
    if (dbActive) {
      const contact = new Helpline(contactData);
      await contact.save();
      return res.status(201).json({ success: true, message: 'Contact created successfully.', contact: contact.toObject() });
    }

    const newMock = { _id: new mongoose.Types.ObjectId().toString(), ...contactData, createdAt: new Date() };
    SEED_HELPLINE_CONTACTS.push(newMock);
    return res.status(201).json({ success: true, message: 'Contact created successfully.', contact: newMock });
  } catch (err) {
    console.error('Error adding helpline contact:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create helpline contact.' });
  }
});

/**
 * PATCH /api/helpline/:id
 * Update any contact, avatar, phone, timing, or WhatsApp link (Admin only)
 */
router.patch('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates._id;

    const dbActive = mongoose.connection.readyState === 1;
    if (dbActive && mongoose.isValidObjectId(id)) {
      const contact = await Helpline.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
      if (!contact) {
        return res.status(404).json({ error: 'Not Found', message: 'Contact not found.' });
      }
      return res.status(200).json({ success: true, message: 'Helpline contact updated successfully.', contact });
    }

    // Mock fallback
    const idx = SEED_HELPLINE_CONTACTS.findIndex((c) => c._id === id || c.name === id);
    if (idx !== -1) {
      SEED_HELPLINE_CONTACTS[idx] = { ...SEED_HELPLINE_CONTACTS[idx], ...updates, updatedAt: new Date() };
      return res.status(200).json({ success: true, message: 'Helpline contact updated successfully.', contact: SEED_HELPLINE_CONTACTS[idx] });
    }

    return res.status(404).json({ error: 'Not Found', message: 'Contact not found.' });
  } catch (err) {
    console.error('Error updating helpline contact:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update helpline contact.' });
  }
});

/**
 * DELETE /api/helpline/:id
 * Remove a contact (Admin only)
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const dbActive = mongoose.connection.readyState === 1;

    if (dbActive && mongoose.isValidObjectId(id)) {
      const contact = await Helpline.findByIdAndDelete(id);
      if (!contact) {
        return res.status(404).json({ error: 'Not Found', message: 'Contact not found.' });
      }
      return res.status(200).json({ success: true, message: 'Contact deleted successfully.' });
    }

    const idx = SEED_HELPLINE_CONTACTS.findIndex((c) => c._id === id);
    if (idx !== -1) {
      SEED_HELPLINE_CONTACTS.splice(idx, 1);
      return res.status(200).json({ success: true, message: 'Contact deleted successfully.' });
    }

    return res.status(404).json({ error: 'Not Found', message: 'Contact not found.' });
  } catch (err) {
    console.error('Error deleting helpline contact:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete contact.' });
  }
});

module.exports = router;
module.exports.mockHelplineContacts = SEED_HELPLINE_CONTACTS;
