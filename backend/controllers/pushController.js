const pool = require('../config/database');
const { webpush } = require('../utils/webpush');

// Créer la table push_subscriptions si elle n'existe pas
const initPushTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      service_id INTEGER,
      endpoint TEXT NOT NULL,
      keys TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `);
  console.log('Table push_subscriptions initialisée');
};

// Initialiser au démarrage
initPushTable().catch(console.error);

/**
 * Sauvegarder une subscription push
 */
const subscribe = async (req, res) => {
  try {
    const { subscription, patientId, serviceId } = req.body;

    if (!subscription || !patientId) {
      return res.status(400).json({ 
        message: 'Subscription et patientId requis' 
      });
    }

    // Stocker la subscription
    const endpoint = subscription.endpoint;
    const keys = JSON.stringify(subscription.keys || {});

    // Supprimer les anciennes subscriptions pour ce patient/service
    await pool.execute(
      'DELETE FROM push_subscriptions WHERE patient_id = ? AND service_id = ?',
      [patientId, serviceId || null]
    );

    // Insérer la nouvelle subscription
    await pool.execute(
      'INSERT INTO push_subscriptions (patient_id, service_id, endpoint, keys) VALUES (?, ?, ?, ?)',
      [patientId, serviceId || null, endpoint, keys]
    );

    console.log(`Subscription sauvegardée pour le patient ${patientId}`);

    res.status(201).json({ 
      message: 'Subscription enregistrée',
      success: true
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la subscription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Supprimer une subscription push
 */
const unsubscribe = async (req, res) => {
  try {
    const { patientId, endpoint } = req.body;

    if (!patientId || !endpoint) {
      return res.status(400).json({ 
        message: 'patientId et endpoint requis' 
      });
    }

    await pool.execute(
      'DELETE FROM push_subscriptions WHERE patient_id = ? AND endpoint = ?',
      [patientId, endpoint]
    );

    console.log(`Subscription supprimée pour le patient ${patientId}`);

    res.json({ 
      message: 'Désabonnement réussi',
      success: true
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la subscription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Envoyer une notification push à un patient
 */
const sendNotificationToPatient = async (patientId, title, message) => {
  try {
    // Récupérer toutes les subscriptions du patient
    const [subscriptions] = await pool.execute(
      'SELECT * FROM push_subscriptions WHERE patient_id = ?',
      [patientId]
    );

    if (subscriptions.length === 0) {
      console.log(`Aucune subscription trouvée pour le patient ${patientId}`);
      return { success: false, error: 'Aucune subscription' };
    }

    const notificationPayload = {
      title: title || 'Hôpital de Kyeshero',
      body: message,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'turn-notification',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200]
    };

    let successCount = 0;
    let failCount = 0;

    for (const sub of subscriptions) {
      try {
        const subscription = {
          endpoint: sub.endpoint,
          keys: JSON.parse(sub.keys || '{}')
        };

        await webpush.sendNotification(
          subscription,
          JSON.stringify(notificationPayload)
        );
        
        console.log(`Notification envoyée à ${sub.endpoint}`);
        successCount++;
      } catch (err) {
        console.error(`Erreur pour ${sub.endpoint}:`, err.message);
        
        // Si le subscriber n'est plus valide, le supprimer
        if (err.statusCode === 410 || err.statusCode === 404) {
          await pool.execute(
            'DELETE FROM push_subscriptions WHERE id = ?',
            [sub.id]
          );
          console.log(`Subscription invalide supprimée: ${sub.id}`);
        }
        failCount++;
      }
    }

    console.log(`Notifications: ${successCount} réussies, ${failCount} échouées`);
    
    return { 
      success: true, 
      sent: successCount, 
      failed: failCount 
    };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envoyer une notification à tous les patients d'un service
 */
const sendNotificationToService = async (serviceId, title, message) => {
  try {
    // Récupérer les subscriptions pour ce service
    const [subscriptions] = await pool.execute(
      `SELECT DISTINCT ps.*, fa.numero 
       FROM push_subscriptions ps 
       JOIN files_attente fa ON ps.patient_id = fa.patient_id 
       WHERE fa.service_id = ? AND fa.statut IN ('en_attente', 'en_cours')`,
      [serviceId]
    );

    if (subscriptions.length === 0) {
      console.log(`Aucune subscription trouvée pour le service ${serviceId}`);
      return { success: false, error: 'Aucune subscription' };
    }

    const notificationPayload = {
      title: title || 'Hôpital de Kyeshero',
      body: message,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'turn-notification',
      requireInteraction: true
    };

    let successCount = 0;

    for (const sub of subscriptions) {
      try {
        const subscription = {
          endpoint: sub.endpoint,
          keys: JSON.parse(sub.keys || '{}')
        };

        await webpush.sendNotification(
          subscription,
          JSON.stringify(notificationPayload)
        );
        successCount++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await pool.execute(
            'DELETE FROM push_subscriptions WHERE id = ?',
            [sub.id]
          );
        }
      }
    }

    return { success: true, sent: successCount };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de notification au service:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  subscribe,
  unsubscribe,
  sendNotificationToPatient,
  sendNotificationToService
};
