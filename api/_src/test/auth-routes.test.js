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

  // ─── GOOGLE & FACEBOOK OAUTH GUEST FLOW & UPGRADE TESTS ──────────────────────
  describe('OAuth Social Sign-in & Guest Lifecycle (Google & Facebook)', () => {
    test('Google OAuth sign-in creates Guest account, can browse Feed, blocked from Blood Request, then completes profile to Verified', async () => {
      // 1. First-time login via Google creates a Guest account
      const googleAuthRes = await fetch(`${baseUrl}/api/auth/oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          oauthId: 'google_uid_987654321',
          name: 'Google Test User',
          email: 'google.test@baust.edu.bd',
          avatarUrl: 'https://lh3.googleusercontent.com/a/test-avatar',
        }),
      });

      assert.strictEqual(googleAuthRes.status, 200);
      const googleData = await googleAuthRes.json();
      assert.ok(googleData.token);
      assert.strictEqual(googleData.user.accountStatus, 'Guest');
      assert.strictEqual(googleData.user.authProvider, 'google');
      assert.strictEqual(googleData.user.isGuest, true);

      const guestToken = googleData.token;

      // 2. Guest can browse Feed freely
      const feedRes = await fetch(`${baseUrl}/api/posts`, {
        headers: { Authorization: `Bearer ${guestToken}` },
      });
      assert.strictEqual(feedRes.status, 200);

      // 3. Guest attempting to create a blood request is blocked server-side
      const bloodReqRes = await fetch(`${baseUrl}/api/blood-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({
          patientName: 'Sadia Rahman',
          patientType: 'Student',
          bloodGroup: 'A+',
          units: 2,
          hospital: 'Saidpur CMH Hospital',
          contactName: 'Google User',
          contactPhone: '+8801711223344',
          requiredDate: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
      assert.strictEqual(bloodReqRes.status, 403);
      const blockedData = await bloodReqRes.json();
      assert.strictEqual(blockedData.code, 'PROFILE_COMPLETION_REQUIRED');

      // 4. Guest completes profile to become Verified
      const completeRes = await fetch(`${baseUrl}/api/auth/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({
          institutionalId: 'CSE0120210009G99',
          gender: 'Female',
          department: 'CSE',
          bloodGroup: 'A+',
          userType: 'Student',
          phone: '+8801711223344',
        }),
      });
      assert.strictEqual(completeRes.status, 200);
      const completeData = await completeRes.json();
      assert.strictEqual(completeData.user.accountStatus, 'Verified');
      assert.strictEqual(completeData.user.isGuest, false);
      assert.strictEqual(completeData.user.institutionalId, 'CSE0120210009G99');

      // 5. Now as Verified, creating a blood request succeeds
      const verifiedToken = completeData.token;
      const verifiedReqRes = await fetch(`${baseUrl}/api/blood-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${verifiedToken}`,
        },
        body: JSON.stringify({
          patientName: 'Sadia Rahman',
          patientType: 'Student',
          bloodGroup: 'A+',
          units: 2,
          hospital: 'Saidpur CMH Hospital',
          contactName: 'Google User',
          contactPhone: '+8801711223344',
          requiredDate: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
      assert.strictEqual(verifiedReqRes.status, 201);
    });

    test('Facebook OAuth sign-in creates Guest account, can browse Feed, blocked from Blood Request, then completes profile to Verified', async () => {
      // 1. First-time login via Facebook creates a Guest account with requested email
      const fbAuthRes = await fetch(`${baseUrl}/api/auth/oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'facebook',
          oauthId: 'fb_uid_123456789',
          name: 'Facebook Test User',
          email: 'facebook.test@baust.edu.bd',
          avatarUrl: 'https://graph.facebook.com/123456789/picture?type=large',
        }),
      });

      assert.strictEqual(fbAuthRes.status, 200);
      const fbData = await fbAuthRes.json();
      assert.ok(fbData.token);
      assert.strictEqual(fbData.user.accountStatus, 'Guest');
      assert.strictEqual(fbData.user.authProvider, 'facebook');
      assert.strictEqual(fbData.user.isGuest, true);
      assert.strictEqual(fbData.user.email, 'facebook.test@baust.edu.bd');

      const guestToken = fbData.token;

      // 2. Guest can browse Feed freely
      const feedRes = await fetch(`${baseUrl}/api/posts`, {
        headers: { Authorization: `Bearer ${guestToken}` },
      });
      assert.strictEqual(feedRes.status, 200);

      // 3. Guest attempting to create a blood request is blocked server-side
      const bloodReqRes = await fetch(`${baseUrl}/api/blood-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({
          patientName: 'Rafiqul Islam',
          patientType: 'Teacher',
          bloodGroup: 'B+',
          units: 1,
          hospital: 'Saidpur CMH Hospital',
          contactName: 'Facebook User',
          contactPhone: '+8801799887766',
          requiredDate: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
      assert.strictEqual(bloodReqRes.status, 403);
      const blockedData = await bloodReqRes.json();
      assert.strictEqual(blockedData.code, 'PROFILE_COMPLETION_REQUIRED');

      // 4. Guest completes profile to become Verified
      const completeRes = await fetch(`${baseUrl}/api/auth/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({
          institutionalId: 'EEE0120210008F88',
          gender: 'Male',
          department: 'EEE',
          bloodGroup: 'B+',
          userType: 'Student',
          phone: '+8801799887766',
        }),
      });
      assert.strictEqual(completeRes.status, 200);
      const completeData = await completeRes.json();
      assert.strictEqual(completeData.user.accountStatus, 'Verified');
      assert.strictEqual(completeData.user.isGuest, false);
      assert.strictEqual(completeData.user.institutionalId, 'EEE0120210008F88');

      // 5. Now as Verified, creating a blood request succeeds
      const verifiedToken = completeData.token;
      const verifiedReqRes = await fetch(`${baseUrl}/api/blood-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${verifiedToken}`,
        },
        body: JSON.stringify({
          patientName: 'Rafiqul Islam',
          patientType: 'Teacher',
          bloodGroup: 'B+',
          units: 1,
          hospital: 'Saidpur CMH Hospital',
          contactName: 'Facebook User',
          contactPhone: '+8801799887766',
          requiredDate: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
      assert.strictEqual(verifiedReqRes.status, 201);
    });
  });
});
