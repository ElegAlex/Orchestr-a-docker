# 📋 Changelog - Orchestr'A

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [Unreleased]

### En Cours de Migration
- Migration Firebase → Docker/PostgreSQL/NestJS (17% complété)
- 6/35 services testés et validés
- 23/35 services restent à migrer

---

## [2.0.0] - 2025-10-15

### 🎉 Version Majeure - Architecture Docker

#### Added
- **Infrastructure Docker complète** avec docker-compose
  - Backend NestJS (port 4000)
  - Frontend React (port 3001)
  - PostgreSQL 16 (port 5432)
  - Redis 7 (port 6379)
  - MinIO S3-compatible (ports 9000/9001)

- **Backend NestJS**
  - Architecture modulaire avec 12 modules
  - Authentification JWT (access + refresh tokens)
  - API RESTful complète avec Swagger
  - Prisma ORM pour PostgreSQL
  - Guards & RBAC pour permissions

- **Services Migrés & Testés** (6/35)
  - Departments (Session 1) ✅
  - Comments (Session 2) ✅
  - SimpleTasks (Session 3) ✅
  - Presence (Session 4) ✅
  - Documents avec MinIO (Session 5) ✅
  - Leaves avec workflow approval (Session 6) ✅

- **Services Migrés (non testés)** (6/35)
  - Projects (backend + frontend)
  - Tasks (backend + frontend)
  - Users (backend + frontend)
  - Milestones (backend + frontend)
  - Notifications (backend)
  - Activities (backend)

- **Documentation**
  - Structure /docs/ organisée par domaine
  - README.md complet niveau production
  - CONTRIBUTING.md avec standards de code
  - 6 guides de tests détaillés
  - Architecture diagrams

#### Changed
- **Migration base de données**
  - Firestore → PostgreSQL 16
  - Schéma Prisma avec 15+ modèles
  - Relations strictes avec foreign keys
  - Indexes optimisés

- **Authentification**
  - Firebase Auth → JWT avec refresh tokens
  - Sessions Redis pour invalidation
  - RBAC granulaire (5 rôles)

- **Stockage fichiers**
  - Firebase Storage → MinIO (S3-compatible)
  - Pre-signed URLs pour uploads/downloads
  - Buckets isolés par type de document

#### Removed
- Dépendance Firebase (en cours de suppression complète)
- 71 fichiers backup obsolètes
- 55 fichiers documentation redondants
- 3.2 MB de fichiers temporaires

#### Fixed
- Structure projet nettoyée et organisée
- Arborescence claire (59 MD → 4 MD à la racine)
- Documentation cohérente et à jour

#### Security
- JWT avec rotation automatique des refresh tokens
- Rate limiting sur endpoints sensibles
- Validation stricte avec class-validator
- Password hashing bcrypt (10 rounds)
- CORS configuré pour production

#### Performance
- Connection pooling PostgreSQL
- Redis caching pour données fréquentes
- Pagination sur tous les endpoints
- Index database optimisés
- Code splitting frontend

---

## [1.2.0] - 2025-09-29

### Added
- Dashboard Hub optimisé
- Cards roadmap avec lazy loading
- Gestion télétravail v2

### Changed
- Amélioration performances calendrier
- Optimisation requêtes Firestore

### Fixed
- Bug de routing après login
- Permissions administrateur

---

## [1.1.0] - 2025-08-15

### Added
- Module de congés complet
- Workflow d'approbation congés
- Calendrier des absences
- Export planning équipes

### Changed
- Interface utilisateur rafraîchie
- Navigation simplifiée

---

## [1.0.0] - 2025-06-01

### 🎉 Version Initiale - Firebase

#### Added
- **Gestion de Projets**
  - CRUD projets complet
  - Gantt charts interactifs
  - Milestones et livrables
  - Budget tracking

- **Gestion des Tâches**
  - Tâches avec dépendances
  - Affectation et suivi
  - Statuts et priorités
  - Time tracking

- **Gestion des Ressources**
  - Profils utilisateurs
  - Compétences et certifications
  - Charge de travail
  - Planning équipes

- **Dashboard & Reporting**
  - Dashboard exécutif
  - KPIs temps réel
  - Rapports personnalisables
  - Exports Excel/PDF

- **Administration**
  - Gestion utilisateurs
  - Permissions granulaires
  - Départements et services
  - Audit logs

#### Tech Stack Initiale
- Frontend: React 18 + TypeScript + MUI
- Backend: Firebase (Firestore + Auth + Functions)
- Hosting: Firebase Hosting
- Storage: Firebase Storage

---

## Catégories de Changements

- **Added** : Nouvelles fonctionnalités
- **Changed** : Modifications de fonctionnalités existantes
- **Deprecated** : Fonctionnalités bientôt supprimées
- **Removed** : Fonctionnalités supprimées
- **Fixed** : Corrections de bugs
- **Security** : Corrections de sécurité
- **Performance** : Améliorations de performance

---

## Migration en Cours (Phase 5E - 17% complété)

### Services Testés ✅ (6/35 - 17%)
1. Departments
2. Comments
3. SimpleTasks
4. Presence
5. Documents
6. Leaves

### Services Migrés (non testés) 🟡 (6/35 - 17%)
7. Projects
8. Tasks
9. Users
10. Milestones
11. Notifications
12. Activities

### Services Restants 🔴 (23/35 - 66%)
- PersonalTodo, Epic, Profile, SchoolHolidays, Holiday
- Capacity, Resource, Telework-v2, Remote-Work
- Analytics, HR-Analytics, Skill-Management, Team-Supervision
- Service, User-Service-Assignment, Session, Attachment
- Webhook, Push-Notification, Realtime-Notification
- Admin-User-Creation, Simple-User, User-Simulation

**Documentation migration complète**: [docs/migration/services-status.md](docs/migration/services-status.md)

---

## Liens Utiles

- [Documentation](docs/README.md)
- [Guide de Contribution](CONTRIBUTING.md)
- [Roadmap](docs/ROADMAP.md)
- [Migration Status](docs/migration/services-status.md)

---

**Dernière mise à jour**: 2025-10-15
**Version actuelle**: 2.0.0 (Docker/NestJS)
**Version précédente**: 1.2.0 (Firebase)
