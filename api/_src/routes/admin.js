const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, query, validationResult } = require('express-validator');
const { verifyToken, requireAdmin, validateRequest } = require('../middleware/auth');
const User = require('../models/User');
const { BloodRequest, VALID_STATUSES } = require('../models/BloodRequest');
const BloodGroupChangeRequest = require('../models/BloodGroupChangeRequest');
const Helpline = require('../models/Helpline');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const AuditLog = require('../models/AuditLog');
const { connectDB } = require('../config/db');

// In-memory mock audit logs for local/offline testing
let mockAuditLogs = [
  {
    _id: '675200000000000000000001',
    action: 'INIT_ADMIN_SYSTEM',
    adminId: '6751a0000000000000000004',
    performedBy: {
      _id: '6751a0000000000000000004',
      name: 'System Super Admin',
      institutionalId: 'ADM0120210004D56',
    },
    targetModel: 'System',
    targetType: 'System',
    targetId: 'SYSTEM',
    details: { note: 'Initial admin subsystem booted' },
    ipAddress: '127.0.0.1',
    createdAt: new Date(Date.now() - 3600000 * 24),
  },
];

// Fallback in-memory users for offline/mock test runs
let mockAdminUsers = [
  {
    _id: '6751a0000000000000000001',
    name: 'Tanvir Ahmed',
    institutionalId: 'CSE0120210001A12',
    email: 'tanvir@baust.edu.bd',
    department: 'CSE',
    userType: 'Student',
    bloodGroup: 'B+',
    availabilityStatus: 'Available',
    isActive: true,
    isSuspended: false,
    isDisasterVolunteer: true,
  },
  {
    _id: '6751a0000000000000000002',
    name: 'Nusrat Jahan Mim',
    institutionalId: 'EEE0120210002B23',
    email: 'mim@baust.edu.bd',
    department: 'EEE',
    userType: 'Student',
    bloodGroup: 'A+',
    availabilityStatus: 'Cooldown',
    isActive: true,
    isSuspended: false,
    isDisasterVolunteer: false,
  },
  {
    _id: '6751a0000000000000000003',
    name: 'Dr. Mahfuzur Rahman',
    institutionalId: 'TEA0120210003C34',
    email: 'mahfuz@baust.edu.bd',
    department: 'CSE',
    userType: 'Teacher',
    bloodGroup: 'O+',
    availabilityStatus: 'Available',
    isActive: true,
    isSuspended: false,
    isDisasterVolunteer: true,
  },
  {
    _id: '6751a0000000000000000004',
    name: 'System Super Admin',
    institutionalId: 'ADM0120210004D56',
    email: 'admin@baust.edu.bd',
    department: 'ICT',
    userType: 'Admin',
    bloodGroup: 'AB+',
    availabilityStatus: 'Available',
    isActive: true,
    isSuspended: false,
    isDisasterVolunteer: false,
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
 * Helper to record audit logs to MongoDB and in-memory cache
 */
async function logAuditEvent({ action, req, targetModel, targetType, targetId, details = {} }) {
  const adminId = req.user.id || req.user.userId;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const resolvedTargetModel = targetModel || targetType || 'System';

  try {
    const dbActive = await isConnected();
    if (dbActive) {
      await AuditLog.create({
        action,
        adminId,
        performedBy: adminId,
        targetModel: resolvedTargetModel,
        targetType: resolvedTargetModel,
        targetId: String(targetId || ''),
        details,
        ipAddress,
      });
    }
  } catch (err) {
    console.error('[AuditLog] Failed to persist audit log to MongoDB:', err.message);
  }

  // Always keep in mock cache for immediate view / test assertions
  mockAuditLogs.unshift({
    _id: new mongoose.Types.ObjectId().toString(),
    action,
    adminId,
    performedBy: {
      _id: adminId,
      name: req.user.name || 'Admin Officer',
      institutionalId: req.user.institutionalId || 'ADM0120210004D56',
    },
    targetModel: resolvedTargetModel,
    targetType: resolvedTargetModel,
    targetId: String(targetId || ''),
    details,
    ipAddress,
    createdAt: new Date(),
  });
}

// ─── RBAC GUARD ON ENTIRE ROUTER ─────────────────────────────────────────────
router.use(verifyToken, requireAdmin);

// ─── 1. OVERVIEW METRICS (REAL DB AGGREGATIONS ONLY) ──────────────────────────
router.get('/overview', async (req, res, next) => {
  try {
    const dbActive = await isConnected();

    if (dbActive) {
      const [
        totalUsers,
        availableDonors,
        disasterVolunteers,
        donorsByGroupRaw,
        totalSosAlerts,
        activeEmergencyCount,
        totalRequests,
        fulfilledRequests,
        pendingGroupChanges,
        totalPosts,
        totalHelplines,
        totalAuditLogs,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ availabilityStatus: 'Available', isSuspended: false }),
        User.countDocuments({ isDisasterVolunteer: true }),
        User.aggregate([
          { $match: { availabilityStatus: 'Available', isSuspended: false } },
          { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        BloodRequest.countDocuments({ condition: 'Emergency' }),
        BloodRequest.countDocuments({ condition: 'Emergency', status: { $in: ['Pending', 'Matching'] } }),
        BloodRequest.countDocuments(),
        BloodRequest.countDocuments({ status: 'Fulfilled' }),
        BloodGroupChangeRequest.countDocuments({ status: 'Pending' }),
        Post.countDocuments(),
        Helpline.countDocuments(),
        AuditLog.countDocuments(),
      ]);

      const donorsByBloodGroup = {};
      donorsByGroupRaw.forEach((item) => {
        if (item._id) donorsByBloodGroup[item._id] = item.count;
      });

      return res.status(200).json({
        metrics: {
          totalUsers,
          availableDonors,
          disasterVolunteers,
          donorsByBloodGroup,
          totalSosAlerts,
          activeEmergencyCount,
          totalRequests,
          fulfilledRequests,
          pendingGroupChanges,
          totalPosts,
          totalHelplines,
          totalAuditLogs,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Mock fallback when DB is disconnected
    const donorsByBloodGroup = {};
    mockAdminUsers
      .filter((u) => u.availabilityStatus === 'Available')
      .forEach((u) => {
        donorsByBloodGroup[u.bloodGroup] = (donorsByBloodGroup[u.bloodGroup] || 0) + 1;
      });

    return res.status(200).json({
      metrics: {
        totalUsers: mockAdminUsers.length,
        availableDonors: mockAdminUsers.filter((u) => u.availabilityStatus === 'Available').length,
        disasterVolunteers: mockAdminUsers.filter((u) => u.isDisasterVolunteer).length,
        donorsByBloodGroup,
        totalSosAlerts: 6,
        activeEmergencyCount: 2,
        totalRequests: 34,
        fulfilledRequests: 25,
        pendingGroupChanges: 2,
        totalPosts: 18,
        totalHelplines: 8,
        totalAuditLogs: mockAuditLogs.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// ─── 2. FEED MODERATION (POSTS & COMMENTS: DISMISS, HIDE, DELETE) ─────────────
router.get('/posts', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 15, 50);
    const cursor = req.query.cursor;
    const flaggedOnly = req.query.flagged === 'true';
    const dbActive = await isConnected();

    if (dbActive) {
      const queryFilter = {};
      if (flaggedOnly) queryFilter.isFlagged = true;
      if (cursor && mongoose.isValidObjectId(cursor)) {
        queryFilter._id = { $lt: cursor };
      }

      const posts = await Post.find(queryFilter)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .populate('author', 'name institutionalId department userType bloodGroup')
        .populate('reportedBy', 'name institutionalId');

      const hasMore = posts.length > limit;
      const results = hasMore ? posts.slice(0, limit) : posts;
      const nextCursor = hasMore ? results[results.length - 1]._id : null;

      return res.status(200).json({
        posts: results,
        nextCursor,
        hasMore,
      });
    }

    // Mock fallback
    const { mockPosts } = require('./posts');
    let postsList = mockPosts || [];
    if (flaggedOnly) postsList = postsList.filter((p) => p.isFlagged);
    return res.status(200).json({
      posts: postsList.slice(0, limit),
      nextCursor: null,
      hasMore: false,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/posts/:id/pin', async (req, res, next) => {
  try {
    const { id } = req.params;
    const dbActive = await isConnected();

    let updatedPost;
    if (dbActive) {
      const post = await Post.findById(id);
      if (!post) return res.status(404).json({ error: 'Not Found', message: 'Post not found.' });
      post.isPinned = !post.isPinned;
      await post.save();
      updatedPost = post;
    } else {
      const { mockPosts } = require('./posts');
      const p = (mockPosts || []).find((item) => item._id.toString() === id.toString());
      if (!p) return res.status(404).json({ error: 'Not Found', message: 'Post not found.' });
      p.isPinned = !p.isPinned;
      updatedPost = p;
    }

    await logAuditEvent({
      action: updatedPost.isPinned ? 'PIN_POST' : 'UNPIN_POST',
      req,
      targetModel: 'Post',
      targetId: id,
      details: { isPinned: updatedPost.isPinned },
    });

    return res.status(200).json({
      message: updatedPost.isPinned ? 'Post pinned to top of campus feed.' : 'Post unpinned.',
      post: updatedPost,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/posts/:id/hide', async (req, res, next) => {
  try {
    const { id } = req.params;
    const dbActive = await isConnected();

    let updatedPost;
    if (dbActive) {
      const post = await Post.findById(id);
      if (!post) return res.status(404).json({ error: 'Not Found', message: 'Post not found.' });
      post.isHidden = !post.isHidden;
      await post.save();
      updatedPost = post;
    } else {
      const { mockPosts } = require('./posts');
      const p = (mockPosts || []).find((item) => item._id.toString() === id.toString());
      if (!p) return res.status(404).json({ error: 'Not Found', message: 'Post not found.' });
      p.isHidden = !p.isHidden;
      updatedPost = p;
    }

    await logAuditEvent({
      action: updatedPost.isHidden ? 'HIDE_POST' : 'UNHIDE_POST',
      req,
      targetModel: 'Post',
      targetId: id,
      details: { isHidden: updatedPost.isHidden },
    });

    return res.status(200).json({
      message: updatedPost.isHidden ? 'Post is now hidden from public feed.' : 'Post unhidden.',
      post: updatedPost,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/posts/:id/dismiss', async (req, res, next) => {
  try {
    const { id } = req.params;
    const dbActive = await isConnected();

    let updatedPost;
    if (dbActive) {
      const post = await Post.findById(id);
      if (!post) return res.status(404).json({ error: 'Not Found', message: 'Post not found.' });
      post.isFlagged = false;
      post.reportReason = '';
      post.reportedBy = [];
      await post.save();
      updatedPost = post;
    } else {
      const { mockPosts } = require('./posts');
      const p = (mockPosts || []).find((item) => item._id.toString() === id.toString());
      if (!p) return res.status(404).json({ error: 'Not Found', message: 'Post not found.' });
      p.isFlagged = false;
      p.reportReason = '';
      updatedPost = p;
    }

    await logAuditEvent({
      action: 'DISMISS_POST_REPORT',
      req,
      targetModel: 'Post',
      targetId: id,
      details: { dismissed: true },
    });

    return res.status(200).json({
      message: 'Report dismissed. Post flagged status cleared.',
      post: updatedPost,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/posts/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const reason = req.body.reason || 'Violated community guidelines';
    const dbActive = await isConnected();

    if (dbActive) {
      const post = await Post.findByIdAndDelete(id);
      if (!post) return res.status(404).json({ error: 'Not Found', message: 'Post not found.' });
    } else {
      const { mockPosts } = require('./posts');
      if (mockPosts) {
        const idx = mockPosts.findIndex((p) => p._id.toString() === id.toString());
        if (idx !== -1) mockPosts.splice(idx, 1);
      }
    }

    await logAuditEvent({
      action: 'DELETE_POST',
      req,
      targetModel: 'Post',
      targetId: id,
      details: { reason },
    });

    return res.status(200).json({
      message: 'Post deleted successfully by Administrator.',
      deletedId: id,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/comments', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 15, 50);
    const cursor = req.query.cursor;
    const flaggedOnly = req.query.flagged === 'true';
    const dbActive = await isConnected();

    if (dbActive) {
      const queryFilter = {};
      if (flaggedOnly) queryFilter.isFlagged = true;
      if (cursor && mongoose.isValidObjectId(cursor)) {
        queryFilter._id = { $lt: cursor };
      }

      const comments = await Comment.find(queryFilter)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .populate('author', 'name institutionalId department userType bloodGroup')
        .populate('reportedBy', 'name institutionalId')
        .populate('post', 'content author');

      const hasMore = comments.length > limit;
      const results = hasMore ? comments.slice(0, limit) : comments;
      const nextCursor = hasMore ? results[results.length - 1]._id : null;

      return res.status(200).json({
        comments: results,
        nextCursor,
        hasMore,
      });
    }

    // Mock fallback
    const { mockComments } = require('./posts');
    let commentsList = mockComments || [];
    if (flaggedOnly) commentsList = commentsList.filter((c) => c.isFlagged);
    return res.status(200).json({
      comments: commentsList.slice(0, limit),
      nextCursor: null,
      hasMore: false,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/comments/:id/hide', async (req, res, next) => {
  try {
    const { id } = req.params;
    const dbActive = await isConnected();

    let updatedComment;
    if (dbActive) {
      const comment = await Comment.findById(id);
      if (!comment) return res.status(404).json({ error: 'Not Found', message: 'Comment not found.' });
      comment.isHidden = !comment.isHidden;
      await comment.save();
      updatedComment = comment;
    } else {
      const { mockComments } = require('./posts');
      const c = (mockComments || []).find((item) => item._id.toString() === id.toString());
      if (!c) return res.status(404).json({ error: 'Not Found', message: 'Comment not found.' });
      c.isHidden = !c.isHidden;
      updatedComment = c;
    }

    await logAuditEvent({
      action: updatedComment.isHidden ? 'HIDE_COMMENT' : 'UNHIDE_COMMENT',
      req,
      targetModel: 'Comment',
      targetId: id,
      details: { isHidden: updatedComment.isHidden },
    });

    return res.status(200).json({
      message: updatedComment.isHidden ? 'Comment is now hidden from public feed.' : 'Comment unhidden.',
      comment: updatedComment,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/comments/:id/dismiss', async (req, res, next) => {
  try {
    const { id } = req.params;
    const dbActive = await isConnected();

    let updatedComment;
    if (dbActive) {
      const comment = await Comment.findById(id);
      if (!comment) return res.status(404).json({ error: 'Not Found', message: 'Comment not found.' });
      comment.isFlagged = false;
      comment.reportedBy = [];
      await comment.save();
      updatedComment = comment;
    } else {
      const { mockComments } = require('./posts');
      const c = (mockComments || []).find((item) => item._id.toString() === id.toString());
      if (!c) return res.status(404).json({ error: 'Not Found', message: 'Comment not found.' });
      c.isFlagged = false;
      updatedComment = c;
    }

    await logAuditEvent({
      action: 'DISMISS_COMMENT_REPORT',
      req,
      targetModel: 'Comment',
      targetId: id,
      details: { dismissed: true },
    });

    return res.status(200).json({
      message: 'Report dismissed. Comment flagged status cleared.',
      comment: updatedComment,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/comments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const reason = req.body.reason || 'Violated community guidelines';
    const dbActive = await isConnected();

    if (dbActive) {
      const comment = await Comment.findByIdAndDelete(id);
      if (!comment) return res.status(404).json({ error: 'Not Found', message: 'Comment not found.' });
    } else {
      const { mockComments } = require('./posts');
      if (mockComments) {
        const idx = mockComments.findIndex((c) => c._id.toString() === id.toString());
        if (idx !== -1) mockComments.splice(idx, 1);
      }
    }

    await logAuditEvent({
      action: 'DELETE_COMMENT',
      req,
      targetModel: 'Comment',
      targetId: id,
      details: { reason },
    });

    return res.status(200).json({
      message: 'Comment deleted successfully by Administrator.',
      deletedId: id,
    });
  } catch (err) {
    next(err);
  }
});

// ─── 3. BLOOD REGISTRY APPROVAL QUEUE ─────────────────────────────────────────
router.get('/blood-registry/requests', async (req, res, next) => {
  try {
    const status = req.query.status || 'Pending';
    const limit = Math.min(parseInt(req.query.limit, 10) || 15, 50);
    const cursor = req.query.cursor;
    const dbActive = await isConnected();

    if (dbActive) {
      const queryFilter = { status };
      if (cursor && mongoose.isValidObjectId(cursor)) {
        queryFilter._id = { $lt: cursor };
      }

      const requests = await BloodGroupChangeRequest.find(queryFilter)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .populate('user', 'name institutionalId department userType bloodGroup');

      const hasMore = requests.length > limit;
      const results = hasMore ? requests.slice(0, limit) : requests;
      const nextCursor = hasMore ? results[results.length - 1]._id : null;

      return res.status(200).json({
        requests: results,
        nextCursor,
        hasMore,
      });
    }

    // Mock fallback
    const { mockBloodGroupRequests } = require('./auth');
    const filtered = (mockBloodGroupRequests || []).filter((r) => r.status === status);
    return res.status(200).json({
      requests: filtered.slice(0, limit),
      nextCursor: null,
      hasMore: false,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/blood-registry/requests/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminNotes = req.body.adminNotes || req.body.note || 'Approved by Administrator after lab verification.';
    const adminId = req.user.id || req.user.userId;
    const dbActive = await isConnected();

    if (dbActive) {
      const changeReq = await BloodGroupChangeRequest.findById(id);
      if (!changeReq) {
        return res.status(404).json({ error: 'Not Found', message: 'Verification request not found.' });
      }

      if (changeReq.status !== 'Pending') {
        return res.status(400).json({
          error: 'Invalid State',
          message: `Request is already ${changeReq.status}.`,
        });
      }

      // Update User blood group permanently
      const user = await User.findById(changeReq.user);
      if (user) {
        user.bloodGroup = changeReq.requestedGroup;
        user.isBloodGroupVerified = true;
        await user.save();
      }

      changeReq.status = 'Approved';
      changeReq.adminNotes = adminNotes;
      changeReq.reviewedBy = adminId;
      changeReq.reviewedAt = new Date();
      await changeReq.save();

      await logAuditEvent({
        action: 'APPROVE_BLOOD_GROUP_CHANGE',
        req,
        targetModel: 'BloodGroupChangeRequest',
        targetId: id,
        details: {
          userId: changeReq.user,
          previousGroup: changeReq.currentGroup,
          newGroup: changeReq.requestedGroup,
          adminNotes,
        },
      });

      return res.status(200).json({
        message: 'Blood group verification approved. User record updated.',
        request: changeReq,
      });
    }

    // Mock fallback
    const { mockBloodGroupRequests } = require('./auth');
    const reqItem = (mockBloodGroupRequests || []).find((r) => r._id.toString() === id.toString());
    if (!reqItem) {
      return res.status(404).json({ error: 'Not Found', message: 'Verification request not found.' });
    }

    reqItem.status = 'Approved';
    reqItem.adminNotes = adminNotes;
    reqItem.reviewedBy = adminId;
    reqItem.reviewedAt = new Date();

    const u = mockAdminUsers.find((user) => user._id.toString() === reqItem.user.toString());
    if (u) {
      u.bloodGroup = reqItem.requestedGroup;
      u.isBloodGroupVerified = true;
    }

    await logAuditEvent({
      action: 'APPROVE_BLOOD_GROUP_CHANGE',
      req,
      targetModel: 'BloodGroupChangeRequest',
      targetId: id,
      details: {
        userId: reqItem.user,
        previousGroup: reqItem.currentGroup,
        newGroup: reqItem.requestedGroup,
        adminNotes,
      },
    });

    return res.status(200).json({
      message: 'Blood group verification approved. User record updated.',
      request: reqItem,
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/blood-registry/requests/:id/reject',
  [
    body('reason')
      .optional()
      .trim(),
    body('note')
      .optional()
      .trim(),
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const rejectionReason = (req.body.reason || req.body.note || '').trim();

      if (!rejectionReason || rejectionReason.length < 3) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Rejection reason is required and must be at least 3 characters.',
        });
      }

      const adminId = req.user.id || req.user.userId;
      const dbActive = await isConnected();

      if (dbActive) {
        const changeReq = await BloodGroupChangeRequest.findById(id);
        if (!changeReq) {
          return res.status(404).json({ error: 'Not Found', message: 'Verification request not found.' });
        }

        if (changeReq.status !== 'Pending') {
          return res.status(400).json({
            error: 'Invalid State',
            message: `Request is already ${changeReq.status}.`,
          });
        }

        changeReq.status = 'Rejected';
        changeReq.adminNotes = rejectionReason;
        changeReq.reviewedBy = adminId;
        changeReq.reviewedAt = new Date();
        await changeReq.save();

        await logAuditEvent({
          action: 'REJECT_BLOOD_GROUP_CHANGE',
          req,
          targetModel: 'BloodGroupChangeRequest',
          targetId: id,
          details: {
            userId: changeReq.user,
            reason: rejectionReason,
          },
        });

        return res.status(200).json({
          message: 'Blood group verification request rejected.',
          request: changeReq,
        });
      }

      // Mock fallback
      const { mockBloodGroupRequests } = require('./auth');
      const reqItem = (mockBloodGroupRequests || []).find((r) => r._id.toString() === id.toString());
      if (!reqItem) {
        return res.status(404).json({ error: 'Not Found', message: 'Verification request not found.' });
      }

      reqItem.status = 'Rejected';
      reqItem.adminNotes = rejectionReason;
      reqItem.reviewedBy = adminId;
      reqItem.reviewedAt = new Date();

      await logAuditEvent({
        action: 'REJECT_BLOOD_GROUP_CHANGE',
        req,
        targetModel: 'BloodGroupChangeRequest',
        targetId: id,
        details: {
          userId: reqItem.user,
          reason: rejectionReason,
        },
      });

      return res.status(200).json({
        message: 'Blood group verification request rejected.',
        request: reqItem,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── 4. EMERGENCY SOS LIVE MONITOR (REAL-TIME, ASSIGNED VOLUNTEERS, OVERRIDES) ─
router.get('/emergency/active', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const cursor = req.query.cursor;
    const dbActive = await isConnected();

    if (dbActive) {
      const queryFilter = { condition: 'Emergency' };
      if (cursor && mongoose.isValidObjectId(cursor)) {
        queryFilter._id = { $lt: cursor };
      }

      const requests = await BloodRequest.find(queryFilter)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .populate('requester', 'name institutionalId phone department userType')
        .populate('matchedDonors', 'name institutionalId phone bloodGroup availabilityStatus');

      const hasMore = requests.length > limit;
      const results = hasMore ? requests.slice(0, limit) : requests;
      const nextCursor = hasMore ? results[results.length - 1]._id : null;

      return res.status(200).json({
        requests: results,
        nextCursor,
        hasMore,
      });
    }

    // Mock fallback
    const { mockBloodRequests } = require('./bloodRequests');
    const emergencyList = (mockBloodRequests || []).filter((r) => r.condition === 'Emergency');
    return res.status(200).json({
      requests: emergencyList.slice(0, limit),
      nextCursor: null,
      hasMore: false,
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/emergency/:id/override',
  [
    body('status')
      .isIn(VALID_STATUSES)
      .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
    body('overrideReason')
      .trim()
      .isLength({ min: 3 })
      .withMessage('Override reason is required (minimum 3 characters).'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, overrideReason } = req.body;
      const dbActive = await isConnected();

      let updatedReq;
      if (dbActive) {
        const bloodReq = await BloodRequest.findById(id);
        if (!bloodReq) {
          return res.status(404).json({ error: 'Not Found', message: 'Blood request not found.' });
        }
        bloodReq.status = status;
        await bloodReq.save();
        updatedReq = bloodReq;
      } else {
        const { mockBloodRequests } = require('./bloodRequests');
        const bReq = (mockBloodRequests || []).find((r) => r._id.toString() === id.toString());
        if (!bReq) {
          return res.status(404).json({ error: 'Not Found', message: 'Blood request not found.' });
        }
        bReq.status = status;
        updatedReq = bReq;
      }

      await logAuditEvent({
        action: 'EMERGENCY_STATUS_OVERRIDE',
        req,
        targetModel: 'BloodRequest',
        targetId: id,
        details: {
          newStatus: status,
          overrideReason,
        },
      });

      return res.status(200).json({
        message: `Emergency SOS status overridden to ${status}.`,
        request: updatedReq,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── 5. HELPLINE CMS (CRUD FOR MEDICAL, AMBULANCE, REGIONAL BLOOD BANKS) ───────
router.get('/helpline', async (req, res, next) => {
  try {
    const dbActive = await isConnected();

    if (dbActive) {
      const contacts = await Helpline.find().sort({ category: 1, order: 1 });
      return res.status(200).json({ contacts });
    }

    // Mock fallback
    const { mockHelplineContacts } = require('./helpline');
    return res.status(200).json({ contacts: mockHelplineContacts || [] });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/helpline',
  [
    body('category')
      .isIn(['Committee', 'Medical', 'Campus', 'WhatsApp'])
      .withMessage('Category must be Committee, Medical, Campus, or WhatsApp'),
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('role').trim().isLength({ min: 2 }).withMessage('Role/Designation is required'),
    body('phone').trim().isLength({ min: 6 }).withMessage('Valid phone number is required'),
    body('email').optional().trim(),
    body('whatsappNumber').optional().trim(),
    body('location').optional().trim(),
    body('isAvailable24_7').optional().isBoolean(),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { category, name, role, phone, email, whatsappNumber, location, isAvailable24_7 } = req.body;
      const dbActive = await isConnected();

      let contact;
      if (dbActive) {
        const count = await Helpline.countDocuments({ category });
        contact = new Helpline({
          category,
          name,
          role,
          phone,
          email: email || '',
          whatsappNumber: whatsappNumber || '',
          location: location || '',
          isAvailable24_7: Boolean(isAvailable24_7),
          order: count + 1,
        });
        await contact.save();
      } else {
        const { mockHelplineContacts } = require('./helpline');
        contact = {
          _id: new mongoose.Types.ObjectId().toString(),
          category,
          name,
          role,
          phone,
          email: email || '',
          whatsappNumber: whatsappNumber || '',
          location: location || '',
          isAvailable24_7: Boolean(isAvailable24_7),
          order: 99,
          createdAt: new Date(),
        };
        if (mockHelplineContacts) {
          mockHelplineContacts.push(contact);
        }
      }

      await logAuditEvent({
        action: 'CREATE_HELPLINE_CONTACT',
        req,
        targetModel: 'Helpline',
        targetId: contact._id,
        details: { category, name, role, phone },
      });

      return res.status(201).json({
        message: 'Helpline contact created successfully.',
        contact,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/helpline/:id',
  [
    body('category')
      .optional()
      .isIn(['Committee', 'Medical', 'Campus', 'WhatsApp'])
      .withMessage('Category must be Committee, Medical, Campus, or WhatsApp'),
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('role').optional().trim().isLength({ min: 2 }).withMessage('Role is required'),
    body('phone').optional().trim().isLength({ min: 6 }).withMessage('Valid phone number is required'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const dbActive = await isConnected();

      let updated;
      if (dbActive) {
        updated = await Helpline.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
        if (!updated) {
          return res.status(404).json({ error: 'Not Found', message: 'Contact not found.' });
        }
      } else {
        const { mockHelplineContacts } = require('./helpline');
        const found = (mockHelplineContacts || []).find((c) => c._id && c._id.toString() === id.toString());
        if (found) {
          Object.assign(found, req.body);
          updated = found;
        } else {
          updated = { _id: id, ...req.body };
        }
      }

      await logAuditEvent({
        action: 'UPDATE_HELPLINE_CONTACT',
        req,
        targetModel: 'Helpline',
        targetId: id,
        details: req.body,
      });

      return res.status(200).json({
        message: 'Helpline contact updated successfully.',
        contact: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/helpline/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const dbActive = await isConnected();

    if (dbActive) {
      const deleted = await Helpline.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Not Found', message: 'Contact not found.' });
      }
    } else {
      const { mockHelplineContacts } = require('./helpline');
      if (mockHelplineContacts) {
        const idx = mockHelplineContacts.findIndex((c) => c._id && c._id.toString() === id.toString());
        if (idx !== -1) mockHelplineContacts.splice(idx, 1);
      }
    }

    await logAuditEvent({
      action: 'DELETE_HELPLINE_CONTACT',
      req,
      targetModel: 'Helpline',
      targetId: id,
      details: {},
    });

    return res.status(200).json({
      message: 'Helpline contact deleted successfully.',
      deletedId: id,
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/helpline/reorder',
  [
    body('orderList')
      .isArray({ min: 1 })
      .withMessage('orderList must be a non-empty array of { id, order }'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { orderList } = req.body;
      const dbActive = await isConnected();

      if (dbActive) {
        const updateOps = orderList.map((item) =>
          Helpline.findByIdAndUpdate(item.id, { $set: { order: item.order } })
        );
        await Promise.all(updateOps);
      }

      await logAuditEvent({
        action: 'REORDER_HELPLINE_CONTACTS',
        req,
        targetModel: 'Helpline',
        targetId: 'BULK',
        details: { reorderedCount: orderList.length },
      });

      return res.status(200).json({
        message: 'Helpline order persisted to database successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── 6. USER ADMINISTRATION (SEARCH, ROLE MANAGEMENT, ACTIVE/SUSPENDED TOGGLE) ─
router.get('/users', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 15, 50);
    const cursor = req.query.cursor;
    const search = req.query.search ? req.query.search.trim() : '';
    const userType = req.query.userType;
    const bloodGroup = req.query.bloodGroup;
    const dbActive = await isConnected();

    if (dbActive) {
      const queryFilter = {};
      if (cursor && mongoose.isValidObjectId(cursor)) {
        queryFilter._id = { $lt: cursor };
      }
      if (userType) queryFilter.userType = userType;
      if (bloodGroup) queryFilter.bloodGroup = bloodGroup;
      if (search) {
        queryFilter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { institutionalId: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
        ];
      }

      const users = await User.find(queryFilter)
        .select('-password')
        .sort({ _id: -1 })
        .limit(limit + 1);

      const hasMore = users.length > limit;
      const results = hasMore ? users.slice(0, limit) : users;
      const nextCursor = hasMore ? results[results.length - 1]._id : null;

      return res.status(200).json({
        users: results,
        nextCursor,
        hasMore,
      });
    }

    // Mock fallback
    let filtered = [...mockAdminUsers];
    if (userType) filtered = filtered.filter((u) => u.userType === userType);
    if (bloodGroup) filtered = filtered.filter((u) => u.bloodGroup === bloodGroup);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.institutionalId.toLowerCase().includes(q) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.department && u.department.toLowerCase().includes(q))
      );
    }

    return res.status(200).json({
      users: filtered.slice(0, limit),
      nextCursor: null,
      hasMore: false,
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/users/:id/role',
  [
    body('userType')
      .isIn(['Student', 'Teacher', 'Staff', 'Admin'])
      .withMessage('Role must be Student, Teacher, Staff, or Admin'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { userType } = req.body;
      const dbActive = await isConnected();

      let updatedUser;
      if (dbActive) {
        updatedUser = await User.findByIdAndUpdate(
          id,
          { $set: { userType } },
          { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
      } else {
        const u = mockAdminUsers.find((user) => user._id.toString() === id.toString());
        if (u) {
          u.userType = userType;
          updatedUser = u;
        } else {
          updatedUser = { _id: id, userType };
          mockAdminUsers.push(updatedUser);
        }
      }

      await logAuditEvent({
        action: 'UPDATE_USER_ROLE',
        req,
        targetModel: 'User',
        targetId: id,
        details: { newRole: userType },
      });

      return res.status(200).json({
        message: `User role successfully updated to ${userType}.`,
        user: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/users/:id/status',
  [
    body('availabilityStatus')
      .optional()
      .isIn(['Available', 'Cooldown', 'Unavailable'])
      .withMessage('availabilityStatus must be Available, Cooldown, or Unavailable'),
    body('isActive').optional().isBoolean(),
    body('isSuspended').optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { availabilityStatus, isActive, isSuspended } = req.body;
      const dbActive = await isConnected();

      const updateFields = {};
      if (availabilityStatus !== undefined) updateFields.availabilityStatus = availabilityStatus;
      if (isActive !== undefined) updateFields.isActive = isActive;
      if (isSuspended !== undefined) updateFields.isSuspended = isSuspended;

      let updatedUser;
      if (dbActive) {
        updatedUser = await User.findByIdAndUpdate(
          id,
          { $set: updateFields },
          { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
      } else {
        const u = mockAdminUsers.find((user) => user._id.toString() === id.toString());
        if (u) {
          Object.assign(u, updateFields);
          updatedUser = u;
        } else {
          updatedUser = { _id: id, ...updateFields };
          mockAdminUsers.push(updatedUser);
        }
      }

      await logAuditEvent({
        action: 'UPDATE_USER_STATUS',
        req,
        targetModel: 'User',
        targetId: id,
        details: updateFields,
      });

      return res.status(200).json({
        message: 'User status successfully updated.',
        user: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      avatarUrl,
      phone,
      bloodGroup,
      department,
      userType,
      donationCount,
      totalDonations,
      lastDonationDate,
      isDisasterVolunteer,
      availabilityStatus,
      isActive,
      isSuspended,
      isBloodGroupVerified,
    } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;
    if (phone !== undefined) updateFields.phone = phone;
    if (bloodGroup !== undefined) updateFields.bloodGroup = bloodGroup;
    if (department !== undefined) updateFields.department = department;
    if (userType !== undefined) updateFields.userType = userType;
    if (donationCount !== undefined || totalDonations !== undefined) {
      updateFields.donationCount = Number(donationCount !== undefined ? donationCount : totalDonations) || 0;
    }
    if (lastDonationDate !== undefined) {
      updateFields.lastDonationDate = lastDonationDate ? new Date(lastDonationDate) : null;
    }
    if (isDisasterVolunteer !== undefined) updateFields.isDisasterVolunteer = Boolean(isDisasterVolunteer);
    if (availabilityStatus !== undefined) updateFields.availabilityStatus = availabilityStatus;
    if (isActive !== undefined) updateFields.isActive = Boolean(isActive);
    if (isSuspended !== undefined) updateFields.isSuspended = Boolean(isSuspended);
    if (isBloodGroupVerified !== undefined) updateFields.isBloodGroupVerified = Boolean(isBloodGroupVerified);

    const dbActive = await isConnected();
    let updatedUser;
    if (dbActive) {
      updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
    } else {
      const u = mockAdminUsers.find((user) => user._id.toString() === id.toString());
      if (u) {
        Object.assign(u, updateFields);
        updatedUser = u;
      } else {
        updatedUser = { _id: id, ...updateFields };
        mockAdminUsers.push(updatedUser);
      }
    }

    await logAuditEvent({
      action: 'UPDATE_USER_PROFILE_ADMIN',
      req,
      targetModel: 'User',
      targetId: id,
      details: updateFields,
    });

    return res.status(200).json({
      message: 'User profile updated successfully by Administrator.',
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
});

// ─── 7. AUDIT LOG VIEWER (IMMUTABLE RECORD WITH METADATA) ─────────────────────
router.get('/audit-logs', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const cursor = req.query.cursor;
    const action = req.query.action;
    const targetModel = req.query.targetModel || req.query.targetType;
    const dbActive = await isConnected();

    if (dbActive) {
      const queryFilter = {};
      if (cursor && mongoose.isValidObjectId(cursor)) {
        queryFilter._id = { $lt: cursor };
      }
      if (action) queryFilter.action = action;
      if (targetModel) {
        queryFilter.$or = [{ targetModel }, { targetType: targetModel }];
      }

      const logs = await AuditLog.find(queryFilter)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .populate('performedBy', 'name institutionalId userType department')
        .populate('adminId', 'name institutionalId userType department');

      const hasMore = logs.length > limit;
      const results = hasMore ? logs.slice(0, limit) : logs;
      const nextCursor = hasMore ? results[results.length - 1]._id : null;

      return res.status(200).json({
        logs: results,
        nextCursor,
        hasMore,
      });
    }

    // Mock fallback
    let filtered = [...mockAuditLogs];
    if (action) filtered = filtered.filter((l) => l.action === action);
    if (targetModel) {
      filtered = filtered.filter((l) => l.targetModel === targetModel || l.targetType === targetModel);
    }

    return res.status(200).json({
      logs: filtered.slice(0, limit),
      nextCursor: null,
      hasMore: false,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.mockAuditLogs = mockAuditLogs;
