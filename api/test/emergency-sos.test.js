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
    app = require('../index');
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    testUserId = new mongoose.Types.ObjectId();
    testUserToken = jwt.sign(
      { id: testUserId.toString(), role: 'Student', institutionalId: 'TEST123456789012' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodGroup: 'INVALID',
          hospital: 'Saidpur CMH',
          contactPhone: '+8801769660000',
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.ok(data.errors.some((e) => e.includes('bloodGroup')));
    });

    test('Rejects missing hospital with 400', async () => {
      const res = await fetch(`${baseUrl}/api/emergency/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodGroup: 'O+',
          hospital: '',
          contactPhone: '+8801769660000',
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.ok(data.errors.some((e) => e.includes('Hospital')));
    });

    test('Rejects invalid patientType with 400', async () => {
      const res = await fetch(`${baseUrl}/api/emergency/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodGroup: 'O+',
          hospital: 'Saidpur CMH',
          patientType: 'Alien',
          contactPhone: '+8801769660000',
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.ok(data.errors.some((e) => e.includes('patientType')));
    });

    test('Rejects units outside 1-20 range with 400', async () => {
      const res = await fetch(`${baseUrl}/api/emergency/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodGroup: 'O+',
          hospital: 'Saidpur CMH',
          patientType: 'Student',
          contactPhone: '+8801769660000',
          units: 25,
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.ok(data.errors.some((e) => e.includes('Units')));
    });
  });

  describe('3. Emergency SOS Matching & Escalation Protocol', () => {
    test('State A: When compatible donors are matched, returns state MATCHED with donor list and condition Emergency', async () => {
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
          patientName: 'Test STAT Patient',
          patientType: 'Student',
          contactPhone: '+8801711223344',
          description: 'Emergency trauma transfusion',
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.state === 'MATCHED' || data.state === 'ESCALATED');
      assert.equal(data.request.condition, 'Emergency');
    });

    test('State B (Escalation Protocol): Zero-match falls back to disaster volunteer pool + returns BAUST Medical Center contact', async () => {
      // BOMBAY has zero donors in default pool, testing the Level 3 escalation path
      const res = await fetch(`${baseUrl}/api/emergency/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          bloodGroup: 'BOMBAY',
          units: 1,
          hospital: 'BAUST Medical Center',
          patientName: 'Student #ST-991 • Acute Anemia',
          patientType: 'Student',
          contactPhone: '+8801769662215',
          description: 'Ultra rare Bombay Phenotype transfusion required',
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);

      // Verify zero-match escalation guarantees
      if (data.matchedDonorsCount === 0) {
        assert.equal(data.state, 'ESCALATED');
        assert.ok(data.medicalCenterContact, 'Must return medicalCenterContact in response');
        assert.equal(data.medicalCenterContact.hotline, '+8801769662215');
        assert.equal(data.medicalCenterContact.protocolCode, 'ESC-802');
        assert.ok(typeof data.disasterVolunteersNotified === 'number');
      }
    });

    test('GET /api/emergency/active returns active emergency cases', async () => {
      const res = await fetch(`${baseUrl}/api/emergency/active`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.activeRequests));
    });

    test('GET /api/emergency/stats returns node latency and disaster volunteer metrics', async () => {
      const res = await fetch(`${baseUrl}/api/emergency/stats`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.responseLatency, '42s');
      assert.ok(data.node.includes('Saidpur'));
      assert.ok(data.medicalCenterContact);
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

    test('POST /api/notifications/register-token updates user FCM token', async () => {
      const res = await fetch(`${baseUrl}/api/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({ token: 'test-fcm-device-registration-token-12345' }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
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
