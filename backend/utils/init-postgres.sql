-- Script d'initialisation de la base de données PostgreSQL
-- Pour utilisation sur Render

-- Table utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mot_de_passe TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'agent', 'medecin')) NOT NULL,
  statut_compte TEXT DEFAULT 'actif' CHECK(statut_compte IN ('en_attente', 'actif', 'bloque')),
  date_validation TIMESTAMP,
  valide_par_id INTEGER REFERENCES utilisateurs(id),
  reset_token TEXT,
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table patients
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE NOT NULL,
  telephone TEXT,
  adresse TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table services
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  nom TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Table files_attente
CREATE TABLE IF NOT EXISTS files_attente (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  priorite TEXT CHECK(priorite IN ('normal', 'urgent', 'critique')) DEFAULT 'normal',
  type_visite TEXT CHECK(type_visite IN ('consultation', 'soin', 'controle', 'urgence')) DEFAULT 'consultation',
  statut TEXT CHECK(statut IN ('en_attente', 'en_cours', 'termine', 'absent')) DEFAULT 'en_attente',
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_appel TIMESTAMP,
  date_available TIMESTAMP,
  absent_count INTEGER DEFAULT 0,
  utilisateur_appel_id INTEGER REFERENCES utilisateurs(id)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_files_attente_service_statut ON files_attente(service_id, statut);
CREATE INDEX IF NOT EXISTS idx_files_attente_patient ON files_attente(patient_id);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_statut ON utilisateurs(statut_compte);

-- Données initiales (si vides)
-- Utilisation de ON CONFLICT pour PostgreSQL
INSERT INTO services (nom, description) VALUES
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
('Pharmacie', 'Service de pharmacie hospitalière')
ON CONFLICT (nom) DO NOTHING;
