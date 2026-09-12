const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Repost = require('../models/Repost');
const PostLove = require('../models/PostLove');
const { verifyToken, requireAdmin, JWT_SECRET } = require('../middleware/auth');
const { connectDB } = require('../config/db');

// In-memory fallback storage for when MongoDB is disconnected/offline
let mockPosts = [
  {
    _id: '6751c0000000000000000001',
    author: {
      _id: '6751a0000000000000000001',
      name: 'Tanvir Ahmed',
      bloodGroup: 'B+',
      department: 'CSE',
      userType: 'Student',
      institutionalId: 'CSE0120210001A12',
    },
    content: 'Urgent B+ blood required for patient at CMH Saidpur Cantonment. Please reach out if you are eligible to donate! #BloodRequest #BPositive #Emergency',
    mediaUrl: null,
    tags: ['#BloodRequest', '#BPositive', '#Emergency'],
    loveCount: 12,
    commentCount: 3,
    repostCount: 5,
    createdAt: new Date(Date.now() - 3600 * 1000 * 2),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 2),
  },
  {
    _id: '6751c0000000000000000002',
    author: {
      _id: '6751a0000000000000000003',
      name: 'Dr. Mahfuzur Rahman',
      bloodGroup: 'O+',
      department: 'CSE',
      userType: 'Teacher',
      institutionalId: 'TEA0120210003C34',
    },
    content: 'Proud of our CSE 11th batch students for successfully organizing the voluntary campus blood drive today! 42 bags collected so far. #DonateBlood #CampusDrive #BAUST',
    mediaUrl: null,
    tags: ['#DonateBlood', '#CampusDrive', '#BAUST'],
    loveCount: 38,
    commentCount: 8,
    repostCount: 14,
    createdAt: new Date(Date.now() - 3600 * 1000 * 8),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 8),
  },
  {
    _id: '6751c0000000000000000003',
    author: {
      _id: '6751a0000000000000000002',
      name: 'Nusrat Jahan Mim',
      bloodGroup: 'A+',
      department: 'EEE',
      userType: 'Student',
      institutionalId: 'EEE0120210002B23',
    },
    content: 'Just completed my 3rd voluntary donation! It feels wonderful to be able to help someone in emergency need. Stay healthy and donate! #LifeSaver #DonationStory',
    mediaUrl: null,
    tags: ['#LifeSaver', '#DonationStory'],
    loveCount: 24,
    commentCount: 2,
    repostCount: 3,
    createdAt: new Date(Date.now() - 3600 * 1000 * 24),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24),
  },
];

let mockComments = [
  {
    _id: '6751d0000000000000000001',
    post: '6751c0000000000000000001',
    author: {
      _id: '6751a0000000000000000002',
      name: 'Nusrat Jahan Mim',
      bloodGroup: 'A+',
      department: 'EEE',
      userType: 'Student',
    },
    content: 'Shared with EEE blood donation volunteers group!',
    createdAt: new Date(Date.now() - 3600 * 1000),
  },
];

let mockReposts = [];
let mockLoves = [];

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
 * Optional auth helper for GET routes
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch {
    req.user = null;
  }
  next();
}

