importScripts('https://www.gstatic.com/firebasejs/10.3.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.3.1/firebase-messaging-compat.js');

// IMPORTANT: The firebaseConfig should be provided by your application,
// ideally through a global variable set before the service worker is registered,
// or fetched from a configuration endpoint.
// Example: self.firebaseConfig = { ... };

if (typeof firebaseConfig === 'undefined') {
  console.error('[firebase-messaging-sw.js] firebaseConfig is not defined. Please provide it before registering the service worker.');
} else {
  firebase.initializeApp(firebaseConfig);
}

self.addEventListener('activate', function(event) {
  console.log('[firebase-messaging-sw.js] Service worker activated.');
  const badgeCount = getBadgeCount();
  updateBadge(badgeCount);
});

const firebaseConfig = {
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Increment badge count
  incrementBadgeCount();
  
  const notificationTitle = payload.notification.title || 'New Order';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new order',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: payload.data?.orderId || 'order',
    requireInteraction: true,
    data: payload.data,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'View Order'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Badge management functions
function getBadgeCount() {
  return parseInt(localStorage.getItem('sw_badge_count') || '0', 10);
}

function setBadgeCount(count) {
  localStorage.setItem('sw_badge_count', count.toString());
  updateBadge(count);
}

function incrementBadgeCount() {
  const newCount = getBadgeCount() + 1;
  setBadgeCount(newCount);
}

function decrementBadgeCount() {
  const newCount = Math.max(0, getBadgeCount() - 1);
  setBadgeCount(newCount);
}

function updateBadge(count) {
  if (self.registration && self.registration.sync) {
    try {
      if ('setAppBadge' in navigator) {
        if (count > 0) {
          navigator.setAppBadge(count);
        } else {
          navigator.clearAppBadge();
        }
      }
    } catch (error) {
      console.error('[firebase-messaging-sw.js] Badge API not available or failed in service worker:', error);
    }
  }
}

self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();
  
  // Decrement badge count when notification is clicked
  if (event.action !== 'dismiss') {
    decrementBadgeCount();
  }

  if (event.action === 'dismiss') {
    return;
  }

  const orderId = event.notification.data?.orderId;
  const urlToOpen = orderId 
    ? `${self.location.origin}/#/orders/${orderId}`
    : self.location.origin;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close events
self.addEventListener('notificationclose', function(event) {
  console.log('[firebase-messaging-sw.js] Notification closed.');
  // Note: Decrementing badge here might not be ideal if the user didn't interact with the notification
  // Optionally decrement badge count when notification is dismissed
  // decrementBadgeCount();
});