/**
 * Firebase Cloud Messaging Service Worker — BAUST BloodLink
 * Handles background push notifications when the browser tab is inactive.
 */

/* eslint-disable no-restricted-globals */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'baust-bloodlink.firebaseapp.com',
  projectId: 'baust-bloodlink',
  storageBucket: 'baust-bloodlink.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef123456',
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const title = payload.notification?.title || payload.data?.title || '🚨 BAUST BloodLink Emergency';
  const body = payload.notification?.body || payload.data?.message || 'Urgent blood transfusion requisition requires attention.';

  const options = {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200, 100, 200],
    data: payload.data,
    requireInteraction: true,
    tag: payload.data?.bloodRequestId || 'emergency_alert',
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/emergency') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/emergency');
      }
    })
  );
});
