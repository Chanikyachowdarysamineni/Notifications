importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAtCxFST6_MFV8wsmGS-7d_2QhQgkBbQNw",
  authDomain: "cse-hub-bd655.firebaseapp.com",
  projectId: "cse-hub-bd655",
  storageBucket: "cse-hub-bd655.firebasestorage.app",
  messagingSenderId: "203681298144",
  appId: "1:203681298144:web:e5cce11293c50a4eac8285",
  measurementId: "G-GKGTL96MML"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const title = payload.notification?.title || payload.data?.title || 'New Notification';
  const body = payload.notification?.body || payload.data?.body || '';
  const icon = payload.notification?.icon || payload.data?.icon || '/icons/icon-192x192.png';

  self.registration.showNotification(title, {
    body: body,
    icon: icon,
    badge: "/icons/icon-192x192.png",
    vibrate: [200, 100, 200],
    tag: payload.data?.type || "cse-hub-notification",
    data: payload.data, // carry through for click-handling below
  });
});

// Handle notification click — bring the app to focus or open it,
// and route to the relevant page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || event.notification.data?.route || "/dashboard";
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});
