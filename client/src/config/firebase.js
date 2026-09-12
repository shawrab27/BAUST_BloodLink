import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

/**
 * Client Firebase SDK & VAPID Push Configuration
 *
 * Guaranteed fallback architecture:
 * If browser push is unsupported, permission is denied, or Firebase config
 * is absent in the environment, the client logs a graceful warning and
 * transparently falls back to 7-10s polling of /api/notifications.
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'baust-bloodlink.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'baust-bloodlink',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'baust-bloodlink.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456',
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

let app = null;
let messaging = null;

export async function initFirebaseMessaging() {
  if (typeof window === 'undefined') return null;

  try {
    const supported = await isSupported().catch(() => false);
    if (!supported) {
      console.info('[Push Notification] Web Push Messaging is not supported in this browser. Guaranteed in-app polling active.');
      return null;
    }

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    messaging = getMessaging(app);
    return messaging;
  } catch (err) {
    console.warn('[Push Notification] Firebase initialization skipped:', err.message);
    return null;
  }
}

/**
 * Request notification permission and retrieve VAPID registration token.
 * Registers token with backend if authenticated.
 */
export async function requestPushPermissionAndToken() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { success: false, reason: 'NOT_SUPPORTED' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'PERMISSION_DENIED', permission };
    }

    const msg = await initFirebaseMessaging();
    if (!msg || !vapidKey) {
      return {
        success: true,
        reason: 'FALLBACK_MODE',
        permission: 'granted',
        note: 'Permission granted; polling active (configure VITE_FIREBASE_VAPID_KEY for live push).',
      };
    }

    // Register service worker if not already registered
    let swRegistration;
    if ('serviceWorker' in navigator) {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }

    const token = await getToken(msg, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      // Register with backend if logged in
      const authToken = localStorage.getItem('token');
      if (authToken) {
        await fetch('/api/notifications/register-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ token }),
        }).catch(() => {});
      }

      return { success: true, token, permission: 'granted' };
    }

    return { success: false, reason: 'NO_TOKEN_RECEIVED' };
  } catch (err) {
    console.warn('[Push Notification] Error requesting push token:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Listen for incoming foreground push notifications
 */
export function onForegroundPush(callback) {
  if (!messaging) return () => {};
  try {
    return onMessage(messaging, (payload) => {
      if (callback) callback(payload);
    });
  } catch {
    return () => {};
  }
}
