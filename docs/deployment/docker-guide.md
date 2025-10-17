# 🐳 Orchestr'A - Application Complète Docker (100% Local)

## ✅ Ce qui fonctionne

Une application **100% locale** qui tourne en Docker avec **PostgreSQL + NestJS + React**, sans aucune dépendance Firebase Cloud pour les fonctionnalités de base.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Docker Compose - Stack Complète                               │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  PostgreSQL      │  │  MinIO S3        │  │  Backend     │ │
│  │  Port: 5432      │  │  Ports: 9000/01  │  │  NestJS      │ │
│  │  Database: dev   │  │  Storage Object  │  │  Port: 4000  │ │
│  └────────┬─────────┘  └──────────────────┘  └──────┬───────┘ │
│           │                                           │         │
│           └───────────────────────────────────────────┘         │
│                              │                                  │
│                              ▼                                  │
│                    ┌──────────────────┐                        │
│                    │  Frontend React  │                        │
│                    │  Nginx           │                        │
│                    │  Port: 3001      │                        │
│                    └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Démarrage Rapide

### 1. Démarrer l'application

```bash
cd /home/alex/Documents/Repository/orchestr-a-docker
docker-compose -f docker-compose.full.yml up -d
```

### 2. Accéder à l'application

Ouvre ton navigateur sur : **http://localhost:3001**

**Identifiants de connexion :**
- Email: `admin@orchestra.local`
- Password: `admin123`

### 3. Arrêter l'application

```bash
docker-compose -f docker-compose.full.yml down
```

### 4. Voir les logs

```bash
# Tous les services
docker-compose -f docker-compose.full.yml logs -f

# Un service spécifique
docker-compose -f docker-compose.full.yml logs -f backend
docker-compose -f docker-compose.full.yml logs -f frontend
```

## 📋 Données de Test

La base de données contient des données de test complètes :

### 5 Projets
1. **Site Web E-commerce** (ACTIVE, HIGH)
   - 3 tâches (design, panier, paiement)

2. **Application Mobile** (ACTIVE, HIGH)
   - 3 tâches (setup, connexion, notifications)

3. **Migration Cloud** (ACTIVE, CRITICAL)
   - 4 tâches (audit, AWS setup, migration BDD, tests)

4. **Dashboard Analytics** (DRAFT, MEDIUM)
   - 2 tâches (maquettes, choix stack)

5. **API v2** (COMPLETED, HIGH)
   - 3 tâches complétées (doc, tests, déploiement)

### 15 Tâches
- Statuts variés : TODO, IN_PROGRESS, COMPLETED
- Avec estimations, échéances, tags
- Toutes assignées à l'utilisateur admin

## 🔧 APIs Disponibles

### Authentification
- `POST /api/auth/login` - Login (retourne JWT token)
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Projets
- `GET /api/projects` - Liste des projets ✅ (5 projets)
- `GET /api/projects/:id` - Détail d'un projet
- `POST /api/projects` - Créer un projet
- `PATCH /api/projects/:id` - Modifier un projet
- `DELETE /api/projects/:id` - Supprimer un projet

### Tâches
- `GET /api/tasks` - Liste des tâches ✅ (15 tâches)
- `GET /api/tasks/:id` - Détail d'une tâche
- `POST /api/tasks` - Créer une tâche
- `PATCH /api/tasks/:id` - Modifier une tâche
- `DELETE /api/tasks/:id` - Supprimer une tâche

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `GET /api/users/:id` - Détail d'un utilisateur
- `POST /api/users` - Créer un utilisateur
- `PATCH /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur

### Commentaires
- `GET /api/comments` - Liste des commentaires ✅
- `POST /api/comments` - Créer un commentaire

### Documents
- `GET /api/documents` - Liste des documents ✅
- `POST /api/documents` - Upload un document

### Congés
- `GET /api/leaves` - Liste des congés ✅
- `POST /api/leaves` - Créer une demande de congé

## 📊 Services Migrés

Ces services utilisent maintenant l'API NestJS au lieu de Firebase :

✅ **project.service.ts** - Gestion des projets
✅ **task.service.ts** - Gestion des tâches
✅ **user.service.ts** - Gestion des utilisateurs

## 🔍 Tester les APIs

### Obtenir un token JWT

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@orchestra.local",
    "password": "admin123"
  }'
```

### Lister les projets

```bash
TOKEN="votre_token_ici"

curl -X GET http://localhost:4000/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

### Lister les tâches

```bash
curl -X GET http://localhost:4000/api/tasks \
  -H "Authorization: Bearer $TOKEN"
```

## 🔄 Rebuild l'application

Si tu modifies le code source :

```bash
# Rebuild backend seulement
docker-compose -f docker-compose.full.yml build --no-cache backend
docker-compose -f docker-compose.full.yml up -d backend

# Rebuild frontend seulement
docker-compose -f docker-compose.full.yml build --no-cache frontend
docker-compose -f docker-compose.full.yml up -d frontend

# Rebuild tout
docker-compose -f docker-compose.full.yml build --no-cache
docker-compose -f docker-compose.full.yml up -d
```

## 🗄️ Base de Données

### Accéder à PostgreSQL

```bash
# Via Docker
docker exec -it orchestr-a-postgres psql -U dev -d orchestra_dev

# Directement
psql -h localhost -p 5432 -U dev -d orchestra_dev
```

### Réinitialiser les données

```bash
# Supprimer toutes les données
docker exec orchestr-a-postgres psql -U dev -d orchestra_dev -c "DELETE FROM project_members; DELETE FROM tasks; DELETE FROM projects; DELETE FROM users WHERE email != 'admin@orchestra.local';"

