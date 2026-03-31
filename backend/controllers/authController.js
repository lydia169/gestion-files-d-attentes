const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendAccountValidationEmail, sendRegistrationConfirmationEmail, sendPasswordResetEmail } = require('../utils/email');

const register = async (req, res) => {
  try {
    const { nom, email, mot_de_passe, role } = req.body;

    if (!nom || !email || !mot_de_passe || !role) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Créer le compte (statut par défaut: 'en_attente')
    const userId = await User.create({ nom, email, mot_de_passe, role });

    // Envoyer un email de confirmation
    await sendRegistrationConfirmationEmail(email, nom);

    res.status(201).json({
      message: 'Compte créé avec succès. En attente de validation par un administrateur.',
      user_id: userId
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier si le compte est actif
    if (user.statut_compte === 'en_attente') {
      return res.status(403).json({ message: 'Votre compte est en attente de validation par un administrateur' });
    }

    if (user.statut_compte === 'bloque') {
      return res.status(403).json({ message: 'Votre compte a été bloqué. Veuillez contacter un administrateur' });
    }

    const isValidPassword = await User.validatePassword(mot_de_passe, user.mot_de_passe);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        statut_compte: user.statut_compte
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      statut_compte: user.statut_compte,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Admin functions

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getPendingUsers = async (req, res) => {
  try {
    const users = await User.findByStatus('en_attente');
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs en attente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, email, role, statut_compte } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Si changement d'email, vérifier qu'il n'est pas déjà utilisé
    if (email !== user.email) {
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
    }

    await User.update(id, { nom, email, role, statut_compte });

    res.json({ message: 'Utilisateur mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const validateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    await User.validateAccount(id, adminId);

    // Envoyer un email de validation
    const admin = await User.findById(adminId);
    const emailResult = await sendAccountValidationEmail(
      user.email, 
      user.nom, 
      admin?.nom || 'Administrateur', 
      'actif'
    );
    
    if (!emailResult.success) {
      console.error('Échec de l\'envoi de l\'email de validation:', emailResult.error);
    }

    res.json({ message: 'Compte validé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    await User.rejectAccount(id);

    // Envoyer un email de rejet
    const admin = await User.findById(adminId);
    const emailResult = await sendAccountValidationEmail(
      user.email, 
      user.nom, 
      admin?.nom || 'Administrateur', 
      'bloque'
    );
    
    if (!emailResult.success) {
      console.error('Échec de l\'envoi de l\'email de rejet:', emailResult.error);
    }

    res.json({ message: 'Compte rejeté' });
  } catch (error) {
    console.error('Erreur lors du rejet:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Empêcher la suppression de soi-même
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    await User.delete(id);

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Demande de réinitialisation de mot de passe
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }

    const user = await User.findByEmail(email);
    
    // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
    if (!user) {
      return res.json({ message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.' });
    }

    // Vérifier si le compte est actif
    if (user.statut_compte !== 'actif') {
      return res.json({ message: 'Si un compte existe avec cet email et est actif, vous recevrez un lien de réinitialisation.' });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000).toISOString(); // 1 heure

    // Sauvegarder le token dans la base de données
    await User.setResetToken(email, resetToken, resetTokenExpires);

    // En mode développement (et pour les tests), retourner le token pour les tests
    // Retirer cette condition en production
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    return res.json({ 
      message: 'Lien de réinitialisation (cliquez sur le lien ci-dessous)',
      resetToken: resetToken,
      resetUrl: resetUrl
    });

    // Envoyer l'email de réinitialisation (production)
    const emailResult = await sendPasswordResetEmail(user.email, user.nom, resetToken);
    
    if (!emailResult.success) {
      console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', emailResult.error);
      // On continue quand même pour ne pas révéler l'erreur
    }

    res.json({ message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.' });
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Réinitialiser le mot de passe
const resetPassword = async (req, res) => {
  try {
    const { token, mot_de_passe } = req.body;

    if (!token || !mot_de_passe) {
      return res.status(400).json({ message: 'Token et nouveau mot de passe requis' });
    }

    if (mot_de_passe.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Rechercher l'utilisateur avec ce token
    const user = await User.findByResetToken(token);
    
    if (!user) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

    // Mettre à jour le mot de passe
    await User.updatePassword(user.id, mot_de_passe);

    // Effacer le token de réinitialisation
    await User.clearResetToken(user.id);

    res.json({ message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getAllUsers,
  getPendingUsers,
  updateUser,
  validateUser,
  rejectUser,
  deleteUser,
  requestPasswordReset,
  resetPassword
};
