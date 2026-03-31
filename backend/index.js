require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
const initDatabase = async () => {
  try {
    const sqlPath = path.join(__dirname, 'utils', 'init-sqlite.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL commands and execute them
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);

    for (const command of commands) {
      if (command.trim()) {
        await pool.execute(command.trim());
      }
    }

    // Ajouter les colonnes de réinitialisation de mot de passe si elles n'existent pas
    try {
      await pool.execute('ALTER TABLE utilisateurs ADD COLUMN reset_token TEXT');
    } catch (e) {
      // La colonne existe peut-être déjà
    }
    try {
      await pool.execute('ALTER TABLE utilisateurs ADD COLUMN reset_token_expires DATETIME');
    } catch (e) {
      // La colonne existe peut-être déjà
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization failed:', err);
  }
};

// Initialize database on startup
initDatabase();

// Routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const queueRoutes = require('./routes/queue');
const servicesRoutes = require('./routes/services');
const { registerPatient } = require('./controllers/queueController');
const { getAllServices } = require('./controllers/serviceController');
const { suggestService } = require('./utils/serviceMatcher');
const { verifyPatient, getPatientTicket } = require('./controllers/queueController');
const { subscribe, unsubscribe } = require('./controllers/pushController');

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/services', servicesRoutes);

// Routes publiques pour les patients
app.post('/api/public/register', registerPatient);
app.get('/api/public/services', getAllServices);

// Endpoint pour suggérer un service basé sur la description
app.post('/api/public/suggest-service', (req, res) => {
  try {
    const { description } = req.body;
    if (!description || description.trim().length < 3) {
      return res.json({ suggestion: null });
    }
    
    const suggestion = suggestService(description);
    res.json({ suggestion });
  } catch (error) {
    console.error('Erreur lors de la suggestion de service:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Routes pour récupération de numéro par patients existants
app.post('/api/public/verify-patient', verifyPatient);
app.post('/api/public/get-ticket', getPatientTicket);

// Routes pour les notifications push
app.post('/api/public/push/subscribe', subscribe);
app.post('/api/public/push/unsubscribe', unsubscribe);

app.get('/', (req, res) => {
  res.json({ message: 'API de Gestion de Files d\'Attente Hospitalière' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});