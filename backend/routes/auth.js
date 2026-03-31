const express = require('express');
const { register, login, getProfile, getAllUsers, getPendingUsers, updateUser, validateUser, rejectUser, deleteUser, requestPasswordReset, resetPassword } = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register - Inscription publique
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/forgot-password - Demande de réinitialisation de mot de passe
router.post('/forgot-password', requestPasswordReset);

// POST /api/auth/reset-password - Réinitialisation du mot de passe
router.post('/reset-password', resetPassword);

// GET /api/auth/profile - Profil utilisateur (authentifié)
router.get('/profile', authenticateToken, getProfile);

// GET /api/auth/all - Liste tous les utilisateurs (admin uniquement)
router.get('/all', authenticateToken, authorizeRoles('admin'), getAllUsers);

// GET /api/auth/pending - Liste des comptes en attente (admin uniquement)
router.get('/pending', authenticateToken, authorizeRoles('admin'), getPendingUsers);

// PUT /api/auth/:id - Modifier un utilisateur (admin uniquement)
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateUser);

// POST /api/auth/validate/:id - Valider un compte (admin uniquement)
router.post('/validate/:id', authenticateToken, authorizeRoles('admin'), validateUser);

// POST /api/auth/reject/:id - Rejeter un compte (admin uniquement)
router.post('/reject/:id', authenticateToken, authorizeRoles('admin'), rejectUser);

// DELETE /api/auth/:id - Supprimer un utilisateur (admin uniquement)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteUser);

module.exports = router;
