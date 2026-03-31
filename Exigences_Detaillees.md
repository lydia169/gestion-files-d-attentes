# Exigences Détaillées du Système de Gestion de File d'Attente Hospitalière

## 1. Vue d'ensemble
Le système doit permettre une gestion efficace des files d'attente à l'hôpital de Kyeshero, en automatisant les processus d'enregistrement, d'attribution de numéros et d'appel des patients, tout en priorisant les urgences.

## 2. Exigences Fonctionnelles

### 2.1 Authentification et Autorisation
- **RF1.1** : Système de login avec rôles (Administrateur, Agent d'accueil, Médecin/Infirmier).
- **RF1.2** : Gestion des sessions sécurisées.
- **RF1.3** : Accès basé sur les rôles aux différentes fonctionnalités.

### 2.2 Gestion des Patients
- **RF2.1** : Enregistrement d'un nouveau patient (nom, prénom, date de naissance, numéro de téléphone, adresse).
- **RF2.2** : Recherche et modification des informations patient.
- **RF2.3** : Historique des visites du patient.

### 2.3 Gestion des Files d'Attente
- **RF3.1** : Création de files d'attente par service (ex: Urgences, Pédiatrie, Cardiologie).
- **RF3.2** : Attribution automatique de numéros séquentiels.
- **RF3.3** : Affichage en temps réel de la file d'attente (écran patient et écran agent).
- **RF3.4** : Appel du prochain patient par l'agent/médecin.
- **RF3.5** : Mise à jour du statut (en attente, en cours, terminé).

### 2.4 Priorisation des Urgences
- **RF4.1** : Classification des urgences (critique, urgent, normal).
- **RF4.2** : Insertion prioritaire dans la file d'attente.
- **RF4.3** : Notification visuelle/audible pour les urgences.

### 2.5 Statistiques et Rapports
- **RF5.1** : Temps d'attente moyen par service.
- **RF5.2** : Nombre de patients servis par jour/semaine.
- **RF5.3** : Taux d'occupation des services.
- **RF5.4** : Export des rapports en PDF/Excel.

## 3. Exigences Non Fonctionnelles

### 3.1 Sécurité
- **RNF1.1** : Chiffrement des données sensibles (mot de passe, informations médicales).
- **RNF1.2** : Conformité RGPD pour la protection des données personnelles.
- **RNF1.3** : Logs d'audit pour toutes les actions.

### 3.2 Performance
- **RNF2.1** : Temps de réponse < 2 secondes pour les opérations courantes.
- **RNF2.2** : Support de 1000 patients simultanés.
- **RNF2.3** : Optimisation pour les appareils mobiles.

### 3.3 Simplicité et Utilisabilité
- **RNF3.1** : Interface intuitive sans formation préalable.
- **RNF3.2** : Support multilingue (Français, Anglais, Kinyarwanda si nécessaire).
- **RNF3.3** : Accessibilité (conformité WCAG).

### 3.4 Évolutivité
- **RNF4.1** : Architecture modulaire pour ajouter de nouveaux services.
- **RNF4.2** : Facilité d'intégration avec d'autres systèmes hospitaliers (EHR, etc.).
- **RNF4.3** : Mise à jour sans interruption de service.

## 4. Contraintes Techniques
- **CT1** : Utilisation de React.js + TypeScript pour le frontend.
- **CT2** : Backend Node.js + Express.js.
- **CT3** : Base de données MySQL ou PostgreSQL.
- **CT4** : Déploiement sur serveur local ou cloud (AWS/Azure).

## 5. Cas d'Utilisation Principaux
- **CU1** : Agent enregistre un patient et lui attribue un numéro.
- **CU2** : Médecin appelle le prochain patient.
- **CU3** : Administrateur consulte les statistiques.
- **CU4** : Patient voit son numéro et le temps d'attente estimé.

Cette analyse affine les exigences de base et sert de base pour la conception détaillée.