
# DOCUMENTATION DU SYSTÈME DE GESTION DE FILE D’ATTENTE HOSPITALIÈRE

## 1. Introduction et objectifs généraux
La gestion des files d’attente constitue un défi majeur dans les établissements hospitaliers. Ce projet vise la conception et l’implémentation d’un système informatique de gestion de file d’attente appliqué au cas de l’hôpital de Kyeshero.

## 2. Principes généraux du système
Le système permet l’enregistrement des patients, l’attribution automatique de numéros, la gestion des priorités et l’appel ordonné des patients.

## 3. Analyse fonctionnelle
### Acteurs
- Administrateur
- Agent d’accueil
- Médecin / Infirmier
- Patient

### Fonctionnalités
- Authentification
- Gestion des patients
- Gestion des files d’attente
- Priorisation des urgences
- Statistiques

## 4. Architecture du système
### Stack technologique
**Frontend**
- React.js avec TypeScript
- Tailwind CSS

**Backend**
- Node.js
- Express.js

**Base de données**
- MySQL ou PostgreSQL

Architecture :
Navigateur → React (TS + Tailwind) → API REST Node.js → Base de données

## 5. Conception de la base de données
Entités principales :
- Utilisateur
- Patient
- Service
- FileAttente

## 6. Flux des opérations
Enregistrement du patient, génération du numéro, appel du patient et mise à jour du statut.

## 7. Exigences non fonctionnelles
- Sécurité
- Performance
- Simplicité
- Évolutivité

## 8. Conclusion
Cette documentation constitue une base solide pour la modélisation UML et l’implémentation du système.
