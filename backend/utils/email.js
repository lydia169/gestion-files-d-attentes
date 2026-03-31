const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration du transporteur email
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Envoyer un email de validation de compte
const sendAccountValidationEmail = async (userEmail, userName, validatedBy, status) => {
  try {
    const transporter = createTransporter();
    
    const isValidated = status === 'actif';
    const subject = isValidated 
      ? 'Votre compte a été validé - Hôpital de Kyeshero'
      : 'Votre compte a été rejeté - Hôpital de Kyeshero';
    
    const htmlContent = isValidated
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Bonjour ${userName},</h2>
          <p>Nous avons le plaisir de vous informer que votre compte sur le système de gestion des files d'attente de l'hôpital de Kyeshero a été <strong>validé</strong> par l'administrateur.</p>
          <p>Vous pouvez maintenant vous connecter avec vos identifiants.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Validé par :</strong> ${validatedBy}</p>
            <p style="margin: 5px 0 0 0;"><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
          </div>
          <p>Cordialement,<br>L'équipe administrative de l'hôpital de Kyeshero</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Bonjour ${userName},</h2>
          <p>Nous vous informons que votre demande de compte sur le système de gestion des files d'attente de l'hôpital de Kyeshero a été <strong>rejetée</strong> par l'administrateur.</p>
          <p>Veuillez contacter l'administration pour plus d'informations.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Rejeté par :</strong> ${validatedBy}</p>
            <p style="margin: 5px 0 0 0;"><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
          </div>
          <p>Cordialement,<br>L'équipe administrative de l'hôpital de Kyeshero</p>
        </div>
      `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Hôpital de Kyeshero" <no-reply@hopital.com>',
      to: userEmail,
      subject: subject,
      html: htmlContent
    });

    console.log('Email envoyé: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return { success: false, error: error.message };
  }
};

// Envoyer un email de confirmation d'inscription
const sendRegistrationConfirmationEmail = async (userEmail, userName) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Bonjour ${userName},</h2>
        <p>Votre demande de création de compte sur le système de gestion des files d'attente de l'hôpital de Kyeshero a été soumise avec succès.</p>
        <p>Votre compte est actuellement en attente de validation par un administrateur.</p>
        <p>Vous recevrez un email dès que votre compte aura été validé.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Date de demande :</strong> ${new Date().toLocaleString('fr-FR')}</p>
        </div>
        <p>Cordialement,<br>L'équipe administrative de l'hôpital de Kyeshero</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Hôpital de Kyeshero" <no-reply@hopital.com>',
      to: userEmail,
      subject: 'Confirmation de votre demande de compte - Hôpital de Kyeshero',
      html: htmlContent
    });

    console.log('Email de confirmation envoyé: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
    return { success: false, error: error.message };
  }
};

// Envoyer un email de réinitialisation de mot de passe
const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Bonjour ${userName},</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe sur le système de gestion des files d'attente de l'hôpital de Kyeshero.</p>
        <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Important :</strong> Ce lien expire dans 1 heure.</p>
          <p style="margin: 5px 0 0 0;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </div>
        <p>Cordialement,<br>L'équipe administrative de l'hôpital de Kyeshero</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Hôpital de Kyeshero" <no-reply@hopital.com>',
      to: userEmail,
      subject: 'Réinitialisation de votre mot de passe - Hôpital de Kyeshero',
      html: htmlContent
    });

    console.log('Email de réinitialisation envoyé: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendAccountValidationEmail,
  sendRegistrationConfirmationEmail,
  sendPasswordResetEmail
};
