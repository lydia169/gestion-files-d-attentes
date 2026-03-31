// Utilitaires pour les notifications push navigateur

const VAPID_PUBLIC_KEY = 'BEiBIFXDKRhBehlcNwczX8FfKjqgmBWNJ2MASY9gJ-3OEH1Oq8XmUakPI5Lbv8iKBreHuSk2q8tY9M8NLIuc3ow';

/**
 * Vérifie si les notifications push sont supportées
 */
export const isPushSupported = () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers non supportés');
    return false;
  }
  if (!('PushManager' in window)) {
    console.warn('Push Manager non supporté');
    return false;
  }
  return true;
};

/**
 * Demande la permission pour les notifications push
 */
export const requestNotificationPermission = async () => {
  if (!isPushSupported()) {
    return { success: false, error: 'Notifications push non supportées' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Permission de notification accordée');
      return { success: true, permission };
    } else {
      console.warn('Permission de notification refusée:', permission);
      return { success: false, error: `Permission refusée: ${permission}` };
    }
  } catch (error) {
    console.error('Erreur lors de la demande de permission:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Convertit la clé VAPID en Uint8Array
 */
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * S'abonne aux notifications push
 */
export const subscribeToPush = async (patientId, serviceId) => {
  if (!isPushSupported()) {
    return { success: false, error: 'Notifications push non supportées' };
  }

  try {
    // Vérifier la permission
    const permission = Notification.permission;
    if (permission !== 'granted') {
      const result = await requestNotificationPermission();
      if (!result.success) {
        return result;
      }
    }

    // Enregistrer le Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    console.log('Service Worker enregistré:', registration);

    // S'abonner au Push Manager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('Subscription push créée:', subscription);

    // Envoyer la subscription au serveur
    const response = await fetch('/api/public/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        patientId,
        serviceId
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Subscription enregistrée sur le serveur');
      return { success: true, subscription: data };
    } else {
      console.error('Erreur serveur:', data);
      return { success: false, error: data.message || 'Erreur serveur' };
    }
  } catch (error) {
    console.error('Erreur lors de l\'abonnement:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Se désabonner des notifications push
 */
export const unsubscribeFromPush = async (patientId) => {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        
        // Informer le serveur
        await fetch('/api/public/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            patientId,
            endpoint: subscription.endpoint
          })
        });
        
        console.log('Désabonnement réussi');
        return { success: true };
      }
    }
    return { success: true, message: 'Aucune subscription active' };
  } catch (error) {
    console.error('Erreur lors du désabonnement:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Vérifie l'état de la permission de notification
 */
export const getNotificationPermission = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

/**
 * Affiche une notification locale (pour les tests)
 */
export const showLocalNotification = (title, body, icon = '/logo192.png') => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon,
      tag: 'local-notification'
    });
  }
};