/**
 * GET /api/posts
 * Cursor-based pagination on feed.
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 30);
    const cursor = req.query.cursor;
    const tag = req.query.tag;
    const dbActive = await isConnected();

    if (dbActive) {
      const query = {};
      if (tag) {
        query.tags = tag.startsWith('#') ? tag : `#${tag}`;
      }
      if (cursor) {
        const cursorDate = new Date(cursor);
        if (!isNaN(cursorDate.getTime())) {
          query.createdAt = { $lt: cursorDate };
        }
      }

      const posts = await Post.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1)
        .populate('author', 'name bloodGroup department userType avatarUrl institutionalId')
        .lean();

      const hasMore = posts.length > limit;
      const resultPosts = hasMore ? posts.slice(0, limit) : posts;
      const nextCursor = resultPosts.length > 0 ? resultPosts[resultPosts.length - 1].createdAt.toISOString() : null;

      if (req.user && resultPosts.length > 0) {
        const postIds = resultPosts.map((p) => p._id);
        const userId = req.user.userId || req.user.id || req.user._id;

        const [lovedList, repostedList] = await Promise.all([
          PostLove.find({ post: { $in: postIds }, user: userId }).select('post').lean(),
          Repost.find({ post: { $in: postIds }, user: userId }).select('post').lean(),
        ]);

        const lovedSet = new Set(lovedList.map((l) => l.post.toString()));
        const repostedSet = new Set(repostedList.map((r) => r.post.toString()));

        resultPosts.forEach((p) => {
          p.isLovedByMe = lovedSet.has(p._id.toString());
          p.isRepostedByMe = repostedSet.has(p._id.toString());
        });
      } else {
        resultPosts.forEach((p) => {
          p.isLovedByMe = false;
          p.isRepostedByMe = false;
        });
      }

      return res.status(200).json({
        posts: resultPosts,
        nextCursor: hasMore ? nextCursor : null,
        hasMore,
        limit,
      });
    }

    // Mock Fallback
    let filtered = [...mockPosts];
    if (tag) {
      const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
      filtered = filtered.filter((p) => p.tags && p.tags.includes(normalizedTag));
    }
    if (cursor) {
      const cursorDate = new Date(cursor);
      filtered = filtered.filter((p) => new Date(p.createdAt) < cursorDate);
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const hasMore = filtered.length > limit;
    const resultPosts = hasMore ? filtered.slice(0, limit) : filtered;
    const nextCursor = resultPosts.length > 0 ? new Date(resultPosts[resultPosts.length - 1].createdAt).toISOString() : null;

    const currentUserId = req.user ? (req.user.userId || req.user.id) : null;
    resultPosts.forEach((p) => {
      p.isLovedByMe = currentUserId ? mockLoves.some((l) => l.post === p._id && l.user === currentUserId) : false;
      p.isRepostedByMe = currentUserId ? mockReposts.some((r) => r.post === p._id && r.user === currentUserId) : false;
    });

    return res.status(200).json({
      posts: resultPosts,
      nextCursor: hasMore ? nextCursor : null,
      hasMore,
      limit,
    });
  } catch (err) {
    console.error('Error fetching feed posts:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch feed posts.' });
  }
});

/**
 * POST /api/posts
 * Create a new community post
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { content, mediaUrl, tags, bloodRequestId } = req.body;
    const userId = req.user.userId || req.user.id || req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'Post content is required.' });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({ error: 'Validation Error', message: 'Post content cannot exceed 2000 characters.' });
    }

    let extractedTags = Array.isArray(tags) ? tags.map((t) => (t.startsWith('#') ? t : `#${t}`)) : [];
    const hashRegex = /#\w+/g;
    const inTextTags = content.match(hashRegex);
    if (inTextTags) {
      extractedTags = Array.from(new Set([...extractedTags, ...inTextTags]));
    }

    const dbActive = await isConnected();
    if (dbActive) {
      const post = new Post({
        author: userId,
        content: content.trim(),
        mediaUrl: mediaUrl && typeof mediaUrl === 'string' ? mediaUrl.trim() : null,
        tags: extractedTags,
        bloodRequestId: bloodRequestId && mongoose.isValidObjectId(bloodRequestId) ? bloodRequestId : null,
      });

      await post.save();
      await post.populate('author', 'name bloodGroup department userType avatarUrl institutionalId');

      return res.status(201).json({
        message: 'Post created successfully.',
        post: {
          ...post.toObject(),
          isLovedByMe: false,
          isRepostedByMe: false,
        },
      });
    }

    // Mock fallback creation
    const newMockPost = {
      _id: new mongoose.Types.ObjectId().toString(),
      author: {
        _id: userId,
        name: req.user.name || 'Campus Volunteer',
        bloodGroup: req.user.bloodGroup || 'O+',
        department: req.user.department || 'CSE',
        userType: req.user.userType || req.user.role || 'Student',
        institutionalId: req.user.institutionalId || 'CSE-9999',
      },
      content: content.trim(),
      mediaUrl: mediaUrl || null,
      tags: extractedTags,
      loveCount: 0,
      commentCount: 0,
      repostCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isLovedByMe: false,
      isRepostedByMe: false,
    };
    mockPosts.unshift(newMockPost);

    return res.status(201).json({
      message: 'Post created successfully.',
      post: newMockPost,
    });
  } catch (err) {
    console.error('Error creating post:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create post.' });
  }
});

/**
 * POST /api/posts/:id/love
 * Toggle like/love on a post
 */
