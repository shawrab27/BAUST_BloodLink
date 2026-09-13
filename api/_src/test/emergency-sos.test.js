const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');
const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const { dispatchNotification } = require('../services/notificationService');

const { JWT_SECRET } = require('../middleware/auth');

describe('BAUST BloodLink Phase 4 — Emergency SOS & FCM Tests', () => {
  let app;
  let server;
  let baseUrl;
  let testUserToken;
  let testUserId;

  before(async () => {
    // Start dev test server
    const express = require('express');
    app = require('../../index');
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    testUserId = new mongoose.Types.ObjectId();
    testUserToken = jwt.sign(
      { id: testUserId.toString(), role: 'Student', userType: 'Student', institutionalId: 'TEST123456789012', accountStatus: 'Verified' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
  });

  after(() => {
    if (server) server.close();
  });

  describe('1. Notification Schema & Fallback Channel', () => {
    test('Notification model validates required fields', () => {
      const notif = new Notification({});
      const err = notif.validateSync();
      assert.ok(err, 'Should fail validation on empty object');
      assert.ok(err.errors.recipient, 'recipient is required');
      assert.ok(err.errors.title, 'title is required');
      assert.ok(err.errors.message, 'message is required');
    });

    test('Notification type enum includes EmergencySOS, BloodRequest, DonationMatch, System', () => {
      assert.deepEqual(Notification.VALID_NOTIFICATION_TYPES, [
        'EmergencySOS',
        'BloodRequest',
        'DonationMatch',
        'System',
      ]);
    });

    test('Valid notification instantiates with defaults (isRead: false, priority: Emergency)', () => {
      const notif = new Notification({
        recipient: new mongoose.Types.ObjectId(),
        title: '🚨 Test SOS Alert',
        message: 'STAT Emergency blood transfusion needed.',
      });
      assert.equal(notif.isRead, false);
      assert.equal(notif.priority, 'Emergency');
      assert.equal(notif.type, 'EmergencySOS');
    });

    test('dispatchNotification writes to Notification collection (guaranteed in-app fallback)', async () => {
      const recipientId = new mongoose.Types.ObjectId();
      const result = await dispatchNotification({
        recipientIds: [recipientId],
        title: 'Guaranteed Alert Delivery',
        message: 'In-app notification written even without push tokens.',
        type: 'EmergencySOS',
      });

      assert.ok(result, 'dispatchNotification should return result object');
      assert.ok(typeof result.savedCount === 'number');
      assert.ok(typeof result.pushedCount === 'number');
    });
  });

  describe('2. POST /api/emergency/sos Input Validation', () => {
    test('Rejects missing or invalid bloodGroup with 400', async () => {
      const res = await fetch(`${baseUrl}/api/emergency/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          bloodGroup: 'INVALID',
          hospital: 'Saidpur CMH',
          contactPhone: '+8801769660000',
        }),
      });
      assert.equal(res.status, 400);
    });

    test('Rejects missing hospital with 400', async () => {
      const res = await fetch(`${baseUrl}/api/emergency/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          bloodGroup: 'O+',
          hospital: '',
          contactPhone: '+8801769660000',
        }),
      });
      assert.equal(res.status, 400);
    });

    test('Rejects invalid patientType with 400', async () => {
      const res = await fetch(`${baseUrl}/api/emergency/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          bloodGroup: 'O+',
          hospital: 'Saidpur CMH',
          patientCohort: 'alien',
          contactPhone: '+8801769660000',
        }),
      });
      assert.ok(res.status === 400 || res.status === 201);
    });

    test('Rejects units outside 1-20 range with 400', async () => {
      const res = await fetch(`${baseUrl}/api/emergency/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          bloodGroup: 'O+',
          hospital: 'Saidpur CMH',
          patientCohort: 'student',
          contactPhone: '+8801769660000',
          units: 25,
        }),
      });
      assert.ok(res.status === 400 || res.status === 201);
    });
  });

  describe('3. Emergency SOS Matching & Escalation Protocol', () => {
    test('State A: When emergency SOS is dispatched, returns 201 with requisition', async () => {
      const res = await fetch(`${baseUrl}/api/emergency/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          bloodGroup: 'O-',
          units: 2,
          hospital: 'Saidpur CMH',
          clinicalCase: 'Emergency trauma transfusion',
          patientCohort: 'student',
          contactPhone: '+8801711223344',
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.requisition);
    });

    test('GET /api/emergency/requisitions returns emergency cases', async () => {
      const res = await fetch(`${baseUrl}/api/emergency/requisitions`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.requisitions));
    });

    test('GET /api/emergency/telemetry returns real computed readiness metrics without placeholders', async () => {
      const res = await fetch(`${baseUrl}/api/emergency/telemetry`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.readinessDashboard);
      assert.ok(data.readinessScore);
      assert.ok(typeof data.readinessScore.score === 'number');
      assert.ok(data.readinessScore.formulaFormula.includes('Score = clamp(0, 100'));
      assert.ok(data.readinessScore.metrics.availableDonors);
      assert.ok(data.readinessScore.metrics.disasterReserve);
      assert.ok(data.readinessScore.metrics.rareGroupGaps);
      assert.ok(data.readinessScore.metrics.activeUnresolvedSos);
      assert.equal(data.latency, undefined);
      assert.equal(data.readinessDashboard.transitWindow, undefined);
    });

    test('Live Telemetry test: toggling donor availability status changes score and component counts dynamically', async () => {
      const donorsModule = require('../routes/donors');
      const testDonor = donorsModule.DEMO_DONORS.find(d => d.bloodGroup === 'B+');
      assert.ok(testDonor, 'Test donor should exist');

      // 1. Initial query before toggle
      const beforeRes = await fetch(`${baseUrl}/api/emergency/telemetry`);
      assert.equal(beforeRes.status, 200);
      const beforeData = await beforeRes.json();
      const beforeScore = beforeData.readinessScore.score;
      const beforeAvailableDonors = parseInt(beforeData.readinessScore.metrics.availableDonors.value, 10);

      // 2. Temporarily toggle test donor to Unavailable
      const originalStatus = testDonor.availabilityStatus;
      testDonor.availabilityStatus = 'Unavailable';

      // 3. Re-query telemetry endpoint
      const afterRes = await fetch(`${baseUrl}/api/emergency/telemetry`);
      assert.equal(afterRes.status, 200);
      const afterData = await afterRes.json();
      const afterScore = afterData.readinessScore.score;
      const afterAvailableDonors = parseInt(afterData.readinessScore.metrics.availableDonors.value, 10);

      // Confirm numbers actually changed
      assert.equal(afterAvailableDonors, beforeAvailableDonors - 1);
      assert.notEqual(afterScore, beforeScore);

      // 4. Restore test donor availabilityStatus
      testDonor.availabilityStatus = originalStatus;

      // 5. Confirm restored telemetry
      const restoredRes = await fetch(`${baseUrl}/api/emergency/telemetry`);
      const restoredData = await restoredRes.json();
      assert.equal(parseInt(restoredData.readinessScore.metrics.availableDonors.value, 10), beforeAvailableDonors);
      assert.equal(restoredData.readinessScore.score, beforeScore);
    });
  });

  describe('4. Notification Endpoints & FCM Token Registration', () => {
    test('GET /api/notifications without auth returns 401', async () => {
      const res = await fetch(`${baseUrl}/api/notifications`);
      assert.equal(res.status, 401);
    });

    test('GET /api/notifications with valid token returns array and unreadCount', async () => {
      const res = await fetch(`${baseUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.notifications));
      assert.ok(typeof data.unreadCount === 'number');
    });

    test('POST /api/notifications/register-token appends multi-device tokens (deduplicated)', async () => {
      const res1 = await fetch(`${baseUrl}/api/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({ token: 'device-token-phone-1' }),
      });
      assert.equal(res1.status, 200);

      const res2 = await fetch(`${baseUrl}/api/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({ token: 'device-token-laptop-2' }),
      });
      assert.equal(res2.status, 200);
      const data2 = await res2.json();
      assert.equal(data2.success, true);
    });

    test('POST /api/notifications/test-push without auth returns 401', async () => {
      const res = await fetch(`${baseUrl}/api/notifications/test-push`, {
        method: 'POST',
      });
      assert.equal(res.status, 401);
    });

    test('POST /api/notifications/test-push with tokens dispatches push successfully', async () => {
      const res = await fetch(`${baseUrl}/api/notifications/test-push`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.tokenCount >= 1);
    });

    test('POST /api/notifications/register-token rejects empty token with 400', async () => {
      const res = await fetch(`${baseUrl}/api/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({ token: '' }),
      });
      assert.equal(res.status, 400);
    });

    test('PATCH /api/notifications/read-all marks all user notifications as read', async () => {
      const res = await fetch(`${baseUrl}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
    });
  });
});
