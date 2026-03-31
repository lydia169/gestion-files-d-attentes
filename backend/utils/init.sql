-- Script d'initialisation de la base de données
-- Base de données: gestion_files_attente

CREATE DATABASE IF NOT EXISTS gestion_files_attente;
USE gestion_files_attente;

-- Table utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  role ENUM('admin', 'agent', 'medecin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table patients
CREATE TABLE IF NOT EXISTS patients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  date_naissance DATE NOT NULL,
  telephone VARCHAR(20),
  adresse TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table services
CREATE TABLE IF NOT EXISTS services (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

-- Table files_attente
CREATE TABLE IF NOT EXISTS files_attente (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  service_id INT NOT NULL,
  numero INT NOT NULL,
  priorite ENUM('normal', 'urgent', 'critique') DEFAULT 'normal',
  statut ENUM('en_attente', 'en_cours', 'termine') DEFAULT 'en_attente',
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_appel TIMESTAMP NULL,
  utilisateur_appel_id INT,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (utilisateur_appel_id) REFERENCES utilisateurs(id)
);

-- Index pour optimiser les performances
CREATE INDEX idx_files_attente_service_statut ON files_attente(service_id, statut);
CREATE INDEX idx_files_attente_patient ON files_attente(patient_id);
CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);

-- Données d'exemple

-- Utilisateurs
INSERT INTO utilisateurs (nom, email, mot_de_passe, role) VALUES
('Admin Principal', 'admin@hopital.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'), -- password: password
('Agent Accueil', 'agent@hopital.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent'), -- password: password
('Dr Dupont', 'dupont@hopital.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'medecin'); -- password: password

-- Services
INSERT INTO services (nom, description) VALUES
('Urgences', 'Service des urgences médicales'),
('Pédiatrie', 'Service de pédiatrie'),
('Cardiologie', 'Service de cardiologie'),
('Médecine générale', 'Consultations générales');

-- Patients d'exemple
INSERT INTO patients (nom, prenom, date_naissance, telephone, adresse) VALUES
('Dubois', 'Marie', '1985-03-15', '0123456789', '123 Rue de la Santé, Paris'),
('Martin', 'Pierre', '1990-07-22', '0987654321', '456 Avenue des Hôpitaux, Paris'),
('Garcia', 'Sophie', '1978-11-08', '0567891234', '789 Boulevard Médical, Paris');