router.post('/:id/love', verifyToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId || req.user.id || req.user._id;
    const dbActive = await isConnected();

    if (dbActive && mongoose.isValidObjectId(postId)) {
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ error: 'Not Found', message: 'Post not found.' });
      }

      const existingLove = await PostLove.findOne({ post: postId, user: userId });
      let isLoved = false;
      if (existingLove) {
        await PostLove.deleteOne({ _id: existingLove._id });
        await Post.findByIdAndUpdate(postId, { $inc: { loveCount: -1 } });
        isLoved = false;
      } else {
        await PostLove.create({ post: postId, user: userId });
        await Post.findByIdAndUpdate(postId, { $inc: { loveCount: 1 } });
        isLoved = true;
      }

      const updatedPost = await Post.findById(postId).select('loveCount');
      return res.status(200).json({
        success: true,
        isLoved,
        loveCount: Math.max(0, updatedPost.loveCount),
      });
    }

    // Mock fallback
    const post = mockPosts.find((p) => p._id.toString() === postId.toString());
    if (!post) {
      return res.status(404).json({ error: 'Not Found', message: 'Post not found.' });
    }

    const loveIdx = mockLoves.findIndex((l) => l.post === postId && l.user === userId);
    let isLoved = false;
    if (loveIdx >= 0) {
      mockLoves.splice(loveIdx, 1);
      post.loveCount = Math.max(0, (post.loveCount || 1) - 1);
      isLoved = false;
    } else {
      mockLoves.push({ post: postId, user: userId });
      post.loveCount = (post.loveCount || 0) + 1;
      isLoved = true;
    }

    return res.status(200).json({
      success: true,
      isLoved,
      loveCount: post.loveCount,
    });
  } catch (err) {
    console.error('Error toggling post love:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update love.' });
  }
});

/**
 * POST /api/posts/:id/repost
 * Repost a post with optional quote
 */
router.post('/:id/repost', verifyToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId || req.user.id || req.user._id;
    const { quote } = req.body;
    const dbActive = await isConnected();

    if (dbActive && mongoose.isValidObjectId(postId)) {
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ error: 'Not Found', message: 'Post not found.' });
      }

      const existingRepost = await Repost.findOne({ post: postId, user: userId });
      if (existingRepost) {
        await Repost.deleteOne({ _id: existingRepost._id });
        await Post.findByIdAndUpdate(postId, { $inc: { repostCount: -1 } });
        const updated = await Post.findById(postId).select('repostCount');
        return res.status(200).json({
          success: true,
          isReposted: false,
          repostCount: Math.max(0, updated.repostCount),
          message: 'Repost removed.',
        });
      }

      const repost = new Repost({
        post: postId,
        user: userId,
        quote: quote ? quote.trim() : '',
      });
      await repost.save();

      await Post.findByIdAndUpdate(postId, { $inc: { repostCount: 1 } });
      const updated = await Post.findById(postId).select('repostCount');

      return res.status(201).json({
        success: true,
        isReposted: true,
        repostCount: updated.repostCount,
        message: 'Post reposted successfully.',
      });
    }

    // Mock fallback
    const post = mockPosts.find((p) => p._id.toString() === postId.toString());
    if (!post) {
      return res.status(404).json({ error: 'Not Found', message: 'Post not found.' });
    }

    const rIdx = mockReposts.findIndex((r) => r.post === postId && r.user === userId);
    if (rIdx >= 0) {
      mockReposts.splice(rIdx, 1);
      post.repostCount = Math.max(0, (post.repostCount || 1) - 1);
      return res.status(200).json({
        success: true,
        isReposted: false,
        repostCount: post.repostCount,
        message: 'Repost removed.',
      });
    }

    mockReposts.push({ post: postId, user: userId, quote: quote || '' });
    post.repostCount = (post.repostCount || 0) + 1;
    return res.status(201).json({
      success: true,
      isReposted: true,
      repostCount: post.repostCount,
      message: 'Post reposted successfully.',
    });
  } catch (err) {
    console.error('Error reposting:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to repost.' });
  }
});

