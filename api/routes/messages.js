const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { connectDB } = require('../config/db');

// In-memory fallback message store
let mockMessages = [
  {
    _id: '6751e0000000000000000001',
    conversationId: '6751a0000000000000000001_6751a0000000000000000002',
    sender: {
      _id: '6751a0000000000000000001',
      name: 'Tanvir Ahmed',
      bloodGroup: 'B+',
      avatarUrl: null,
    },
    recipient: '6751a0000000000000000002',
    text: 'Hello, are you available for blood donation at CMH Saidpur tomorrow morning?',
    status: 'read',
    createdAt: new Date(Date.now() - 3600 * 1000 * 5),
  },
  {
    _id: '6751e0000000000000000002',
    conversationId: '6751a0000000000000000001_6751a0000000000000000002',
    sender: {
      _id: '6751a0000000000000000002',
      name: 'Nusrat Jahan Mim',
      bloodGroup: 'A+',
      avatarUrl: null,
    },
    recipient: '6751a0000000000000000001',
    text: 'Yes, I am available after 10:00 AM. Please share the patient bed details.',
    status: 'delivered',
    createdAt: new Date(Date.now() - 3600 * 1000 * 4),
  },
];

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
 * GET /api/messages/conversations
 * List all active conversations for the authenticated user
 */
router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const dbActive = await isConnected();

    if (dbActive) {
      const userObjId = new mongoose.Types.ObjectId(userId);
      const conversations = await Message.aggregate([
        {
          $match: {
            $or: [{ sender: userObjId }, { recipient: userObjId }],
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: '$conversationId',
            lastMessage: { $first: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$recipient', userObjId] },
                      { $ne: ['$status', 'read'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $sort: { 'lastMessage.createdAt': -1 },
        },
      ]);

      const results = await Promise.all(
        conversations.map(async (conv) => {
          const otherUserId =
            conv.lastMessage.sender.toString() === userId.toString()
              ? conv.lastMessage.recipient
              : conv.lastMessage.sender;

          const otherUser = await User.findById(otherUserId)
            .select('name bloodGroup department userType avatarUrl institutionalId phone')
            .lean();

          return {
            conversationId: conv._id,
            recipient: otherUser || { name: 'Donor / Requester', _id: otherUserId, bloodGroup: 'O+' },
            lastMessage: conv.lastMessage,
            unreadCount: conv.unreadCount,
          };
        })
      );

      return res.status(200).json({ conversations: results });
    }

    // Mock fallback
    const userConvs = new Map();
    mockMessages.forEach((m) => {
      const sId = (m.sender._id || m.sender).toString();
      const rId = (m.recipient._id || m.recipient).toString();
      if (sId === userId.toString() || rId === userId.toString()) {
        const convId = m.conversationId;
        if (!userConvs.has(convId)) {
          const otherUserId = sId === userId.toString() ? rId : sId;
          userConvs.set(convId, {
            conversationId: convId,
            recipient: {
              _id: otherUserId,
              name: sId === userId.toString() ? 'Nusrat Jahan Mim' : 'Tanvir Ahmed',
              bloodGroup: 'B+',
              department: 'CSE',
              userType: 'Student',
            },
            lastMessage: m,
            unreadCount: rId === userId.toString() && m.status !== 'read' ? 1 : 0,
          });
        }
      }
    });

    return res.status(200).json({ conversations: Array.from(userConvs.values()) });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch conversations.' });
  }
});

/**
 * GET /api/messages/:conversationId
 * Fetch messages in a conversation (Pollable every 5-7s)
 */
router.get('/:conversationId', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { since } = req.query;
    const userId = req.user.userId || req.user.id || req.user._id;
    const dbActive = await isConnected();

    if (dbActive) {
      const [partA, partB] = conversationId.split('_');
      if (!partA || !partB || (partA !== userId.toString() && partB !== userId.toString())) {
        return res.status(403).json({ error: 'Forbidden', message: 'Not authorized for this conversation.' });
      }

      const query = { conversationId };
      if (since) {
        const sinceDate = new Date(since);
        if (!isNaN(sinceDate.getTime())) {
          query.createdAt = { $gt: sinceDate };
        }
      }

      const messages = await Message.find(query)
        .sort({ createdAt: 1 })
        .populate('sender', 'name avatarUrl bloodGroup')
        .lean();

      return res.status(200).json({ messages, conversationId });
    }

    // Mock fallback
    let filtered = mockMessages.filter((m) => m.conversationId === conversationId);
    if (since) {
      const sinceDate = new Date(since);
      filtered = filtered.filter((m) => new Date(m.createdAt) > sinceDate);
    }
    filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return res.status(200).json({ messages: filtered, conversationId });
  } catch (err) {
    console.error('Error fetching messages:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch messages.' });
  }
});

/**
 * POST /api/messages
 * Send a 1-on-1 message
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const senderId = req.user.userId || req.user.id || req.user._id;
    const { recipientId, text } = req.body;

    if (!recipientId || !mongoose.isValidObjectId(recipientId)) {
      return res.status(400).json({ error: 'Validation Error', message: 'A valid recipient ID is required.' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'Message text cannot be empty.' });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({ error: 'Validation Error', message: 'Message text cannot exceed 1000 characters.' });
    }

    if (senderId.toString() === recipientId.toString()) {
      return res.status(400).json({ error: 'Validation Error', message: 'You cannot message yourself.' });
    }

    const conversationId = Message.getConversationId(senderId, recipientId);
    const dbActive = await isConnected();

    if (dbActive) {
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({ error: 'Not Found', message: 'Recipient not found.' });
      }

      const message = new Message({
        conversationId,
        sender: senderId,
        recipient: recipientId,
        text: text.trim(),
        status: 'sent',
      });

      await message.save();
      await message.populate('sender', 'name avatarUrl bloodGroup');

      return res.status(201).json({
        message: 'Message sent successfully.',
        data: message,
      });
    }

    // Mock fallback creation
    const newMockMessage = {
      _id: new mongoose.Types.ObjectId().toString(),
      conversationId,
      sender: {
        _id: senderId,
        name: req.user.name || 'Campus Volunteer',
        bloodGroup: req.user.bloodGroup || 'A+',
        avatarUrl: null,
      },
      recipient: recipientId,
      text: text.trim(),
      status: 'sent',
      createdAt: new Date(),
    };

    mockMessages.push(newMockMessage);

    return res.status(201).json({
      message: 'Message sent successfully.',
      data: newMockMessage,
    });
  } catch (err) {
    console.error('Error sending message:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to send message.' });
  }
});

/**
 * PATCH /api/messages/:conversationId/read
 * Mark incoming messages in a conversation as read
 */
router.patch('/:conversationId/read', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;
    const dbActive = await isConnected();

    if (dbActive) {
      await Message.updateMany(
        {
          conversationId,
          recipient: userId,
          status: { $ne: 'read' },
        },
        {
          $set: { status: 'read' },
        }
      );
      return res.status(200).json({ success: true, message: 'Messages marked as read.' });
    }

    // Mock fallback
    mockMessages.forEach((m) => {
      if (m.conversationId === conversationId && (m.recipient._id || m.recipient).toString() === userId.toString()) {
        m.status = 'read';
      }
    });

    return res.status(200).json({ success: true, message: 'Messages marked as read.' });
  } catch (err) {
    console.error('Error marking messages read:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to mark messages as read.' });
  }
});

module.exports = router;
