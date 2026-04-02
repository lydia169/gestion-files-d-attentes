const User = require('../models/User');

async function createAdmin() {
  const adminEmail = 'admin@lydia.cd';
  const adminPassword = 'Admin123';
  const adminNom = 'Administrateur Lydia';

  try {
    const existingUser = await User.findByEmail(adminEmail);
    if (existingUser) {
      console.log(`L'administrateur ${adminEmail} existe déjà.`);
      process.exit(0);
    }

    const userId = await User.create({
      nom: adminNom,
      email: adminEmail,
      mot_de_passe: adminPassword,
      role: 'admin',
      statut_compte: 'actif'
    });

    console.log(`✅ Administrateur créé avec succès !`);
    console.log(`Email : ${adminEmail}`);
    console.log(`Password : ${adminPassword}`);
    console.log(`ID : ${userId}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error);
    process.exit(1);
  }
}

createAdmin();
