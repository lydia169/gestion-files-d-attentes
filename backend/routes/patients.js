const express = require('express');
const {
  createPatient,
  getAllPatients,
  getPatientById,
  searchPatients,
  updatePatient,
  deletePatient
} = require('../controllers/patientController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// GET /api/patients/search?q=query
router.get('/search', searchPatients);

// GET /api/patients
router.get('/', getAllPatients);

// GET /api/patients/:id
router.get('/:id', getPatientById);

// POST /api/patients
router.post('/', authorizeRoles('admin', 'agent'), createPatient);

// PUT /api/patients/:id
router.put('/:id', authorizeRoles('admin', 'agent'), updatePatient);

// DELETE /api/patients/:id
router.delete('/:id', authorizeRoles('admin', 'agent'), deletePatient);

module.exports = router;