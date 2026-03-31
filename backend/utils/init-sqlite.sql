-- Script d'initialisation de la base de données SQLite
-- Base de données: database.sqlite

-- Table utilisateurs (avec colonnes de validation et mot de passe oublié)
CREATE TABLE IF NOT EXISTS utilisateurs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mot_de_passe TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'agent', 'medecin')) NOT NULL,
  statut_compte TEXT DEFAULT 'actif' CHECK(statut_compte IN ('en_attente', 'actif', 'bloque')),
  date_validation DATETIME,
  valide_par_id INTEGER REFERENCES utilisateurs(id),
  reset_token TEXT,
  reset_token_expires DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table patients
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE NOT NULL,
  telephone TEXT,
  adresse TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table services
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Table files_attente
CREATE TABLE IF NOT EXISTS files_attente (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  numero INTEGER NOT NULL,
  priorite TEXT CHECK(priorite IN ('normal', 'urgent', 'critique')) DEFAULT 'normal',
  type_visite TEXT CHECK(type_visite IN ('consultation', 'soin', 'controle', 'urgence')) DEFAULT 'consultation',
  statut TEXT CHECK(statut IN ('en_attente', 'en_cours', 'termine', 'absent')) DEFAULT 'en_attente',
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_appel DATETIME,
  date_available DATETIME,
  absent_count INTEGER DEFAULT 0,
  utilisateur_appel_id INTEGER,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (utilisateur_appel_id) REFERENCES utilisateurs(id)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_files_attente_service_statut ON files_attente(service_id, statut);
CREATE INDEX IF NOT EXISTS idx_files_attente_patient ON files_attente(patient_id);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_statut ON utilisateurs(statut_compte);

-- Données d'exemple

-- Utilisateurs (déjà actifs car ce sont les comptes système)
INSERT OR IGNORE INTO utilisateurs (nom, email, mot_de_passe, role, statut_compte) VALUES
('Admin Principal', 'admin@hopital.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'actif'),
('Agent Accueil', 'agent@hopital.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent', 'actif'),
('Dr Dupont', 'dupont@hopital.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'medecin', 'actif');

-- Supprimer les anciens services dupliqués
DELETE FROM services WHERE nom IN ('Urgences', 'Pédiatrie', 'Cardiologie', 'Médecine générale', 'Gynécologie-Obstétrique', 'Consultation', 'Hospitalisation');

-- Services
INSERT OR IGNORE INTO services (nom, description) VALUES
('Gynéco-Obstétrique et maternité', 'Service de gynécologie, obstétrique et maternité'),
('Pédiatrie et Néonatologie', 'Service de pédiatrie et néonatologie'),
('Consultation générale et spécialisée', 'Consultations générales et spécialisées'),
('Chirurgie Générale', 'Service de chirurgie générale'),
('Médecine Interne et soins intensifs', 'Médecine interne et soins intensifs'),
('Dentisterie', 'Service de dentisterie'),
('Urgence hospitalière', 'Service des urgences hospitalières'),
('Hépato gastro entérologie', 'Service d''hépato-gastro-entérologie'),
('Urologie andrologie', 'Service d''urologie et andrologie'),
('Imagerie médicale', 'Service d''imagerie médicale'),
('Pharmacie', 'Service de pharmacie hospitalière');

-- Patients d'exemple
INSERT OR IGNORE INTO patients (nom, prenom, date_naissance, telephone, adresse) VALUES
('Dubois', 'Marie', '1985-03-15', '0123456789', '123 Rue de la Santé, Paris'),
('Martin', 'Pierre', '1990-07-22', '0987654321', '456 Avenue des Hôpitaux, Paris'),
('Garcia', 'Sophie', '1978-11-08', '0567891234', '789 Boulevard Médical, Paris');
