// Service Worker pour les notifications push
// Ce fichier doit être enregistré dans le répertoire public

const CACHE_NAME = 'hopital-kyeshero-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker installé');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activé');
  event.waitUntil(clients.claim());
});

// Écouter les notifications push
self.addEventListener('push', (event) => {
  console.log('Notification push reçue:', event);
  
  let data = {
    title: 'Hôpital de Kyeshero',
    body: 'Votre tour est arrivé !',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'turn-notification',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200]
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      requireInteraction: data.requireInteraction,
      vibrate: data.vibrate,
      actions: [
        { action: 'open', title: 'Ouvrir' },
        { action: 'close', title: 'Fermer' }
      ]
    })
  );
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('Notification cliquée:', event);
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Ouvrir la page d'affichage de la file d'attente
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Si une fenêtre est déjà ouverte, la focusser
          for (const client of clientList) {
            if (client.url.includes('display') && 'focus' in client) {
              return client.focus();
            }
          }
          // Sinon, ouvrir une nouvelle fenêtre
          if (clients.openWindow) {
            return clients.openWindow('/display');
          }
        })
    );
  }
});

// Gérer les messages du navigateur principal
self.addEventListener('message', (event) => {
  console.log('Message reçu:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
