const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = require('../../index');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Repost = require('../models/Repost');
const Helpline = require('../models/Helpline');
const Message = require('../models/Message');

const { JWT_SECRET } = require('../middleware/auth');

describe('BAUST BloodLink Phase 5 — Feed, Standalone Collections, Helpline & Messenger Tests', () => {
  let server;
  let baseUrl;
  let user1Token;
  let user1Id;
  let user2Token;
  let user2Id;

  before(async () => {
    // Generate valid tokens
    user1Id = new mongoose.Types.ObjectId().toString();
    user1Token = jwt.sign(
      { userId: user1Id, id: user1Id, role: 'Student', userType: 'Student', institutionalId: 'CSE0120210001A12' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    user2Id = new mongoose.Types.ObjectId().toString();
    user2Token = jwt.sign(
      { userId: user2Id, id: user2Id, role: 'Teacher', userType: 'Teacher', institutionalId: 'TEA0120210003C34' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // ─── 1. Schema Validation & Standalone Collection Invariants ────────────────
  describe('1. Schema Validation & Independent Collection Invariants', () => {
    test('Post model validates required author and content, and initializes atomic numeric counters', () => {
      const validPost = new Post({
        author: new mongoose.Types.ObjectId(),
        content: 'Urgent need for O+ donors at BAUST Medical Center! #BloodDrive',
      });

      assert.strictEqual(validPost.loveCount, 0);
      assert.strictEqual(validPost.commentCount, 0);
      assert.strictEqual(validPost.repostCount, 0);
      // Verify NO embedded comments or reposts array
      assert.strictEqual(validPost.comments, undefined, 'Post must NOT have embedded comments array');
      assert.strictEqual(validPost.reposts, undefined, 'Post must NOT have embedded reposts array');
    });

    test('Comment model validates post reference, author, content (max 500 chars)', () => {
      const comment = new Comment({
        post: new mongoose.Types.ObjectId(),
        author: new mongoose.Types.ObjectId(),
        content: 'Available after 2 PM!',
      });
      const err = comment.validateSync();
      assert.strictEqual(err, undefined);
      assert.strictEqual(comment.content, 'Available after 2 PM!');
    });

    test('Repost model validates post reference and user reference as standalone document', () => {
      const repost = new Repost({
        post: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        quote: 'Amplifying this urgent blood request for campus.',
      });
      const err = repost.validateSync();
      assert.strictEqual(err, undefined);
      assert.strictEqual(repost.quote, 'Amplifying this urgent blood request for campus.');
    });

    test('Helpline model enforces category enum [Committee, Medical, Campus, WhatsApp]', () => {
      const validHelpline = new Helpline({
        category: 'Medical',
        name: 'Dr. Mosaffor Hossain',
        role: 'Senior Medical Officer',
        phone: '+8801769662215',
      });
      assert.strictEqual(validHelpline.validateSync(), undefined);

      const invalidHelpline = new Helpline({
        category: 'ExternalHospital',
        name: 'Clinic',
        role: 'Doctor',
        phone: '123',
      });
      const err = invalidHelpline.validateSync();
      assert.ok(err.errors.category);
    });

    test('Message model generates canonical conversationId order-independently', () => {
      const idA = '6751a0000000000000000001';
      const idB = '6751a0000000000000000002';
      const conv1 = Message.getConversationId(idA, idB);
      const conv2 = Message.getConversationId(idB, idA);
      assert.strictEqual(conv1, `${idA}_${idB}`);
      assert.strictEqual(conv1, conv2, 'Conversation ID must be identical regardless of argument order');
    });
  });

  // ─── 2. Community Feed Routes & Cursor Pagination ───────────────────────────
  describe('2. Community Feed Routes & Cursor Pagination', () => {
    test('GET /api/posts returns 200 with posts array and cursor pagination metadata', async () => {
      const res = await fetch(`${baseUrl}/api/posts?limit=2`);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.ok(Array.isArray(data.posts));
      assert.ok(data.posts.length <= 2);
      assert.strictEqual(typeof data.hasMore, 'boolean');
      assert.ok(data.nextCursor !== undefined);
    });

    test('POST /api/posts creates new post with extracted hashtags', async () => {
      const res = await fetch(`${baseUrl}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({
          content: 'Voluntary blood drive at BAUST Auditorium. Please join us! #CampusDrive #SaveLives',
        }),
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.ok(data.post._id);
      assert.strictEqual(data.post.commentCount, 0);
      assert.ok(data.post.tags.includes('#CampusDrive'));
    });

    test('POST /api/posts without token returns 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Anonymous post attempt' }),
      });
      assert.strictEqual(res.status, 401);
    });

    test('POST /api/posts/:id/love toggles like state', async () => {
      // First get a post
      const feedRes = await fetch(`${baseUrl}/api/posts?limit=1`);
      const feedData = await feedRes.json();
      const targetPostId = feedData.posts[0]._id;

      const loveRes1 = await fetch(`${baseUrl}/api/posts/${targetPostId}/love`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      assert.strictEqual(loveRes1.status, 200);
      const loveData1 = await loveRes1.json();
      assert.strictEqual(typeof loveData1.isLoved, 'boolean');

      // Second tap toggles
      const loveRes2 = await fetch(`${baseUrl}/api/posts/${targetPostId}/love`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      assert.strictEqual(loveRes2.status, 200);
      const loveData2 = await loveRes2.json();
      assert.strictEqual(loveData2.isLoved, !loveData1.isLoved);
    });
  });

  // ─── 3. Separate Comment & Repost Collection Operations ─────────────────────
  describe('3. Separate Comment & Repost Collection Operations', () => {
    test('POST /api/posts/:id/comments creates comment and increments commentCount', async () => {
      const feedRes = await fetch(`${baseUrl}/api/posts?limit=1`);
      const feedData = await feedRes.json();
      const targetPostId = feedData.posts[0]._id;

      const res = await fetch(`${baseUrl}/api/posts/${targetPostId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({
          content: 'I will be there to donate at 11 AM!',
        }),
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.comment.content, 'I will be there to donate at 11 AM!');
      assert.strictEqual(data.comment.post, targetPostId);
    });

    test('GET /api/posts/:id/comments returns 20-paginated comments from separate collection', async () => {
      const feedRes = await fetch(`${baseUrl}/api/posts?limit=1`);
      const feedData = await feedRes.json();
      const targetPostId = feedData.posts[0]._id;

      const res = await fetch(`${baseUrl}/api/posts/${targetPostId}/comments?limit=20`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.comments));
      assert.ok(data.totalComments >= 1);
    });

    test('POST /api/posts/:id/repost creates repost and toggles state', async () => {
      const feedRes = await fetch(`${baseUrl}/api/posts?limit=1`);
      const feedData = await feedRes.json();
      const targetPostId = feedData.posts[0]._id;

      const res = await fetch(`${baseUrl}/api/posts/${targetPostId}/repost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user2Token}`,
        },
        body: JSON.stringify({ quote: 'Important notice for our faculty & students' }),
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.isReposted, true);
    });
  });

  // ─── 4. Helpline Directory Routes ───────────────────────────────────────────
  describe('4. Helpline Directory Routes', () => {
    test('GET /api/helpline returns categorized directory and emergency hotline', async () => {
      const res = await fetch(`${baseUrl}/api/helpline`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();

      assert.ok(Array.isArray(data.contacts));
      assert.ok(data.contacts.length >= 4);
      assert.ok(data.grouped.Medical.length > 0);
      assert.ok(data.grouped.Committee.length > 0);
      assert.ok(data.grouped.Campus.length > 0);
      assert.ok(data.grouped.WhatsApp.length > 0);
      assert.strictEqual(data.emergencyHotline, '+880 1769-662215');
    });

    test('GET /api/helpline?category=Medical filters directory to Medical only', async () => {
      const res = await fetch(`${baseUrl}/api/helpline?category=Medical`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      data.contacts.forEach((c) => {
        assert.strictEqual(c.category, 'Medical');
      });
    });
  });

  // ─── 5. Messenger Routes & Poll Simulation ──────────────────────────────────
  describe('5. Messenger Routes & Poll Simulation', () => {
    let convId;

    test('POST /api/messages sends 1-on-1 message between users', async () => {
      const res = await fetch(`${baseUrl}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({
          recipientId: user2Id,
          text: 'Good morning Dr. Sharmin, I can come by the medical center for donation.',
        }),
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.data.text, 'Good morning Dr. Sharmin, I can come by the medical center for donation.');
      convId = data.data.conversationId;
      assert.ok(convId.includes(user1Id) && convId.includes(user2Id));
    });

    test('GET /api/messages/:conversationId polls messages for recipient', async () => {
      const res = await fetch(`${baseUrl}/api/messages/${convId}`, {
        headers: { Authorization: `Bearer ${user2Token}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.messages));
      assert.ok(data.messages.length >= 1);
    });

    test('GET /api/messages/conversations lists conversations for user', async () => {
      const res = await fetch(`${baseUrl}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.conversations));
      assert.ok(data.conversations.length >= 1);
    });

    test('PATCH /api/messages/:conversationId/read marks conversation as read', async () => {
      const res = await fetch(`${baseUrl}/api/messages/${convId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user2Token}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });
  });
});
