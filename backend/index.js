require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const pool = require('./config/database');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Sécurité HTTP headers
app.use(helmet());

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de requêtes depuis cette IP, réessayez dans 15 minutes.' }
});
app.use(globalLimiter);

// Rate limiting strict pour l'authentification (anti brute-force)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives de connexion. Réessayez dans 1 heure.' }
});

// Rate limiting pour les routes publiques patients
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de requêtes, veuillez patienter.' }
});

// Middleware
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(o => o.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
const initDatabase = async () => {
  try {
    const isPostgres = !!process.env.DATABASE_URL;
    const sqlFile = isPostgres ? 'init-postgres.sql' : 'init-sqlite.sql';
    const sqlPath = path.join(__dirname, 'utils', sqlFile);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log(`Initialisation de la base de données (${isPostgres ? 'PostgreSQL' : 'SQLite'})...`);

    // Split SQL commands and execute them
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);

    for (const command of commands) {
      if (command.trim()) {
        await pool.execute(command.trim());
      }
    }

    if (!isPostgres) {
      // Ajouter les colonnes de réinitialisation de mot de passe si elles n'existent pas (SQLite uniquement)
      try {
        await pool.execute('ALTER TABLE utilisateurs ADD COLUMN reset_token TEXT');
      } catch (e) {}
      try {
        await pool.execute('ALTER TABLE utilisateurs ADD COLUMN reset_token_expires DATETIME');
      } catch (e) {}
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

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/services', servicesRoutes);

// Routes publiques pour les patients (rate-limitées)
app.post('/api/public/register', publicLimiter, registerPatient);
app.get('/api/public/services', publicLimiter, getAllServices);

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

// Routes pour récupération de numéro par patients existants (rate-limitées)
app.post('/api/public/verify-patient', publicLimiter, verifyPatient);
app.post('/api/public/get-ticket', publicLimiter, getPatientTicket);

// Routes pour les notifications push (rate-limitées)
app.post('/api/public/push/subscribe', publicLimiter, subscribe);
app.post('/api/public/push/unsubscribe', publicLimiter, unsubscribe);

app.get('/', (req, res) => {
  res.json({ message: 'API de Gestion de Files d\'Attente Hospitalière' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});