# Schéma de la Base de Données - Système de Gestion de File d'Attente

## Vue d'ensemble
Base de données relationnelle utilisant MySQL ou PostgreSQL. Structure normalisée pour éviter la redondance.

## Tables

### 1. utilisateurs
Stocke les informations des utilisateurs du système (admin, agents, médecins).

| Colonne          | Type          | Contraintes                  | Description |
|------------------|---------------|------------------------------|-------------|
| id               | INT           | PK, AUTO_INCREMENT          | Identifiant unique |
| nom              | VARCHAR(100)  | NOT NULL                    | Nom complet |
| email            | VARCHAR(150)  | UNIQUE, NOT NULL            | Email pour login |
| mot_de_passe     | VARCHAR(255)  | NOT NULL                    | Mot de passe hashé |
| role             | ENUM('admin', 'agent', 'medecin') | NOT NULL | Rôle de l'utilisateur |
| created_at       | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP   | Date de création |

### 2. patients
Informations des patients enregistrés.

| Colonne          | Type          | Contraintes                  | Description |
|------------------|---------------|------------------------------|-------------|
| id               | INT           | PK, AUTO_INCREMENT          | Identifiant unique |
| nom              | VARCHAR(100)  | NOT NULL                    | Nom de famille |
| prenom           | VARCHAR(100)  | NOT NULL                    | Prénom |
| date_naissance   | DATE          | NOT NULL                    | Date de naissance |
| telephone        | VARCHAR(20)   |                             | Numéro de téléphone |
| adresse          | TEXT          |                             | Adresse complète |
| created_at       | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP   | Date d'enregistrement |

### 3. services
Départements ou services hospitaliers (Urgences, Pédiatrie, etc.).

| Colonne          | Type          | Contraintes                  | Description |
|------------------|---------------|------------------------------|-------------|
| id               | INT           | PK, AUTO_INCREMENT          | Identifiant unique |
| nom              | VARCHAR(100)  | UNIQUE, NOT NULL            | Nom du service |
| description      | TEXT          |                             | Description du service |

### 4. files_attente
Gestion des files d'attente par patient et service.

| Colonne              | Type          | Contraintes                  | Description |
|----------------------|---------------|------------------------------|-------------|
| id                   | INT           | PK, AUTO_INCREMENT          | Identifiant unique |
| patient_id           | INT           | FK -> patients.id, NOT NULL | Référence au patient |
| service_id           | INT           | FK -> services.id, NOT NULL | Référence au service |
| numero               | INT           | NOT NULL                    | Numéro d'attente |
| priorite             | ENUM('normal', 'urgent', 'critique') | DEFAULT 'normal' | Niveau de priorité |
| statut               | ENUM('en_attente', 'en_cours', 'termine') | DEFAULT 'en_attente' | Statut actuel |
| date_creation        | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP   | Date d'ajout à la file |
| date_appel           | TIMESTAMP     | NULL                        | Date d'appel du patient |
| utilisateur_appel_id | INT           | FK -> utilisateurs.id, NULL | Agent/médecin qui a appelé |

## Relations
- **files_attente.patient_id** → **patients.id** (Many-to-One)
- **files_attente.service_id** → **services.id** (Many-to-One)
- **files_attente.utilisateur_appel_id** → **utilisateurs.id** (Many-to-One)

## Index
- Index sur `utilisateurs.email` pour l'authentification rapide.
- Index sur `files_attente.service_id, statut, priorite` pour les requêtes de file d'attente.
- Index sur `files_attente.patient_id` pour l'historique des patients.

## Considérations
- Utiliser des transactions pour les opérations d'ajout/suppression en file d'attente.
- Archiver les entrées `termine` dans une table historique si nécessaire pour les statistiques.
- Chiffrement des mots de passe avec bcrypt.
- Validation des données au niveau application et base de données.