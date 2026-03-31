const Queue = require('../models/Queue');
const Patient = require('../models/Patient');
const pool = require('../config/database');
const { suggestService } = require('../utils/serviceMatcher');
const { suggestServiceWithFallback } = require('../utils/aiServiceMatcher');
const { sendNotificationToPatient } = require('./pushController');

// Temps d'attente par défaut par service (en minutes) - utilisé quand pas d'historique
const TEMPS_PAR_DEFAUT_PAR_SERVICE = {
  1: 15,  // Pédiatrie
  2: 20,  // Maternité
  3: 15,  // Consultation générale
  4: 30,  // Chirurgie
  5: 25,  // Cardiologie
  6: 20,  // Dentisterie
  7: 30,  // Laboratoires
  8: 15,  // Imagerie médicale
  9: 20,  // Pharmacie
  10: 15, // Imagerie médicale (anciennement Urgences)
  11: 15  // Physiothérapie
};

console.log('Queue model:', Queue);
console.log('Queue.create:', typeof Queue.create);

const addToQueue = async (req, res) => {
  try {
    const { patient_id, service_id, priorite } = req.body;

    console.log('Adding to queue:', { patient_id, service_id, priorite });

    // Verify patient exists
    const patient = await Patient.findById(patient_id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    console.log('Patient found:', patient);

    const queueId = await Queue.create({ patient_id, service_id, priorite });
    console.log('Queue created with id:', queueId);

    // Get the queue entry to return the numero
    const [queueEntry] = await pool.execute('SELECT numero FROM files_attente WHERE id = ?', [queueId]);

    res.status(201).json({
      message: 'Patient ajouté à la file d\'attente',
      queue_id: queueId,
      numero: queueEntry[0]?.numero
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout à la file:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const registerPatient = async (req, res) => {
  try {
    const { nom, prenom, date_naissance, telephone, adresse, service_id, priorite = 'normal', description_probleme } = req.body;

    console.log('Registering patient:', { nom, prenom, service_id, priorite, description_probleme });

    // Si aucun service n'est sélectionné mais une description est fournie, suggérer un service (IA + mots-clés)
    let finalServiceId = service_id;
    let serviceSuggere = null;
    
    if ((!service_id || service_id === 0) && description_probleme && description_probleme.trim().length > 3) {
      // Essayer uniquement l'IA (sans fallback mots-clés pour test)
      const suggestion = await suggestServiceWithFallback(description_probleme, date_naissance, null);
      if (suggestion && suggestion.serviceId) {
        finalServiceId = suggestion.serviceId;
        serviceSuggere = {
          id: suggestion.serviceId,
          nom: suggestion.serviceName,
          confiance: suggestion.confidence
        };
        console.log('Service suggéré:', serviceSuggere);
      }
    }

    // Si toujours pas de service, utiliser Consultation générale par défaut
    if (!finalServiceId || finalServiceId === 0) {
      finalServiceId = 3; // Consultation générale
    }

    // Create patient
    const patientId = await Patient.create({ nom, prenom, date_naissance, telephone, adresse });
    console.log('Patient created with id:', patientId);

    // Add to queue
    const queueId = await Queue.create({ patient_id: patientId, service_id: finalServiceId, priorite });
    console.log('Queue created with id:', queueId);

    // Get the queue entry to return the numero
    const [queueEntry] = await pool.execute('SELECT numero FROM files_attente WHERE id = ?', [queueId]);

    // Get queue stats for estimated wait time
    const stats = await Queue.getStats(finalServiceId);
    console.log('Stats for service', finalServiceId, ':', stats);
    
    // Utiliser l'historique si disponible, sinon utiliser le temps par défaut
    let tempsMoyen = stats.temps_attente_moyen || 0;
    console.log('Temps moyen:', tempsMoyen);
    
    // Utiliser le temps par défaut si le temps calculé est trop petit (< 5 min)
    if (tempsMoyen < 5 && TEMPS_PAR_DEFAUT_PAR_SERVICE[finalServiceId]) {
      tempsMoyen = TEMPS_PAR_DEFAUT_PAR_SERVICE[finalServiceId];
      console.log('Temps moyen corrigé:', tempsMoyen);
    } else if (tempsMoyen === 0) {
      tempsMoyen = 15; // Valeur par défaut
    }
    
    const estimatedWaitTime = tempsMoyen * (stats.en_cours + stats.en_attente + 1); // +1 for the current patient

    // Get service name
    const [serviceRows] = await pool.execute('SELECT nom FROM services WHERE id = ?', [finalServiceId]);
    const serviceNom = serviceRows.length > 0 ? serviceRows[0].nom : 'Service inconnu';

    res.status(201).json({
      message: 'Patient enregistré avec succès',
      patient_id: patientId,
      queue_id: queueId,
      numero: queueEntry[0].numero,
      temps_attente_estime_minutes: Math.round(estimatedWaitTime),
      service: {
        id: finalServiceId,
        nom: serviceNom
      },
      service_suggere: serviceSuggere
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du patient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getQueueByService = async (req, res) => {
  try {
    const { service_id } = req.params;
    const queue = await Queue.findByService(service_id);
    
    res.json(queue);
  } catch (error) {
    console.error('Erreur lors de la récupération de la file:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getCurrentPatient = async (req, res) => {
  try {
    const { service_id } = req.params;
    const current = await Queue.findCurrent(service_id);
    
    res.json(current || null);
  } catch (error) {
    console.error('Erreur lors de la récupération du patient actuel:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const callNextPatient = async (req, res) => {
  try {
    const { service_id } = req.params;
    const user_id = req.user ? req.user.id : 1; // Default to user 1 if not authenticated
    
    const queueId = await Queue.callNext(service_id, user_id);
    
    if (!queueId) {
      return res.status(404).json({ message: 'Aucun patient en attente' });
    }
    
    const current = await Queue.findCurrent(service_id);
    
    // Envoyer une notification push au patient
    if (current && current.patient_id) {
      const notificationResult = await sendNotificationToPatient(
        current.patient_id,
        'C\'est votre tour !',
        `Patient ${current.prenom} ${current.nom}, votre numéro a été appelé. Veuillez vous présenter au guichet.`
      );
      console.log('Résultat de la notification push:', notificationResult);
    }
    
    res.json({
      message: 'Patient appelé avec succès',
      current_patient: current
    });
  } catch (error) {
    console.error('Erreur lors de l\'appel du patient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const completePatient = async (req, res) => {
  try {
    const { queue_id } = req.params;
    
    await Queue.complete(queue_id);
    
    res.json({ message: 'Patient marqué comme terminé' });
  } catch (error) {
    console.error('Erreur lors de la finalisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Marquer un patient comme absent
const markPatientAbsent = async (req, res) => {
  try {
    const { queue_id } = req.params;
    const { delay_minutes = 5 } = req.body;
    
    await Queue.markAbsent(queue_id, delay_minutes);
    
    res.json({ 
      message: `Patient marqué comme absent. Il pourra être rappelé dans ${delay_minutes} minute(s).`,
      delay_minutes
    });
  } catch (error) {
    console.error('Erreur lors du marquage absent:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getQueueStats = async (req, res) => {
  try {
    const { service_id } = req.params;
    const stats = await Queue.getStats(service_id);

    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getQueueHistory = async (req, res) => {
  try {
    const { service_id } = req.params;
    const history = await Queue.getHistory(service_id);

    res.json(history);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Vérifier l'identité du patient par téléphone et date de naissance
const verifyPatient = async (req, res) => {
  try {
    const { telephone, date_naissance } = req.body;

    if (!telephone || !date_naissance) {
      return res.status(400).json({ message: 'Téléphone et date de naissance requis' });
    }

    const patient = await Patient.findByPhoneAndBirthDate(telephone, date_naissance);

    if (!patient) {
      return res.json({ found: false, message: 'Patient non trouvé' });
    }

    res.json({
      found: true,
      patient: {
        id: patient.id,
        nom: patient.nom,
        prenom: patient.prenom,
        date_naissance: patient.date_naissance,
        telephone: patient.telephone
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du patient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer ou créer un numéro de passage pour un patient existant
const getPatientTicket = async (req, res) => {
  try {
    const { patient_id, service_id, priorite = 'normal' } = req.body;

    if (!patient_id || !service_id) {
      return res.status(400).json({ message: 'ID patient et service requis' });
    }

    // Vérifier si le patient existe
    const patient = await Patient.findById(patient_id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Vérifier si le patient a déjà un ticket actif pour ce service
    const existingTicket = await Queue.findActiveByPatient(patient_id, service_id);
    
    if (existingTicket) {
      // Retourner le ticket existant
      const stats = await Queue.getStats(service_id);
      let tempsMoyen = stats.temps_attente_moyen || 0;
      if (tempsMoyen === 0 && TEMPS_PAR_DEFAUT_PAR_SERVICE[service_id]) {
        tempsMoyen = TEMPS_PAR_DEFAUT_PAR_SERVICE[service_id];
      }
      const position = stats.en_cours + stats.en_attente + 1;
      const estimatedWaitTime = tempsMoyen * position;

      return res.json({
        message: 'Vous avez déjà un numéro actif',
        queue_id: existingTicket.id,
        numero: existingTicket.numero,
        statut: existingTicket.statut,
        temps_attente_estime_minutes: Math.round(estimatedWaitTime),
        service: {
          id: service_id,
          nom: existingTicket.service_nom
        }
      });
    }

    // Créer un nouveau ticket
    const queueId = await Queue.create({ patient_id, service_id, priorite });
    const [queueEntry] = await pool.execute('SELECT numero FROM files_attente WHERE id = ?', [queueId]);

    // Get queue stats for estimated wait time
    const stats = await Queue.getStats(service_id);
    let tempsMoyen = stats.temps_attente_moyen || 0;
    // Utiliser le temps par défaut si le temps calculé est trop petit (< 5 min) ou égal à 0
    if (tempsMoyen < 5 && TEMPS_PAR_DEFAUT_PAR_SERVICE[service_id]) {
      tempsMoyen = TEMPS_PAR_DEFAUT_PAR_SERVICE[service_id];
    } else if (tempsMoyen === 0) {
      tempsMoyen = 15; // Valeur par défaut
    }
    const estimatedWaitTime = tempsMoyen * (stats.en_cours + stats.en_attente + 1);

    // Get service name
    const [serviceRows] = await pool.execute('SELECT nom FROM services WHERE id = ?', [service_id]);
    const serviceNom = serviceRows.length > 0 ? serviceRows[0].nom : 'Service inconnu';

    res.status(201).json({
      message: 'Nouveau numéro créé',
      queue_id: queueId,
      numero: queueEntry[0].numero,
      statut: 'en_attente',
      temps_attente_estime_minutes: Math.round(estimatedWaitTime),
      service: {
        id: service_id,
        nom: serviceNom
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du ticket:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  addToQueue,
  registerPatient,
  getQueueByService,
  getCurrentPatient,
  callNextPatient,
  completePatient,
  markPatientAbsent,
  getQueueStats,
  getQueueHistory,
  verifyPatient,
  getPatientTicket
};