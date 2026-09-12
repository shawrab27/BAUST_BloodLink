const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = require('../../index');
const AuditLog = require('../models/AuditLog');
const BloodGroupChangeRequest = require('../models/BloodGroupChangeRequest');
const { JWT_SECRET } = require('../middleware/auth');
const { mockAuditLogs } = require('../routes/admin');
const { mockBloodGroupRequests } = require('../routes/auth');
const { mockPosts, mockComments } = require('../routes/posts');
const { mockBloodRequests } = require('../routes/bloodRequests');

describe('BAUST BloodLink Phase 6 — Admin Command Center (7 Modules + RBAC & Audit Log)', () => {
  let server;
  let baseUrl;
  let adminToken;
  let adminId;
  let studentToken;
  let studentId;

  before(async () => {
    adminId = new mongoose.Types.ObjectId().toString();
    adminToken = jwt.sign(
      { userId: adminId, id: adminId, userType: 'Admin', institutionalId: 'ADM0120210004D56', name: 'Super Admin' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    studentId = new mongoose.Types.ObjectId().toString();
    studentToken = jwt.sign(
      { userId: studentId, id: studentId, userType: 'Student', institutionalId: 'CSE0120210001A12', name: 'Tanvir Ahmed' },
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

  // ─── 1. RBAC SERVER-SIDE ENFORCEMENT ──────────────────────────────────────────
  describe('Module RBAC & Server-Side Security Barrier', () => {
    test('Unauthenticated request to /api/admin/* returns 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/admin/overview`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, 'Unauthorized');
    });

    test('Non-Admin (Student) user request to /api/admin/overview returns 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/admin/overview`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.error, 'Forbidden');
      assert.equal(data.code, 'ADMIN_REQUIRED');
    });

    test('Admin token successfully passes RBAC gate to /api/admin/overview with 200 OK and aggregation metrics', async () => {
      const res = await fetch(`${baseUrl}/api/admin/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.metrics);
      assert.equal(typeof data.metrics.totalUsers, 'number');
      assert.equal(typeof data.metrics.availableDonors, 'number');
      assert.equal(typeof data.metrics.totalSosAlerts, 'number');
      assert.equal(typeof data.metrics.activeEmergencyCount, 'number');
      assert.ok(data.metrics.donorsByBloodGroup && typeof data.metrics.donorsByBloodGroup === 'object');
      assert.equal(typeof data.metrics.totalAuditLogs, 'number');
    });
  });

  // ─── 2. FEED MODERATION ──────────────────────────────────────────────────────
  describe('Module 2: Feed Moderation', () => {
    test('Admin can fetch paginated posts for moderation', async () => {
      const res = await fetch(`${baseUrl}/api/admin/posts?limit=5`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.posts));
    });

    test('Admin can hide and dismiss reported posts', async () => {
      const postId = '6751c0000000000000000001';

      // Hide
      const hideRes = await fetch(`${baseUrl}/api/admin/posts/${postId}/hide`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(hideRes.status, 200);
      const hideData = await hideRes.json();
      assert.ok(hideData.post);

      // Dismiss
      const dismissRes = await fetch(`${baseUrl}/api/admin/posts/${postId}/dismiss`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(dismissRes.status, 200);
      const dismissData = await dismissRes.json();
      assert.equal(dismissData.post.isFlagged, false);
    });

    test('Admin can pin/unpin a post and action is recorded in AuditLog', async () => {
      const postId = '6751c0000000000000000001';
      const initialAuditCount = mockAuditLogs.length;

      const res = await fetch(`${baseUrl}/api/admin/posts/${postId}/pin`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.post);

      // Verify audit log entry
      assert.ok(mockAuditLogs.length > initialAuditCount);
      const audit = mockAuditLogs[0];
      assert.ok(audit.action === 'PIN_POST' || audit.action === 'UNPIN_POST');
      assert.equal(audit.targetType, 'Post');
      assert.equal(audit.targetId, postId);
    });

    test('Admin can delete an offending post and it is logged to AuditLog', async () => {
      // Seed a post to delete
      const deletePostId = '6751c0000000000000000099';
      mockPosts.push({
        _id: deletePostId,
        author: { name: 'Test User' },
        content: 'Spam post to be moderated',
        loveCount: 0,
        commentCount: 0,
        repostCount: 0,
        createdAt: new Date(),
      });

      const res = await fetch(`${baseUrl}/api/admin/posts/${deletePostId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ reason: 'Spam / Community rule violation' }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.deletedId, deletePostId);

      // Verify audit log entry
      const audit = mockAuditLogs[0];
      assert.equal(audit.action, 'DELETE_POST');
      assert.equal(audit.targetId, deletePostId);
      assert.equal(audit.details.reason, 'Spam / Community rule violation');
    });

    test('Admin can list, hide, dismiss, and delete reported comments', async () => {
      const commentId = '6751d0000000000000000001';
      mockComments.push({
        _id: commentId,
        post: '6751c0000000000000000001',
        author: { name: 'Commenter' },
        content: 'Reported spam comment',
        isFlagged: true,
        isHidden: false,
        createdAt: new Date(),
      });

      // 1. List flagged comments
      const listRes = await fetch(`${baseUrl}/api/admin/comments?flagged=true`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(listRes.status, 200);
      const listData = await listRes.json();
      assert.ok(Array.isArray(listData.comments));

      // 2. Hide comment
      const hideRes = await fetch(`${baseUrl}/api/admin/comments/${commentId}/hide`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(hideRes.status, 200);
      const hideData = await hideRes.json();
      assert.equal(hideData.comment.isHidden, true);

      // 3. Dismiss comment report
      const dismissRes = await fetch(`${baseUrl}/api/admin/comments/${commentId}/dismiss`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(dismissRes.status, 200);
      const dismissData = await dismissRes.json();
      assert.equal(dismissData.comment.isFlagged, false);

      // 4. Delete comment
      const deleteRes = await fetch(`${baseUrl}/api/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ reason: 'Offensive language' }),
      });
      assert.equal(deleteRes.status, 200);
      const deleteData = await deleteRes.json();
      assert.equal(deleteData.deletedId, commentId);

      // Verify audit log entry
      const audit = mockAuditLogs[0];
      assert.equal(audit.action, 'DELETE_COMMENT');
      assert.equal(audit.targetId, commentId);
    });
  });

  // ─── 3. BLOOD REGISTRY APPROVAL QUEUE ─────────────────────────────────────────
  describe('Module 3: Blood Registry Approval Queue', () => {
    let testRequestId;

    before(() => {
      testRequestId = new mongoose.Types.ObjectId().toString();
      mockBloodGroupRequests.push({
        _id: testRequestId,
        user: studentId,
        currentGroup: 'A+',
        requestedGroup: 'O+',
        reason: 'Hospital verified report submitted',
        labReportUrl: 'https://drive.google.com/reports/test-1.pdf',
        status: 'Pending',
        createdAt: new Date(),
      });
    });

    test('Admin can list pending blood group verification requests', async () => {
      const res = await fetch(`${baseUrl}/api/admin/blood-registry/requests?status=Pending`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.requests));
      const found = data.requests.find((r) => r._id.toString() === testRequestId);
      assert.ok(found);
      assert.equal(found.requestedGroup, 'O+');
    });

    test('Rejecting without reason is rejected with 400 Validation Error', async () => {
      const res = await fetch(`${baseUrl}/api/admin/blood-registry/requests/${testRequestId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ reason: '' }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Validation Error');
    });

    test('Admin can approve blood group change and updates record and logs audit', async () => {
      const res = await fetch(`${baseUrl}/api/admin/blood-registry/requests/${testRequestId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ adminNotes: 'Verified with BAUST Medical Officer stamp.' }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.request.status, 'Approved');

      // Check audit log
      const audit = mockAuditLogs[0];
      assert.equal(audit.action, 'APPROVE_BLOOD_GROUP_CHANGE');
      assert.equal(audit.targetId, testRequestId);
      assert.equal(audit.details.newGroup, 'O+');
    });
  });

  // ─── 4. EMERGENCY SOS LIVE MONITOR ───────────────────────────────────────────
  describe('Module 4: Emergency SOS Live Monitor', () => {
    let emergencyReqId;

    before(() => {
      emergencyReqId = '6751b0000000000000000002';
    });

    test('Admin can query active Emergency SOS requisitions', async () => {
      const res = await fetch(`${baseUrl}/api/admin/emergency/active`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.requests));
      data.requests.forEach((r) => {
        assert.equal(r.condition, 'Emergency');
      });
    });

    test('Admin can override emergency request status and logs overrideReason to AuditLog', async () => {
      const res = await fetch(`${baseUrl}/api/admin/emergency/${emergencyReqId}/override`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'Fulfilled',
          overrideReason: 'Resolved manually on-site by campus red crescent volunteers.',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.request.status, 'Fulfilled');

      // Check audit log
      const audit = mockAuditLogs[0];
      assert.equal(audit.action, 'EMERGENCY_STATUS_OVERRIDE');
      assert.equal(audit.targetId, emergencyReqId);
      assert.equal(audit.details.newStatus, 'Fulfilled');
    });
  });

  // ─── 5. HELPLINE / COMMITTEE CMS ─────────────────────────────────────────────
  describe('Module 5: Helpline / Committee CMS', () => {
    let createdContactId;

    test('Admin can create a new helpline contact', async () => {
      const res = await fetch(`${baseUrl}/api/admin/helpline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          category: 'Committee',
          name: 'BAUST Blood Coordination Wing',
          role: 'Deputy Coordinator',
          phone: '+8801700001122',
          location: 'SAC 3rd Floor',
          isAvailable24_7: true,
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.contact);
      createdContactId = data.contact._id;

      // Check audit log
      const audit = mockAuditLogs[0];
      assert.equal(audit.action, 'CREATE_HELPLINE_CONTACT');
      assert.equal(audit.targetType, 'Helpline');
    });

    test('Admin can reorder helpline items via PATCH /reorder', async () => {
      const res = await fetch(`${baseUrl}/api/admin/helpline/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          orderList: [
            { id: createdContactId, order: 1 },
            { id: '6751e0000000000000000001', order: 2 },
          ],
        }),
      });

      assert.equal(res.status, 200);
      const audit = mockAuditLogs[0];
      assert.equal(audit.action, 'REORDER_HELPLINE_CONTACTS');
    });
  });

  // ─── 6. USER & ROLE ADMINISTRATION ───────────────────────────────────────────
  describe('Module 6: User Administration', () => {
    test('Admin can update user role and logs to AuditLog', async () => {
      const res = await fetch(`${baseUrl}/api/admin/users/${studentId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ userType: 'Teacher' }),
      });

      assert.equal(res.status, 200);
      const audit = mockAuditLogs[0];
      assert.equal(audit.action, 'UPDATE_USER_ROLE');
      assert.equal(audit.targetId, studentId);
      assert.equal(audit.details.newRole, 'Teacher');
    });

    test('Admin can update user status and toggle active/suspended', async () => {
      const res = await fetch(`${baseUrl}/api/admin/users/${studentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ availabilityStatus: 'Unavailable', isSuspended: true }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.user.isSuspended, true);

      const audit = mockAuditLogs[0];
      assert.equal(audit.action, 'UPDATE_USER_STATUS');
      assert.equal(audit.targetId, studentId);
      assert.equal(audit.details.availabilityStatus, 'Unavailable');
      assert.equal(audit.details.isSuspended, true);
    });
  });

  // ─── 7. AUDIT LOG VIEWER ──────────────────────────────────────────────────────
  describe('Module 7: Audit Log Viewer', () => {
    test('Admin can query audit logs cursor-paginated', async () => {
      const res = await fetch(`${baseUrl}/api/admin/audit-logs?limit=10`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.logs));
      assert.ok(data.logs.length > 0);
    });

    test('Admin can filter audit logs by action', async () => {
      const res = await fetch(`${baseUrl}/api/admin/audit-logs?action=APPROVE_BLOOD_GROUP_CHANGE`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.logs));
      data.logs.forEach((log) => {
        assert.equal(log.action, 'APPROVE_BLOOD_GROUP_CHANGE');
      });
    });
  });
});
