const pool = require('../config/database');

// Temps d'attente par défaut par service (en minutes)
const TEMPS_PAR_DEFAUT_PAR_SERVICE = {
  1: 15,  // Gynéco-Obstétrique
  2: 20,  // Pédiatrie
  3: 15,  // Consultation générale
  4: 30,  // Chirurgie Générale
  5: 25,  // Médecine Interne
  6: 20,  // Dentisterie
  7: 10,  // Urgences
  8: 20,  // Hépato gastro
  9: 20,  // Urologie
  10: 15, // Imagerie
  11: 15  // Pharmacie
};

class Queue {
  static async create(queueData) {
    const { patient_id, service_id, priorite } = queueData;

    // Get the next number for this service
    const [rows] = await pool.execute(
      'SELECT COALESCE(MAX(numero), 0) + 1 as next_num FROM files_attente WHERE service_id = ?',
      [service_id]
    );
    const numero = rows[0].next_num;

    const [result] = await pool.execute(
      'INSERT INTO files_attente (patient_id, service_id, numero, priorite) VALUES (?, ?, ?, ?)',
      [patient_id, service_id, numero, priorite || 'normal']
    );

    return result.insertId;
  }

  static async findByService(service_id) {
    const [rows] = await pool.execute(`
      SELECT fa.*, p.nom, p.prenom
      FROM files_attente fa
      LEFT JOIN patients p ON fa.patient_id = p.id
      WHERE fa.service_id = ? AND fa.statut IN ('en_attente', 'en_cours')
        AND (fa.date_available IS NULL OR fa.date_available <= DATETIME('now'))
      ORDER BY
        CASE fa.priorite
          WHEN 'critique' THEN 1
          WHEN 'urgent' THEN 2
          WHEN 'normal' THEN 3
        END,
        fa.date_creation ASC
    `, [service_id]);
    return rows;
  }

  static async findCurrent(service_id) {
    const [rows] = await pool.execute(`
      SELECT fa.*, p.nom, p.prenom
      FROM files_attente fa
      LEFT JOIN patients p ON fa.patient_id = p.id
      WHERE fa.service_id = ? AND fa.statut = 'en_cours'
      ORDER BY COALESCE(fa.date_appel, fa.date_creation) DESC
      LIMIT 1
    `, [service_id]);
    return rows[0];
  }

  static async callNext(service_id, user_id) {
    // First, check if there's already a patient in progress for this service
    const [existingPatient] = await pool.execute(`
      SELECT id FROM files_attente 
      WHERE service_id = ? AND statut = 'en_cours' 
      LIMIT 1
    `, [service_id]);

    if (existingPatient.length > 0) {
      // There's already a patient in progress, return null to indicate no new patient called
      return null;
    }

    // Find the next patient in queue (excluding those waiting for availability)
    const [rows] = await pool.execute(`
      SELECT fa.id
      FROM files_attente fa
      WHERE fa.service_id = ? AND fa.statut = 'en_attente'
        AND (fa.date_available IS NULL OR fa.date_available <= DATETIME('now'))
      ORDER BY
        CASE fa.priorite
          WHEN 'critique' THEN 1
          WHEN 'urgent' THEN 2
          WHEN 'normal' THEN 3
        END,
        fa.date_creation ASC
      LIMIT 1
    `, [service_id]);

    if (rows.length === 0) {
      return null;
    }

    const queueId = rows[0].id;

    // Update status to en_cours and set date_appel
    await pool.execute(
      'UPDATE files_attente SET statut = ?, date_appel = DATETIME(\'now\'), utilisateur_appel_id = ? WHERE id = ?',
      ['en_cours', user_id, queueId]
    );

    return queueId;
  }

  static async complete(queue_id) {
    await pool.execute(
      'UPDATE files_attente SET statut = \'termine\' WHERE id = ?',
      [queue_id]
    );
  }