/**
 * GET /api/posts/:id/comments
 * Fetch paginated comments from standalone Comment collection (20 per fetch)
 */
router.get('/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const dbActive = await isConnected();

    if (dbActive && mongoose.isValidObjectId(postId)) {
      const [comments, totalComments] = await Promise.all([
        Comment.find({ post: postId })
          .sort({ createdAt: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('author', 'name bloodGroup department userType avatarUrl institutionalId')
          .lean(),
        Comment.countDocuments({ post: postId }),
      ]);

      return res.status(200).json({
        comments,
        totalComments,
        page,
        totalPages: Math.ceil(totalComments / limit),
        hasMore: page * limit < totalComments,
      });
    }

    // Mock fallback
    const filtered = mockComments.filter((c) => c.post.toString() === postId.toString());
    const totalComments = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return res.status(200).json({
      comments: paginated,
      totalComments,
      page,
      totalPages: Math.ceil(totalComments / limit),
      hasMore: start + limit < totalComments,
    });
  } catch (err) {
    console.error('Error fetching comments:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch comments.' });
  }
});

/**
 * POST /api/posts/:id/comments
 * Add a comment to the standalone Comment collection
 */
router.post('/:id/comments', verifyToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId || req.user.id || req.user._id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'Comment content cannot be empty.' });
    }

    if (content.trim().length > 500) {
      return res.status(400).json({ error: 'Validation Error', message: 'Comment cannot exceed 500 characters.' });
    }

    const dbActive = await isConnected();
    if (dbActive && mongoose.isValidObjectId(postId)) {
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ error: 'Not Found', message: 'Post not found.' });
      }

      const comment = new Comment({
        post: postId,
        author: userId,
        content: content.trim(),
      });

      await comment.save();
      await comment.populate('author', 'name bloodGroup department userType avatarUrl institutionalId');

      await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

      return res.status(201).json({
        message: 'Comment added successfully.',
        comment,
      });
    }

    // Mock fallback
    const post = mockPosts.find((p) => p._id.toString() === postId.toString());
    if (!post) {
      return res.status(404).json({ error: 'Not Found', message: 'Post not found.' });
    }

    const mockComment = {
      _id: new mongoose.Types.ObjectId().toString(),
      post: postId,
      author: {
        _id: userId,
        name: req.user.name || 'Campus Volunteer',
        bloodGroup: req.user.bloodGroup || 'A+',
        department: req.user.department || 'CSE',
        userType: req.user.userType || req.user.role || 'Student',
      },
      content: content.trim(),
      createdAt: new Date(),
    };

    mockComments.push(mockComment);
    post.commentCount = (post.commentCount || 0) + 1;

    return res.status(201).json({
      message: 'Comment added successfully.',
      comment: mockComment,
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to add comment.' });
  }
});

/**
 * DELETE /api/posts/:id
 * Delete post (author or admin only), cascading to Comment, Repost, and PostLove
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId || req.user.id || req.user._id;
    const userRole = req.user.role || req.user.userType;
    const dbActive = await isConnected();

    if (dbActive && mongoose.isValidObjectId(postId)) {
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ error: 'Not Found', message: 'Post not found.' });
      }

      if (post.author.toString() !== userId.toString() && userRole !== 'Admin') {
        return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to delete this post.' });
      }

      await Promise.all([
        Post.deleteOne({ _id: postId }),
        Comment.deleteMany({ post: postId }),
        Repost.deleteMany({ post: postId }),
        PostLove.deleteMany({ post: postId }),
      ]);

      return res.status(200).json({ message: 'Post deleted successfully.' });
    }

    // Mock fallback
    const pIdx = mockPosts.findIndex((p) => p._id.toString() === postId.toString());
    if (pIdx === -1) {
      return res.status(404).json({ error: 'Not Found', message: 'Post not found.' });
    }

    mockPosts.splice(pIdx, 1);
    mockComments = mockComments.filter((c) => c.post.toString() !== postId.toString());
    mockReposts = mockReposts.filter((r) => r.post.toString() !== postId.toString());
    mockLoves = mockLoves.filter((l) => l.post.toString() !== postId.toString());

    return res.status(200).json({ message: 'Post deleted successfully.' });
  } catch (err) {
    console.error('Error deleting post:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete post.' });
  }
});

module.exports = router;
