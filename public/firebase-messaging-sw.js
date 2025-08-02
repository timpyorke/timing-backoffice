importScripts('https://www.gstatic.com/firebasejs/10.3.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.3.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBLIUoNY7mEoVIRm4qynhrfCJWLuhOEgks",
  authDomain: "timing-48aba.firebaseapp.com",
  projectId: "timing-48aba",
  storageBucket: "timing-48aba.firebasestorage.app",
  messagingSenderId: "559626455223",
  appId: "1:559626455223:web:fe11c7fa0103ab9329a532"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || 'New Order';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new order',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: payload.data?.orderId || 'order',
    requireInteraction: true,
    data: payload.data,
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

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

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