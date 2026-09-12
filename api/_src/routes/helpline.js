const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Helpline = require('../models/Helpline');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Initial seed contacts for BAUST Campus
const SEED_HELPLINE_CONTACTS = [
  // Medical & Hospital Partners
  {
    category: 'Medical',
    name: 'BAUST Campus Medical Center',
    role: 'Senior Medical Officer (Dr. Mosaffor Hossain)',
    phone: '+8801769662215',
    email: 'medical@baust.edu.bd',
    whatsappNumber: '+8801769662215',
    order: 1,
    isAvailable24_7: true,
    location: 'Ground Floor, Academic Building South',
  },
  {
    category: 'Medical',
    name: 'BAUST Emergency Ambulance Service',
    role: '24/7 Rapid Patient Transport Unit',
    phone: '+8801769660000',
    email: '',
    whatsappNumber: '+8801769660000',
    order: 2,
    isAvailable24_7: true,
    location: 'Campus Transport Gate 1',
  },
  {
    category: 'Medical',
    name: 'CMH Saidpur Cantonment Emergency',
    role: 'Combined Military Hospital Triage Desk & Blood Bank',
    phone: '+880552672101',
    email: '',
    whatsappNumber: '',
    order: 3,
    isAvailable24_7: true,
    location: 'Saidpur Cantonment',
  },
  {
    category: 'Medical',
    name: 'Saidpur 100-Bed Hospital Blood Liaison',
    role: 'Government General Hospital Emergency Partner',
    phone: '+8801711223344',
    email: 'saidpurhospital@health.gov.bd',
    whatsappNumber: '+8801711223344',
    order: 4,
    isAvailable24_7: true,
    location: 'Hospital Road, Saidpur',
  },
  // Executive Committee & Community Groups
  {
    category: 'Committee',
    name: 'Kazi Rayhan Hossain',
    role: 'President, BAUST Blood Donation Club',
    phone: '+8801712345678',
    email: 'kazi.rayhan@baust.edu.bd',
    whatsappNumber: '+8801712345678',
    order: 1,
    isAvailable24_7: true,
    location: 'Student Activity Center, Room 204',
  },
  {
    category: 'Committee',
    name: 'Nusrat Jahan',
    role: 'Vice-President & Donor Relations Lead',
    phone: '+8801712987654',
    email: 'nusrat.jahan@baust.edu.bd',
    whatsappNumber: '+8801712987654',
    order: 2,
    isAvailable24_7: true,
    location: 'SAC Room 204',
  },
  {
    category: 'Committee',
    name: 'Siam Chowdhury',
    role: 'General Secretary',
    phone: '+8801798765432',
    email: 'siam.chowdhury@baust.edu.bd',
    whatsappNumber: '+8801798765432',
    order: 3,
    isAvailable24_7: true,
    location: 'SAC Room 204',
  },
  {
    category: 'Committee',
    name: 'Abrar Tanvir',
    role: 'Joint Secretary & Emergency Blood Desk',
    phone: '+8801755123456',
    email: 'abrar.tanvir@baust.edu.bd',
    whatsappNumber: '+8801755123456',
    order: 4,
    isAvailable24_7: true,
    location: 'SAC Room 204',
  },
  {
    category: 'Committee',
    name: 'Sadia Islam',
    role: 'Logistics Secretary & Transport Lead',
    phone: '+8801788234567',
    email: 'sadia.islam@baust.edu.bd',
    whatsappNumber: '+8801788234567',
    order: 5,
    isAvailable24_7: false,
    location: 'SAC Room 204',
  },
  {
    category: 'Committee',
    name: 'Tanzim Ahmed',
    role: 'Hospital & Community Liaison Officer',
    phone: '+8801766345678',
    email: 'tanzim.ahmed@baust.edu.bd',
    whatsappNumber: '+8801766345678',
    order: 6,
    isAvailable24_7: false,
    location: 'SAC Room 204',
  },
  // Campus Logistics & Security
  {
    category: 'Campus',
    name: 'BAUST Proctorial Office',
    role: 'Chief Proctor Emergency Line',
    phone: '+8801769662210',
    email: 'proctor@baust.edu.bd',
    whatsappNumber: '',
    order: 1,
    isAvailable24_7: true,
    location: 'Administrative Building, 2nd Floor',
  },
  {
    category: 'Campus',
    name: 'Campus Security Control Room',
    role: 'Main Gate & Perimeter Security 24/7',
    phone: '+8801769662205',
    email: 'security@baust.edu.bd',
    whatsappNumber: '',
    order: 2,
    isAvailable24_7: true,
    location: 'Main Entry Gate',
  },
  // WhatsApp Community Broadcast
  {
    category: 'WhatsApp',
    name: 'BloodLink Emergency Response Broadcast',
    role: '1,450+ Verified Volunteer Network & Immediate Alerts',
    phone: '+8801769662215',
    email: '',
    whatsappNumber: '+8801769662215',
    order: 1,
    isAvailable24_7: true,
    location: 'Official WhatsApp Community Group',
  },
];

/**
 * GET /api/helpline
 * Public helpline directory
 * Optional filter: ?category=Medical | Committee | Campus | WhatsApp
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
      query.$or = [{ name: reg }, { role: reg }, { phone: reg }, { location: reg }];
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
            (c.location && c.location.toLowerCase().includes(s))
          );
        }
        return true;
      });
    }

    // Grouping by category
    const grouped = {
      Medical: contacts.filter((c) => c.category === 'Medical'),
      Committee: contacts.filter((c) => c.category === 'Committee'),
      Campus: contacts.filter((c) => c.category === 'Campus'),
      WhatsApp: contacts.filter((c) => c.category === 'WhatsApp'),
    };

    return res.status(200).json({
      contacts,
      grouped,
      total: contacts.length,
      emergencyHotline: '+880 1769-662215',
    });
  } catch (err) {
    console.error('Error fetching helpline contacts:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch helpline directory.' });
  }
});

/**
 * POST /api/helpline
 * Add a contact (Admin only)
 */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { category, name, role, phone, email, whatsappNumber, order, isAvailable24_7, location } = req.body;

    if (!category || !name || !role || !phone) {
      return res.status(400).json({ error: 'Validation Error', message: 'Category, name, role, and phone are required.' });
    }

    const contact = new Helpline({
      category,
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      whatsappNumber: whatsappNumber ? whatsappNumber.trim() : '',
      order: Number(order) || 0,
      isAvailable24_7: Boolean(isAvailable24_7),
      location: location ? location.trim() : '',
    });

    await contact.save();
    return res.status(201).json({ message: 'Contact created successfully.', contact });
  } catch (err) {
    console.error('Error adding helpline contact:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create helpline contact.' });
  }
});

/**
 * DELETE /api/helpline/:id
 * Remove a contact (Admin only)
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'Invalid contact ID.' });
    }

    const contact = await Helpline.findByIdAndDelete(id);
    if (!contact) {
      return res.status(404).json({ error: 'Not Found', message: 'Contact not found.' });
    }

    return res.status(200).json({ message: 'Contact deleted successfully.' });
  } catch (err) {
    console.error('Error deleting helpline contact:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete contact.' });
  }
});

module.exports = router;
module.exports.mockHelplineContacts = SEED_HELPLINE_CONTACTS;
