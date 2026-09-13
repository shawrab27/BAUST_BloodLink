const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { connectDB } = require('../config/db');

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
    const dbActive = await isConnected();
    const userId = req.user.userId || req.user.id || req.user._id;

    if (dbActive) {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
      const skip = (page - 1) * limit;

      const [notifications, unreadCount, total] = await Promise.all([
        Notification.find({ recipient: userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('bloodRequest', 'patientName bloodGroup hospital condition status')
          .lean(),
        Notification.countDocuments({ recipient: userId, isRead: false }),
        Notification.countDocuments({ recipient: userId }),
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
    const dbActive = await isConnected();
    const userId = req.user.userId || req.user.id || req.user._id;

    if (dbActive) {
      const updated = await Notification.findOneAndUpdate(
        { _id: id, recipient: userId },
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
    const dbActive = await isConnected();
    const userId = req.user.userId || req.user.id || req.user._id;

    if (dbActive) {
      const result = await Notification.updateMany(
        { recipient: userId, isRead: false },
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

// In-memory token store for test/offline environments
const inMemoryUserTokens = new Map();

/**
 * POST /api/notifications/register-token
 * Registers or appends the user's FCM device push token (multi-device support).
 */
router.post('/register-token', verifyToken, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({ error: 'FCM device token is required' });
    }

    const cleanToken = token.trim();
    const userId = req.user.userId || req.user.id || req.user._id;
    const dbActive = await isConnected();

    if (dbActive) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { fcmTokens: cleanToken },
        fcmToken: cleanToken, // Backwards compatibility
      });
    }

    // Maintain in-memory token list for tests and fallback
    const userKey = String(userId);
    const existing = inMemoryUserTokens.get(userKey) || [];
    if (!existing.includes(cleanToken)) {
      existing.push(cleanToken);
    }
    inMemoryUserTokens.set(userKey, existing);

    return res.json({
      success: true,
      message: 'FCM push registration token saved successfully',
    });
  } catch (err) {
    console.error('[Register FCM Token Error]', err);
    return res.status(500).json({ error: 'Failed to register push token', message: err.message });
  }
});

/**
 * POST /api/notifications/test-push
 * Sends a real FCM push notification to all of the calling user's registered device tokens.
 */
router.post('/test-push', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    let tokens = [];
    const dbActive = await isConnected();

    if (dbActive) {
      const user = await User.findById(userId).select('fcmTokens fcmToken');
      if (user) {
        if (Array.isArray(user.fcmTokens)) tokens.push(...user.fcmTokens);
        if (user.fcmToken) tokens.push(user.fcmToken);
      }
    }

    const memTokens = inMemoryUserTokens.get(String(userId)) || [];
    tokens.push(...memTokens);

    tokens = [...new Set(tokens.filter((t) => typeof t === 'string' && t.trim().length > 0))];

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No registered device push tokens found for this account. Enable push notifications in your browser/device settings first.',
        tokenCount: 0,
      });
    }

    const { sendMulticastNotification } = require('../config/firebase');
    const pushResult = await sendMulticastNotification({
      tokens,
      title: '🩸 BAUST BloodLink — Multi-Device Verification',
      body: 'Verified! Real-time FCM push notification delivered successfully to your device.',
      data: {
        type: 'TestPush',
        sender: 'BAUST BloodLink Push Engine',
        timestamp: new Date().toISOString(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Test push notification dispatched to all registered device tokens.',
      tokenCount: tokens.length,
      pushResult,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Test Push Error]', err);
    return res.status(500).json({
      error: 'Failed to send test push notification',
      message: err.message,
    });
  }
});

module.exports = router;
