# ⚡ Quick Start - Orchestr'A

Guide rapide pour démarrer le projet complet (Backend + Frontend).

## 🚀 Démarrage Rapide (5 minutes)

### 1. Démarrer l'infrastructure complète

```bash
# Cloner le projet
git clone <repository-url>
cd orchestr-a-docker

# Démarrer tous les services
docker-compose up -d

# Vérifier l'état
docker-compose ps
```

### 2. Accéder aux services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Backend API** | http://localhost:3000 | - |
| **Swagger UI** | http://localhost:3000/api | - |
| **Frontend** | http://localhost:3001 | - |
| **PostgreSQL** | localhost:5432 | orchestr_a / orchestr_a_secure_2025 |
| **Redis** | localhost:6379 | - |
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin |
| **Prisma Studio** | http://localhost:5555 | `npx prisma studio` dans /backend |

### 3. Premier test

```bash
# Health check backend
curl http://localhost:3000/health

# Ouvrir Swagger
open http://localhost:3000/api
```

## 🧪 Lancer les tests

```bash
cd backend

# Tests unitaires
npm test

# Tests E2E (nécessite PostgreSQL + Redis)
npm run test:e2e

# Tous les tests
npm run test:all
```

## 📦 Architecture

```
orchestr-a-docker/
├── backend/              # NestJS API (Node 20)
│   ├── src/             # Code source (11 modules, 68 routes)
│   ├── test/            # Tests (95 tests E2E + 32 unitaires)
│   └── prisma/          # Schéma DB + migrations
├── orchestra-app/        # Frontend React (à adapter)
├── docker-compose.yml    # Infrastructure complète
└── .github/workflows/    # CI/CD
```

## 🎯 État Actuel

### ✅ Backend (100% opérationnel)
- 11 modules NestJS
- 68 routes API documentées (Swagger)
- PostgreSQL avec 181 enregistrements migrés
- Tests : 90.5% de réussite (95/105 E2E)
- CI/CD : GitHub Actions configuré

### 🚧 Frontend (en cours d'adaptation)
- Frontend React existant (Firebase)
- Migration vers backend NestJS en cours
- Auth Firebase → JWT backend
- Services API à créer

## 📚 Documentation Complète

- **Backend** : `/backend/DEPLOYMENT-GUIDE.md`
- **Architecture** : `/ARCHITECTURE-DIAGRAMS.md`
- **Status** : `/STATUS.md`
- **Tests** : `/GUIDE_TESTS_ET_DEMARRAGE.md`
- **Phases** : `/PHASE_1_AUTHENTICATION.md`, `/PHASE_2_MODULES.md`

## 🔧 Commandes Utiles

```bash
# Arrêter tous les services
docker-compose down

# Arrêter + supprimer les données
docker-compose down -v

# Voir les logs
docker-compose logs -f backend

# Rebuild après changements
docker-compose up -d --build

# Accès base de données
docker exec -it orchestr-a-postgres psql -U orchestr_a -d orchestr_a

# Migrations Prisma
cd backend
npx prisma migrate dev
npx prisma studio
```

## ⚡ Développement Rapide

### Backend uniquement

```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```

### Frontend uniquement

```bash
cd orchestra-app
npm install
npm start
```

## 🔐 Utilisateurs de Test

Après le seed (`npx prisma db seed`) :

| Email | Password | Role |
|-------|----------|------|
| admin@orchestr-a.com | Admin123! | ADMIN |
| manager@orchestr-a.com | Manager123! | MANAGER |
| user@orchestr-a.com | User123! | CONTRIBUTOR |

## 🐛 Dépannage Rapide

```bash
# Backend ne démarre pas
docker-compose logs backend

# Base de données inaccessible
docker-compose restart postgres

# Port déjà utilisé
docker-compose down && docker-compose up -d

# Reset complet
docker-compose down -v
docker-compose up -d
cd backend && npx prisma migrate reset
```

## 📞 Besoin d'aide ?

1. Consulter `/backend/DEPLOYMENT-GUIDE.md`
2. Vérifier `/STATUS.md` pour l'état actuel
3. Ouvrir Swagger : http://localhost:3000/api
4. Voir les logs : `docker-compose logs -f`

---

**Next Steps** : Voir `/STATUS.md` pour la roadmap complète
