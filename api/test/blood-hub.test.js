const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../index');
const {
  BloodRequest,
  VALID_BLOOD_GROUPS,
  VALID_COMPONENT_TYPES,
  VALID_URGENCY_LEVELS,
  VALID_STATUSES,
} = require('../models/BloodRequest');
const { JWT_SECRET } = require('../middleware/auth');

describe('BAUST BloodLink Phase 3 — Blood Hub Core Tests', () => {
  let server;
  let baseUrl;
  let mockToken;
  const mockUserId = new mongoose.Types.ObjectId().toString();

  before(async () => {
    mockToken = jwt.sign(
      {
        id: mockUserId,
        institutionalId: 'CSE0120210001A12',
        userType: 'Student',
      },
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

  describe('1. BloodRequest Schema Validation Rules', () => {
    test('Blood groups enum includes all 8 standard types + BOMBAY', () => {
      const expected = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'BOMBAY'];
      assert.deepStrictEqual(VALID_BLOOD_GROUPS, expected);
      assert.strictEqual(VALID_BLOOD_GROUPS.includes('BOMBAY'), true);
      assert.strictEqual(VALID_BLOOD_GROUPS.includes('X-'), false);
    });

    test('Component types enum includes all 5 medical preparations', () => {
      const expected = ['whole_blood', 'packed_rbc', 'platelets', 'single_platelet', 'ffp'];
      assert.deepStrictEqual(VALID_COMPONENT_TYPES, expected);
      assert.strictEqual(VALID_COMPONENT_TYPES.includes('whole_blood'), true);
      assert.strictEqual(VALID_COMPONENT_TYPES.includes('platelets'), true);
    });

    test('Urgency levels enum includes Critical, Urgent, and Scheduled', () => {
      const expected = ['Critical', 'Urgent', 'Scheduled'];
      assert.deepStrictEqual(VALID_URGENCY_LEVELS, expected);
    });

    test('Status enum includes Pending, Matching, Fulfilled, and Cancelled', () => {
      const expected = ['Pending', 'Matching', 'Fulfilled', 'Cancelled'];
      assert.deepStrictEqual(VALID_STATUSES, expected);
    });

    test('Schema instantiates successfully with valid data', () => {
      const reqDoc = new BloodRequest({
        patientName: 'Md. Karim Uddin',
        patientAge: 45,
        bloodGroup: 'B+',
        units: 2,
        componentType: 'whole_blood',
        urgency: 'Critical',
        hospital: 'CMH Saidpur Cantonment',
        hospitalAddress: 'Saidpur Cantonment, Nilphamari',
        hospitalBed: 'ICU Bed 04',
        contactName: 'Rahim Uddin',
        contactPhone: '+8801712345678',
        requiredDate: new Date(),
        diagnosis: 'Severe acute hemorrhage following trauma',
        requester: new mongoose.Types.ObjectId(),
      });

      assert.strictEqual(reqDoc.patientName, 'Md. Karim Uddin');
      assert.strictEqual(reqDoc.bloodGroup, 'B+');
      assert.strictEqual(reqDoc.units, 2);
      assert.strictEqual(reqDoc.status, 'Pending');
    });

    test('Schema enforces minimum 1 unit and maximum 20 units', () => {
      const invalidMin = new BloodRequest({
        patientName: 'Test Patient',
        bloodGroup: 'A+',
        units: 0,
        hospital: 'BAUST Medical Center',
        contactName: 'Contact',
        contactPhone: '01700000000',
        requiredDate: new Date(),
        requester: new mongoose.Types.ObjectId(),
      });
      const errMin = invalidMin.validateSync();
      assert.ok(errMin.errors.units);

      const invalidMax = new BloodRequest({
        patientName: 'Test Patient',
        bloodGroup: 'A+',
        units: 25,
        hospital: 'BAUST Medical Center',
        contactName: 'Contact',
        contactPhone: '01700000000',
        requiredDate: new Date(),
        requester: new mongoose.Types.ObjectId(),
      });
      const errMax = invalidMax.validateSync();
      assert.ok(errMax.errors.units);
    });
  });

  describe('2. Route Integration: GET /api/donors & GET /api/blood-requests', () => {
    test('GET /api/donors returns 200 with array, counts, and cursor pagination metadata', async () => {
      const res = await fetch(`${baseUrl}/api/donors?limit=5&status=all`);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.ok(Array.isArray(data.donors), 'donors must be an array');
      assert.ok(typeof data.counts === 'object', 'counts must be an object');
      assert.strictEqual(typeof data.hasMore, 'boolean');
      assert.ok(data.timestamp, 'timestamp must be returned');
    });

    test('GET /api/donors enforces maximum limit of 20 per request', async () => {
      const res = await fetch(`${baseUrl}/api/donors?limit=100`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(data.donors.length <= 20, 'Cannot exceed 20 items per page');
    });

    test('GET /api/blood-requests/stats returns 200 with dashboard overview metrics', async () => {
      const res = await fetch(`${baseUrl}/api/blood-requests/stats`);
      assert.strictEqual(res.status, 200);

      const stats = await res.json();
      assert.strictEqual(typeof stats.activeDonors, 'number');
      assert.strictEqual(typeof stats.fulfilledCases, 'number');
      assert.strictEqual(typeof stats.liveRequisitions, 'number');
      assert.strictEqual(typeof stats.avgMatchTimeMinutes, 'number');
    });

    test('GET /api/blood-requests returns 200 with cursor pagination', async () => {
      const res = await fetch(`${baseUrl}/api/blood-requests?limit=10`);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.ok(Array.isArray(data.requests), 'requests must be an array');
      assert.strictEqual(typeof data.hasMore, 'boolean');
      assert.strictEqual(typeof data.totalCount, 'number');
    });
  });

  describe('3. POST /api/blood-requests Authentication & Validation', () => {
    test('POST /api/blood-requests without Authorization header returns 401', async () => {
      const res = await fetch(`${baseUrl}/api/blood-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: 'Test Patient',
          bloodGroup: 'O+',
          units: 1,
          hospital: 'CMH Saidpur',
          contactName: 'Attendant',
          contactPhone: '01711111111',
          requiredDate: new Date().toISOString(),
        }),
      });

      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.error, 'Unauthorized');
    });

    test('POST /api/blood-requests rejects invalid blood group with 400', async () => {
      const res = await fetch(`${baseUrl}/api/blood-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({
          patientName: 'Test Patient',
          bloodGroup: 'INVALID+',
          units: 1,
          hospital: 'CMH Saidpur',
          contactName: 'Attendant',
          contactPhone: '01711111111',
          requiredDate: new Date().toISOString(),
        }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, 'Validation Error');
      const bgErr = data.errors.find((e) => e.field === 'bloodGroup');
      assert.ok(bgErr);
    });

    test('POST /api/blood-requests rejects units > 20 with 400', async () => {
      const res = await fetch(`${baseUrl}/api/blood-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({
          patientName: 'Test Patient',
          bloodGroup: 'A+',
          units: 50,
          hospital: 'CMH Saidpur',
          contactName: 'Attendant',
          contactPhone: '01711111111',
          requiredDate: new Date().toISOString(),
        }),
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      const unitsErr = data.errors.find((e) => e.field === 'units');
      assert.ok(unitsErr);
    });

    test('POST /api/blood-requests creates valid request with 201', async () => {
      const res = await fetch(`${baseUrl}/api/blood-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({
          patientName: 'Test Patient Unique',
          bloodGroup: 'O+',
          units: 2,
          componentType: 'whole_blood',
          urgency: 'Critical',
          hospital: 'Saidpur CMH Ward 4',
          contactName: 'Attendant Brother',
          contactPhone: '+8801712345678',
          requiredDate: new Date(Date.now() + 86400000).toISOString(),
        }),
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.message, 'Blood requisition created successfully');
      assert.ok(data.bloodRequest);
      assert.strictEqual(data.bloodRequest.bloodGroup, 'O+');
      assert.strictEqual(data.bloodRequest.units, 2);
    });

    test('POST /api/blood-requests rejects duplicate submission within 10 seconds with 409 IDEMPOTENCY_REJECTION', async () => {
      // Send the identical request immediately
      const res = await fetch(`${baseUrl}/api/blood-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({
          patientName: 'Test Patient Duplicate Attempt',
          bloodGroup: 'O+',
          units: 2,
          componentType: 'whole_blood',
          urgency: 'Critical',
          hospital: 'Saidpur CMH Ward 4',
          contactName: 'Attendant Brother',
          contactPhone: '+8801712345678',
          requiredDate: new Date(Date.now() + 86400000).toISOString(),
        }),
      });

      assert.strictEqual(res.status, 409);
      const data = await res.json();
      assert.strictEqual(data.error, 'Duplicate Submission');
      assert.strictEqual(data.code, 'IDEMPOTENCY_REJECTION');
      assert.match(data.message, /within the last 10 seconds/i);
    });
  });
});