  // Marquer un patient comme absent et le remettre en attente après un délai
  static async markAbsent(queue_id, delayMinutes = 5) {
    // Calculer la date de disponibilité en JavaScript
    const dateAvailable = new Date(Date.now() + delayMinutes * 60000).toISOString().replace('T', ' ').substring(0, 19);
    
    // Remettre le patient en attente et définir la date de disponibilité
    await pool.execute(
      'UPDATE files_attente SET statut = \'en_attente\', absent_count = absent_count + 1, date_available = ?, date_appel = NULL WHERE id = ?',
      [dateAvailable, queue_id]
    );
  }

  // Rembourser/rappeler un patient absent
  static async recallAbsent(queue_id) {
    await pool.execute(
      'UPDATE files_attente SET statut = \'en_cours\', date_appel = DATETIME(\'now\'), date_available = NULL WHERE id = ?',
      [queue_id]
    );
  }

  static async getStats(service_id) {
    // Calculer le temps moyen sur les 30 derniers jours
    const [avgResult] = await pool.execute(`
      SELECT 
        AVG((julianday(date_appel) - julianday(date_creation)) * 1440) as temps_moyen
      FROM files_attente
      WHERE service_id = ?
        AND statut = 'termine'
        AND date_appel IS NOT NULL
        AND date_creation >= DATE('now', '-30 days')
    `, [service_id]);

    // Compter les patients en attente et en cours (cohérent avec findByService)
    // On filtre aussi par date_available pour être cohérent avec l'affichage
    const [countResult] = await pool.execute(`
      SELECT
        COUNT(CASE WHEN statut = 'en_attente' AND (date_available IS NULL OR date_available <= DATETIME('now')) THEN 1 END) as en_attente,
        COUNT(CASE WHEN statut = 'en_cours' THEN 1 END) as en_cours,
        COUNT(CASE WHEN statut = 'termine' AND DATE(date_appel) = DATE('now') THEN 1 END) as servis_aujourdhui
      FROM files_attente
      WHERE service_id = ?
    `, [service_id]);

    // Vérifier si avgResult[0] existe et a une valeur raisonnable (moins de 120 minutes)
    let tempsMoyen = avgResult[0]?.temps_moyen || 0;
    
    // Si le temps moyen est aberrant (trop grand ou trop petit), utiliser la valeur par défaut
    if (tempsMoyen <= 0 || tempsMoyen > 120) {
      // Utiliser un temps moyen par défaut basé sur le service
      tempsMoyen = TEMPS_PAR_DEFAUT_PAR_SERVICE[service_id] || 15;
    }

    return {
      en_attente: countResult[0].en_attente,
      en_cours: countResult[0].en_cours,
      servis_aujourdhui: countResult[0].servis_aujourdhui,
      temps_attente_moyen: tempsMoyen
    };
  }

  static async getHistory(service_id) {
    const [rows] = await pool.execute(`
      SELECT fa.*, p.nom, p.prenom,
             (julianday(date_appel) - julianday(date_creation)) * 1440 as temps_attente_minutes
      FROM files_attente fa
      JOIN patients p ON fa.patient_id = p.id
      WHERE fa.service_id = ? AND fa.statut = 'termine'
      ORDER BY fa.date_appel DESC
    `, [service_id]);
    return rows;
  }

  static async findActiveByPatient(patient_id, service_id = null) {
    let query = `
      SELECT fa.*, p.nom, p.prenom, s.nom as service_nom
      FROM files_attente fa
      JOIN patients p ON fa.patient_id = p.id
      JOIN services s ON fa.service_id = s.id
      WHERE fa.patient_id = ? AND fa.statut IN ('en_attente', 'en_cours')
    `;
    const params = [patient_id];
    
    if (service_id) {
      query += ' AND fa.service_id = ?';
      params.push(service_id);
    }
    
    query += ' ORDER BY fa.date_creation DESC LIMIT 1';
    
    const [rows] = await pool.execute(query, params);
    return rows[0];
  }
}

module.exports = Queue;
