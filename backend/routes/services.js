const express = require('express');
const { getAllServices, createService, updateService, deleteService } = require('../controllers/serviceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// GET /api/services - Liste tous les services (public pour le select)
router.get('/', getAllServices);

// POST /api/services - Créer un service (admin uniquement)
router.post('/', authenticateToken, authorizeRoles('admin'), createService);

// PUT /api/services/:id - Modifier un service (admin uniquement)
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateService);

// DELETE /api/services/:id - Supprimer un service (admin uniquement)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteService);

module.exports = router;
