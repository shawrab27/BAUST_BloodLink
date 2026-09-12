const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../../index');

describe('BAUST BloodLink Phase 2 — Auth Route Endpoints & Validation', () => {
  let server;
  let baseUrl;

  before(async () => {
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

  test('POST /api/auth/register rejects 15-char Institutional ID with structured 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institutionalId: 'CSE0120210001A1', // 15 chars (too short)
        name: 'Test Student',
        email: 'test@baust.edu.bd',
        password: 'Password123!',
        gender: 'Male',
        department: 'CSE',
        bloodGroup: 'O+',
        userType: 'Student',
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error, 'Validation Error');
    assert.strictEqual(Array.isArray(body.errors), true);
    const idErr = body.errors.find((e) => e.field === 'institutionalId');
    assert.ok(idErr, 'Expected an error on institutionalId');
    assert.match(idErr.message, /16 alphanumeric characters/i);
  });

  test('POST /api/auth/register rejects invalid gender with structured 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institutionalId: 'CSE0120210001A12',
        name: 'Test Student',
        email: 'test@baust.edu.bd',
        password: 'Password123!',
        gender: 'Other', // Invalid enum
        department: 'CSE',
        bloodGroup: 'O+',
        userType: 'Student',
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error, 'Validation Error');
    const genderErr = body.errors.find((e) => e.field === 'gender');
    assert.ok(genderErr);
  });

  test('POST /api/auth/register rejects invalid department with structured 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institutionalId: 'CSE0120210001A12',
        name: 'Test Student',
        email: 'test@baust.edu.bd',
        password: 'Password123!',
        gender: 'Female',
        department: 'CIVIL', // Not one of the 9 BAUST departments
        bloodGroup: 'A+',
        userType: 'Student',
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error, 'Validation Error');
    const deptErr = body.errors.find((e) => e.field === 'department');
    assert.ok(deptErr);
  });

  test('POST /api/auth/register rejects invalid blood group with structured 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institutionalId: 'CSE0120210001A12',
        name: 'Test Student',
        email: 'test@baust.edu.bd',
        password: 'Password123!',
        gender: 'Female',
        department: 'CSE',
        bloodGroup: 'Z+', // Invalid blood group
        userType: 'Student',
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error, 'Validation Error');
    const bgErr = body.errors.find((e) => e.field === 'bloodGroup');
    assert.ok(bgErr);
  });

  test('POST /api/auth/login rejects empty institutionalId and password with 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error, 'Validation Error');
  });

  test('GET /api/auth/me without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error, 'Unauthorized');
  });
});
