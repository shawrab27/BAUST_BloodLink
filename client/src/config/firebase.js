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

  try {
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    return {
      provider: providerName,
      oauthId: fbUser.uid,
      name: fbUser.displayName || fbUser.email?.split('@')[0] || `${providerName} User`,
      email: fbUser.email || null, // may be null for GitHub with hidden email
      avatarUrl: fbUser.photoURL || null,
    };
  } catch (err) {
    if (
      err?.code === 'auth/api-key-not-valid' ||
      err?.code === 'auth/invalid-api-key' ||
      err?.code === 'auth/configuration-not-found' ||
      err?.code === 'auth/internal-error'
    ) {
      console.warn(`[OAuth] Firebase popup failed (${err.code}). Using dev fallback session.`);
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
    throw err;
  }
}

/**
 * Sign out of Firebase Auth (call alongside your own JWT logout)
 */
export async function firebaseLogout() {
  if (!auth) return;
  await firebaseSignOut(auth).catch(() => {});
}
