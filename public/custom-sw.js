// Custom Service Worker for Push Notifications & Incoming Calls

// Handle push events (for future Web Push integration)
self.addEventListener('push', (event) => {
  let data = { title: 'CallGuru', body: 'New notification', url: '/' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || '/',
      callId: data.callId,
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click - open/focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (urlToOpen !== '/') {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // Open new window if no existing one
      return clients.openWindow(urlToOpen);
    })
  );
});

// Handle notification actions (Accept/Decline call)
self.addEventListener('notificationclick', (event) => {
  if (event.action === 'accept' || event.action === 'decline') {
    event.notification.close();
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.postMessage({
              type: event.action === 'accept' ? 'CALL_ACCEPTED' : 'CALL_DECLINED',
              callId: event.notification.data?.callId,
            });
            client.focus();
            return;
          }
        }
        // If no window open, open the app
        return clients.openWindow('/');
      })
    );
  }
});
