const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

/**
 * In-memory fallback notifications for demo/offline testing
 */
let inMemoryNotifications = [
  {
    _id: 'demo-notif-1',
    title: '🚨 Emergency SOS: O- Needed at Saidpur CMH',
    message: 'STAT request for Emergency Patient (2 units of O-) at Saidpur CMH Trauma Ward.',
    type: 'EmergencySOS',
    priority: 'Emergency',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    _id: 'demo-notif-2',
    title: '🩸 Requisition Match Accepted',
    message: 'Donor Tanvir Hossain has responded to your requisition #SOS-2025-901.',
    type: 'DonationMatch',
    priority: 'Normal',
    isRead: false,
    createdAt: new Date(Date.now() - 22 * 60 * 1000),
  },
];

/**
 * GET /api/notifications
 * Retrieves notifications for the authenticated user, plus unread count.
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const isConnected = mongoose.connection && mongoose.connection.readyState === 1;

    if (isConnected) {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
      const skip = (page - 1) * limit;

      const [notifications, unreadCount, total] = await Promise.all([
        Notification.find({ recipient: (req.user.id || req.user._id) })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('bloodRequest', 'patientName bloodGroup hospital condition status')
          .lean(),
        Notification.countDocuments({ recipient: (req.user.id || req.user._id), isRead: false }),
        Notification.countDocuments({ recipient: (req.user.id || req.user._id) }),
      ]);

      return res.json({
        success: true,
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          hasMore: skip + notifications.length < total,
        },
      });
    }

    // In-memory fallback
    const unreadCount = inMemoryNotifications.filter((n) => !n.isRead).length;
    return res.json({
      success: true,
      notifications: inMemoryNotifications,
      unreadCount,
      pagination: {
        page: 1,
        limit: 20,
        total: inMemoryNotifications.length,
        hasMore: false,
      },
    });
  } catch (err) {
    console.error('[Get Notifications Error]', err);
    return res.status(500).json({ error: 'Failed to fetch notifications', message: err.message });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const isConnected = mongoose.connection && mongoose.connection.readyState === 1;

    if (isConnected) {
      const updated = await Notification.findOneAndUpdate(
        { _id: id, recipient: (req.user.id || req.user._id) },
        { isRead: true },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      return res.json({ success: true, notification: updated });
    }

    const notif = inMemoryNotifications.find((n) => n._id === id);
    if (notif) notif.isRead = true;
    return res.json({ success: true, notification: notif || { _id: id, isRead: true } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notification', message: err.message });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all user notifications as read.
 */
router.patch('/read-all', verifyToken, async (req, res) => {
  try {
    const isConnected = mongoose.connection && mongoose.connection.readyState === 1;

    if (isConnected) {
      const result = await Notification.updateMany(
        { recipient: (req.user.id || req.user._id), isRead: false },
        { isRead: true }
      );
      return res.json({ success: true, updatedCount: result.modifiedCount });
    }

    inMemoryNotifications.forEach((n) => {
      n.isRead = true;
    });
    return res.json({ success: true, updatedCount: inMemoryNotifications.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to mark all as read', message: err.message });
  }
});

/**
 * POST /api/notifications/register-token
 * Registers or updates the user's FCM device push token.
 */
router.post('/register-token', verifyToken, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({ error: 'FCM device token is required' });
    }

    const isConnected = mongoose.connection && mongoose.connection.readyState === 1;
    if (isConnected) {
      await User.findByIdAndUpdate((req.user.id || req.user._id), { fcmToken: token.trim() });
    }

    return res.json({
      success: true,
      message: 'FCM push registration token saved successfully',
    });
  } catch (err) {
    console.error('[Register FCM Token Error]', err);
    return res.status(500).json({ error: 'Failed to register push token', message: err.message });
  }
});

module.exports = router;
