const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const {
  User,
  VALID_DEPARTMENTS,
  VALID_BLOOD_GROUPS,
  VALID_GENDERS,
  VALID_USER_TYPES,
} = require('../models/User');
const { verifyToken, requireAdmin, JWT_SECRET } = require('../middleware/auth');

describe('BAUST BloodLink Phase 2 — Auth & User Model Tests', () => {

  describe('1. Data Validation Rules & Schema Constraints', () => {
    test('Institutional ID: exactly 16 alphanumeric characters', () => {
      const regex = /^[a-zA-Z0-9]{16}$/;

      assert.strictEqual(regex.test('CSE0120210001A12'), true);
      assert.strictEqual(regex.test('1234567890123456'), true);
      assert.strictEqual(regex.test('cse0120210001a12'), true);

      // Too short (15 chars)
      assert.strictEqual(regex.test('CSE0120210001A1'), false);
      // Too long (17 chars)
      assert.strictEqual(regex.test('CSE0120210001A123'), false);
      // Special characters
      assert.strictEqual(regex.test('CSE0120210001A!@'), false);
      assert.strictEqual(regex.test('CSE-012-0210-001'), false);
      assert.strictEqual(regex.test('                '), false);
    });

    test('Gender: enum [Male, Female] only', () => {
      assert.deepStrictEqual(VALID_GENDERS, ['Male', 'Female']);
      assert.strictEqual(VALID_GENDERS.includes('Male'), true);
      assert.strictEqual(VALID_GENDERS.includes('Female'), true);
      assert.strictEqual(VALID_GENDERS.includes('Other'), false);
      assert.strictEqual(VALID_GENDERS.includes('Non-Binary'), false);
    });

    test('Department: enum 9 BAUST departments only', () => {
      const expected = ['CSE', 'EEE', 'ME', 'ICT', 'ENG', 'BBA', 'AIS', 'IPE', 'CE'];
      assert.deepStrictEqual(VALID_DEPARTMENTS, expected);

      for (const dept of expected) {
        assert.strictEqual(VALID_DEPARTMENTS.includes(dept), true);
      }
      assert.strictEqual(VALID_DEPARTMENTS.includes('CIVIL'), false);
      assert.strictEqual(VALID_DEPARTMENTS.includes('LAW'), false);
    });

    test('Blood Group: enum of 8 standard groups', () => {
      const expected = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      assert.deepStrictEqual(VALID_BLOOD_GROUPS, expected);
      assert.strictEqual(VALID_BLOOD_GROUPS.includes('O-'), true);
      assert.strictEqual(VALID_BLOOD_GROUPS.includes('C+'), false);
    });

    test('User Types / Roles: Student, Teacher, Staff, Admin', () => {
      const expected = ['Student', 'Teacher', 'Staff', 'Admin'];
      assert.deepStrictEqual(VALID_USER_TYPES, expected);
    });
  });

  describe('2. Donor 90-day Cooldown Logic', () => {
    test('Eligible when lastDonationDate is null', () => {
      const user = new User({
        institutionalId: 'CSE0120210001A12',
        name: 'Test Donor',
        email: 'donor@baust.edu.bd',
        password: 'password123',
        gender: 'Male',
        department: 'CSE',
        bloodGroup: 'O+',
        lastDonationDate: null,
      });

      assert.strictEqual(user.isEligibleDonor(), true);
    });

    test('Ineligible when lastDonationDate is within 90 days', () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const user = new User({
        institutionalId: 'CSE0120210001A12',
        name: 'Recent Donor',
        email: 'donor2@baust.edu.bd',
        password: 'password123',
        gender: 'Male',
        department: 'CSE',
        bloodGroup: 'O+',
        lastDonationDate: thirtyDaysAgo,
      });

      assert.strictEqual(user.isEligibleDonor(), false);
    });

    test('Eligible when lastDonationDate is older than 90 days', () => {
      const ninetyFiveDaysAgo = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000);
      const user = new User({
        institutionalId: 'CSE0120210001A12',
        name: 'Ready Donor',
        email: 'donor3@baust.edu.bd',
        password: 'password123',
        gender: 'Male',
        department: 'CSE',
        bloodGroup: 'O+',
        lastDonationDate: ninetyFiveDaysAgo,
      });

      assert.strictEqual(user.isEligibleDonor(), true);
    });
  });

  describe('3. Role Sub-documents', () => {
    test('Student details subdocument is structured properly', () => {
      const user = new User({
        institutionalId: 'CSE0120210001A12',
        name: 'Student User',
        email: 'student@baust.edu.bd',
        password: 'password123',
        gender: 'Male',
        department: 'CSE',
        bloodGroup: 'A+',
        userType: 'Student',
        studentDetails: { batch: '11th', section: 'A', session: '2021-22' },
      });

      assert.strictEqual(user.studentDetails.batch, '11th');
      assert.strictEqual(user.studentDetails.section, 'A');
      assert.strictEqual(user.studentDetails.session, '2021-22');
    });

    test('Teacher details subdocument is structured properly', () => {
      const user = new User({
        institutionalId: 'TEA0120210001A12',
        name: 'Faculty User',
        email: 'faculty@baust.edu.bd',
        password: 'password123',
        gender: 'Female',
        department: 'EEE',
        bloodGroup: 'B+',
        userType: 'Teacher',
        teacherDetails: { designation: 'Assistant Professor', roomNumber: 'Academic-302' },
      });

      assert.strictEqual(user.teacherDetails.designation, 'Assistant Professor');
      assert.strictEqual(user.teacherDetails.roomNumber, 'Academic-302');
    });
  });

  describe('4. Security: bcrypt Hashing & Password Comparison', () => {
    test('bcrypt comparison matches correct password and rejects incorrect', async () => {
      const plainPassword = 'SecuredPassword@2026';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      const user = new User({
        institutionalId: 'CSE0120210001A12',
        name: 'Test Secure',
        email: 'sec@baust.edu.bd',
        password: hashedPassword,
        gender: 'Male',
        department: 'ME',
        bloodGroup: 'AB+',
      });

      const match = await user.comparePassword(plainPassword);
      assert.strictEqual(match, true);

      const fail = await user.comparePassword('WrongPassword');
      assert.strictEqual(fail, false);
    });

    test('toSafeObject() strips password and includes isDonorEligible flag', () => {
      const user = new User({
        institutionalId: 'CSE0120210001A12',
        name: 'Test Safe',
        email: 'safe@baust.edu.bd',
        password: 'superSecretPassword',
        gender: 'Male',
        department: 'CSE',
        bloodGroup: 'A-',
      });

      const safe = user.toSafeObject();
      assert.strictEqual(safe.password, undefined);
      assert.strictEqual(safe.institutionalId, 'CSE0120210001A12');
      assert.strictEqual(typeof safe.isDonorEligible, 'boolean');
    });
  });

  describe('5. JWT Generation & Expiry', () => {
    test('JWT token has 8h expiry and contains user payload', () => {
      const payload = {
        id: new mongoose.Types.ObjectId().toString(),
        institutionalId: 'CSE0120210001A12',
        userType: 'Student',
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
      const decoded = jwt.verify(token, JWT_SECRET);

      assert.strictEqual(decoded.id, payload.id);
      assert.strictEqual(decoded.institutionalId, payload.institutionalId);
      assert.strictEqual(decoded.userType, payload.userType);

      // Verify expiration is ~8 hours from now
      const expiresInSeconds = decoded.exp - decoded.iat;
      assert.strictEqual(expiresInSeconds, 8 * 60 * 60);
    });
  });

  describe('6. RBAC Middleware on /api/admin/*', () => {
    test('requireAdmin rejects non-admin users with 403 Forbidden', () => {
      const req = { user: { id: '123', userType: 'Student' } };
      let statusCode = null;
      let jsonBody = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (body) => {
              jsonBody = body;
            },
          };
        },
      };
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      requireAdmin(req, res, next);

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(statusCode, 403);
      assert.strictEqual(jsonBody.code, 'ADMIN_REQUIRED');
    });

    test('requireAdmin allows Admin user to proceed', () => {
      const req = { user: { id: 'admin1', userType: 'Admin' } };
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      requireAdmin(req, {}, next);

      assert.strictEqual(nextCalled, true);
    });

    test('verifyToken middleware denies request without Authorization header with 401', () => {
      const req = { headers: {} };
      let statusCode = null;
      let jsonBody = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (body) => {
              jsonBody = body;
            },
          };
        },
      };
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      verifyToken(req, res, next);

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(statusCode, 401);
      assert.strictEqual(jsonBody.error, 'Unauthorized');
    });

    test('verifyToken middleware verifies valid token and attaches user to req', () => {
      const payload = {
        id: 'user123',
        institutionalId: 'CSE0120210001A12',
        userType: 'Student',
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      verifyToken(req, {}, next);

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.user.id, 'user123');
      assert.strictEqual(req.user.institutionalId, 'CSE0120210001A12');
    });
  });
});
