const express = require('express');
const {
  addToQueue,
  getQueueByService,
  getCurrentPatient,
  callNextPatient,
  completePatient,
  markPatientAbsent,
  getQueueStats,
  getQueueHistory
} = require('../controllers/queueController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

// Routes sans authentification globale

// POST /api/queue
router.post('/', addToQueue);

// GET /api/queue/service/:service_id
router.get('/service/:service_id', getQueueByService);

// GET /api/queue/current/:service_id
router.get('/current/:service_id', getCurrentPatient);

// POST /api/queue/call/:service_id
router.post('/call/:service_id', callNextPatient);

// POST /api/queue/complete/:queue_id
router.post('/complete/:queue_id', completePatient);

// POST /api/queue/absent/:queue_id - Marquer un patient comme absent
router.post('/absent/:queue_id', markPatientAbsent);

// GET /api/queue/stats/:service_id
router.get('/stats/:service_id', getQueueStats);

// GET /api/queue/history/:service_id
router.get('/history/:service_id', getQueueHistory);

// POST /api/queue/reset/:service_id - Reset stuck patients in progress
router.post('/reset/:service_id', async (req, res) => {
  try {
    const { service_id } = req.params;
    await pool.execute(
      "UPDATE files_attente SET statut = 'termine' WHERE service_id = ? AND statut = 'en_cours'",
      [service_id]
    );
    res.json({ message: 'Patients en cours réinitialisés' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;