# Recharger les données de test
docker exec -i orchestr-a-postgres psql -U dev -d orchestra_dev < init-data.sql
```

## 📦 MinIO (Stockage S3)

### Accéder à la console MinIO

URL : **http://localhost:9001**

Credentials :
- Username: `devuser`
- Password: `devpassword`

### API S3 compatible

Endpoint : **http://localhost:9000**

## 🐛 Dépannage

### Le port 3001 est déjà utilisé

```bash
# Trouver quel processus utilise le port
sudo lsof -i :3001

# Changer le port dans docker-compose.full.yml
# Modifier la ligne : "3001:80" -> "3002:80"
```

### L'application ne se charge pas

```bash
# Vérifier que tous les containers tournent
docker-compose -f docker-compose.full.yml ps

# Vérifier les logs
docker-compose -f docker-compose.full.yml logs backend
docker-compose -f docker-compose.full.yml logs frontend
```

### Backend ne démarre pas

```bash
# Vérifier PostgreSQL
docker exec orchestr-a-postgres pg_isready

# Vérifier les migrations Prisma
docker exec orchestr-a-backend npx prisma migrate status
```

### Rebuild complet (solution ultime)

```bash
# Arrêter tout
docker-compose -f docker-compose.full.yml down -v

# Supprimer les images
docker rmi orchestr-a-docker-backend orchestr-a-docker-frontend

# Rebuild et redémarrer
docker-compose -f docker-compose.full.yml up --build -d
```

## 📝 Variables d'Environnement

### Backend

```env
DATABASE_URL=postgresql://dev:devpassword@postgres:5432/orchestra_dev
JWT_SECRET=dev-secret-key-change-in-production
CORS_ORIGIN=http://localhost:3001
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=devuser
MINIO_SECRET_KEY=devpassword
```

### Frontend

```env
REACT_APP_API_URL=http://localhost:4000/api
```

## 🎯 Prochaines Étapes

### Services à migrer (39 services utilisent encore Firebase)

Priorité haute :
- [ ] **department.service.ts** - Besoin de créer API backend
- [ ] **milestone.service.ts** - Besoin de créer API backend
- [ ] **epic.service.ts** - Besoin de créer API backend
- [ ] **presence.service.ts** - Besoin de créer API backend
- [ ] **holiday.service.ts** - Besoin de créer API backend

Priorité moyenne :
- [ ] **comment.service.ts** - API existe déjà (200 OK)
- [ ] **document.service.ts** - API existe déjà (200 OK)
- [ ] **leave.service.ts** - API existe déjà (200 OK)

Priorité basse (features avancées) :
- [ ] analytics.service.ts
- [ ] dashboard-hub.service.ts
- [ ] notification.service.ts
- [ ] webhook.service.ts
- Et 30+ autres services...

### Améliorations

- [ ] Ajouter plus d'utilisateurs de test
- [ ] Créer des départements de test
- [ ] Ajouter des milestones aux projets
- [ ] Créer des commentaires sur les tâches
- [ ] Uploader des documents de test
- [ ] Script de migration automatique Firebase → PostgreSQL

## 📚 Documentation Technique

### Structure du projet

```
orchestr-a-docker/
├── docker-compose.full.yml    # Configuration Docker complète
├── init-data.sql              # Données de test SQL
├── backend/                   # API NestJS
│   ├── src/
│   │   ├── auth/             # Module authentification
│   │   ├── users/            # Module utilisateurs
│   │   ├── projects/         # Module projets
│   │   ├── tasks/            # Module tâches
│   │   ├── comments/         # Module commentaires
│   │   ├── documents/        # Module documents
│   │   └── leaves/           # Module congés
│   └── prisma/
│       └── schema.prisma     # Schéma base de données
└── orchestra-app/            # Frontend React
    ├── src/
    │   ├── services/         # Services API
    │   │   ├── api/         # Clients API REST
    │   │   ├── project.service.ts   ✅ Migré
    │   │   ├── task.service.ts      ✅ Migré
    │   │   └── user.service.ts      ✅ Migré
    │   └── pages/
    │       └── SimpleDashboard.tsx  # Dashboard fonctionnel
    └── Dockerfile            # Build production React
```

## ✅ État Actuel

**Application 100% fonctionnelle en Docker :**
- ✅ Stack complète : PostgreSQL + MinIO + NestJS + React
- ✅ Base de données avec 5 projets et 15 tâches
- ✅ Authentification JWT fonctionnelle
- ✅ APIs projets et tâches opérationnelles
- ✅ Frontend optimisé en production (Nginx)
- ✅ Aucune dépendance Firebase Cloud nécessaire pour les features de base
- ✅ Données persistantes dans PostgreSQL local
- ✅ Stockage S3 local avec MinIO

**Ce qui marche :**
- Connexion utilisateur
- Affichage de la liste des projets
- Affichage de la liste des tâches
- Dashboard simple avec statistiques
- APIs CRUD complètes pour projets, tâches, utilisateurs

**Limitations actuelles :**
- Seulement 3 services migrés sur 40+ au total
- Pas de gestion des départements (API backend manquante)
- Pas de gestion des milestones (API backend manquante)
- Pas de gestion des epics (API backend manquante)
- Features avancées (analytics, webhooks, etc.) toujours sur Firebase

---

**Dernière mise à jour :** 2025-10-14
**Version :** 1.0.0 - Stack Docker complète fonctionnelle
