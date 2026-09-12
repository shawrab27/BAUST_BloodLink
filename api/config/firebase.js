let admin = null;
let isInitialized = false;

try {
  // Only attempt to require if installed
  // eslint-disable-next-line import/no-extraneous-dependencies
  const firebaseAdmin = require('firebase-admin');

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    let serviceAccount;
    try {
      // Handle base64 encoded or raw JSON string
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      const decoded = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    } catch (parseErr) {
      console.warn('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', parseErr.message);
    }

    if (serviceAccount) {
      admin = firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
      });
      isInitialized = true;
      console.log('[Firebase Admin] Initialized with Service Account');
    }
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    isInitialized = true;
    console.log('[Firebase Admin] Initialized with individual environment variables');
  } else if (process.env.FIREBASE_PROJECT_ID) {
    admin = firebaseAdmin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    isInitialized = true;
    console.log('[Firebase Admin] Initialized with Project ID:', process.env.FIREBASE_PROJECT_ID);
  } else {
    console.log('[Firebase Admin] No credentials configured. Running in Notification-collection fallback mode.');
  }
} catch (err) {
  console.log('[Firebase Admin] Running in standalone fallback mode (Push simulated via Notification collection).');
}

/**
 * Send Multicast Push Notification
 * Guaranteed non-throwing fallback: push failures are logged and returned as metrics,
 * never disrupting the primary transactional flow or Notification collection write.
 *
 * @param {Object} options
 * @param {string[]} options.tokens - Recipient FCM device registration tokens
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body text
 * @param {Object} [options.data] - Custom data payload
 * @returns {Promise<{successCount: number, failureCount: number, skipped: boolean}>}
 */
async function sendMulticastNotification({ tokens = [], title, body, data = {} }) {
  const validTokens = (tokens || []).filter((t) => typeof t === 'string' && t.trim().length > 0);

  if (!isInitialized || !admin || validTokens.length === 0) {
    return {
      successCount: 0,
      failureCount: validTokens.length,
      skipped: true,
      reason: !isInitialized ? 'FCM_NOT_CONFIGURED' : 'NO_VALID_TOKENS',
    };
  }

  try {
    const stringifiedData = {};
    for (const [key, value] of Object.entries(data)) {
      stringifiedData[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }

    const message = {
      tokens: validTokens,
      notification: {
        title,
        body,
      },
      data: stringifiedData,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'emergency_alerts',
          priority: 'max',
        },
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          title,
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: true,
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      skipped: false,
      responses: response.responses,
    };
  } catch (error) {
    console.error('[FCM Multicast Error]', error.message);
    return {
      successCount: 0,
      failureCount: validTokens.length,
      skipped: false,
      error: error.message,
    };
  }
}

module.exports = {
  admin,
  isInitialized,
  sendMulticastNotification,
};
