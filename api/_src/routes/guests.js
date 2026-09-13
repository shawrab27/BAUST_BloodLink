const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Guest = require('../models/Guest');
const { connectDB } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

let mockGuests = [];

async function isConnected() {
  if (mongoose.connection.readyState === 1) return true;
  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
      return mongoose.connection.readyState === 1;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * GET /api/guests
 * List all guests with pagination, search, and status filtering.
 */
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const status = req.query.status;
    const search = req.query.search;
    const skip = (page - 1) * limit;

    const dbActive = await isConnected();
    if (dbActive) {
      const query = {};
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { guestId: { $regex: search, $options: 'i' } },
        ];
      }

      const [guests, total] = await Promise.all([
        Guest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Guest.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        guests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
      });
    }

    // Mock fallback
    let filtered = [...mockGuests];
    if (status) filtered = filtered.filter((g) => g.status === status);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((g) => (g.name && g.name.toLowerCase().includes(q)) || (g.guestId && g.guestId.toLowerCase().includes(q)));
    }
    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      guests: paginated,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('Error fetching guests:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch guests.' });
  }
});

/**
 * GET /api/guests/:id
 * Retrieve a specific guest by MongoDB _id or guestId.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbActive = await isConnected();

    if (dbActive) {
      const query = mongoose.isValidObjectId(id) ? { _id: id } : { guestId: id };
      const guest = await Guest.findOne(query).lean();
      if (!guest) {
        return res.status(404).json({ error: 'Not Found', message: 'Guest record not found.' });
      }
      return res.status(200).json({ success: true, guest });
    }

    const guest = mockGuests.find((g) => g._id === id || g.guestId === id);
    if (!guest) {
      return res.status(404).json({ error: 'Not Found', message: 'Guest record not found.' });
    }
    return res.status(200).json({ success: true, guest });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * POST /api/guests
 * Create a new guest record / session.
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, avatarUrl, provider, oauthUid, deviceInfo, ipAddress, notes } = req.body;
    const dbActive = await isConnected();

    if (dbActive) {
      const guest = new Guest({
        name: name ? String(name).trim() : 'Guest Explorer',
        email: email ? String(email).trim().toLowerCase() : null,
        avatarUrl: avatarUrl ? String(avatarUrl).trim() : null,
        provider: provider || 'anonymous',
        oauthUid: oauthUid || null,
        deviceInfo: deviceInfo ? String(deviceInfo).trim() : '',
        ipAddress: ipAddress ? String(ipAddress).trim() : req.ip || '',
        notes: notes ? String(notes).trim() : '',
      });

      await guest.save();
      return res.status(201).json({
        success: true,
        message: 'Guest record initialized.',
        guest: guest.toObject(),
      });
    }

    // Mock fallback
    const newGuest = {
      _id: new mongoose.Types.ObjectId().toString(),
      guestId: `GST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      name: name ? String(name).trim() : 'Guest Explorer',
      email: email ? String(email).trim().toLowerCase() : null,
      avatarUrl: avatarUrl || null,
      provider: provider || 'anonymous',
      oauthUid: oauthUid || null,
      deviceInfo: deviceInfo || '',
      ipAddress: ipAddress || req.ip || '',
      status: 'Active',
      convertedToUserId: null,
      notes: notes || '',
      lastActiveAt: new Date(),
      bookmarks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockGuests.unshift(newGuest);

    return res.status(201).json({
      success: true,
      message: 'Guest record initialized.',
      guest: newGuest,
    });
  } catch (err) {
    console.error('Error creating guest:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * PATCH /api/guests/:id
 * Update guest details, notes, status, or bookmark.
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, avatarUrl, status, notes, bookmarks, convertedToUserId } = req.body;
    const dbActive = await isConnected();

    if (dbActive) {
      const query = mongoose.isValidObjectId(id) ? { _id: id } : { guestId: id };
      const updates = { lastActiveAt: new Date() };
      if (name !== undefined) updates.name = String(name).trim();
      if (email !== undefined) updates.email = email ? String(email).trim().toLowerCase() : null;
      if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null;
      if (status !== undefined) updates.status = status;
      if (notes !== undefined) updates.notes = String(notes).trim();
      if (bookmarks !== undefined) updates.bookmarks = bookmarks;
      if (convertedToUserId !== undefined) updates.convertedToUserId = convertedToUserId;

      const guest = await Guest.findOneAndUpdate(query, { $set: updates }, { new: true, runValidators: true });
      if (!guest) {
        return res.status(404).json({ error: 'Not Found', message: 'Guest record not found.' });
      }
      return res.status(200).json({ success: true, message: 'Guest updated successfully.', guest });
    }

    const idx = mockGuests.findIndex((g) => g._id === id || g.guestId === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Not Found', message: 'Guest record not found.' });
    }
    const guest = mockGuests[idx];
    if (name !== undefined) guest.name = String(name).trim();
    if (email !== undefined) guest.email = email ? String(email).trim().toLowerCase() : null;
    if (avatarUrl !== undefined) guest.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null;
    if (status !== undefined) guest.status = status;
    if (notes !== undefined) guest.notes = String(notes).trim();
    if (bookmarks !== undefined) guest.bookmarks = bookmarks;
    if (convertedToUserId !== undefined) guest.convertedToUserId = convertedToUserId;
    guest.updatedAt = new Date();
    guest.lastActiveAt = new Date();

    return res.status(200).json({ success: true, message: 'Guest updated successfully.', guest });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * DELETE /api/guests/:id
 * Delete a guest record.
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbActive = await isConnected();

    if (dbActive) {
      const query = mongoose.isValidObjectId(id) ? { _id: id } : { guestId: id };
      const guest = await Guest.findOneAndDelete(query);
      if (!guest) {
        return res.status(404).json({ error: 'Not Found', message: 'Guest record not found.' });
      }
      return res.status(200).json({ success: true, message: 'Guest record deleted.' });
    }

    const idx = mockGuests.findIndex((g) => g._id === id || g.guestId === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Not Found', message: 'Guest record not found.' });
    }
    mockGuests.splice(idx, 1);
    return res.status(200).json({ success: true, message: 'Guest record deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

module.exports = router;
