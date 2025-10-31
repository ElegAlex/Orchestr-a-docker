# 🚀 Guide de Déploiement Local - Orchestr'A Backend

> ⚠️ **IMPORTANT**: Cette application est conçue pour un **déploiement local uniquement** via Docker Compose.
> Il n'y a **aucun déploiement cloud** (pas de Firebase, AWS, Google Cloud, etc.).

## 📋 Architecture Container Docker

L'application backend est **complètement containerisée** pour déploiement local uniquement.

**Stack technique**:
- Node.js 20 (Alpine)
- Docker & Docker Compose
- PostgreSQL 16 (container)
- Redis 7 (container)
- MinIO (container)
- NestJS 10.x

## 🏗️ Architecture

```
Backend NestJS
├── PostgreSQL 15 (Base de données)
├── Redis 7 (Cache & sessions)
├── MinIO (Stockage fichiers)
└── Swagger UI (Documentation API)
```

## 🔧 Installation Locale

### 1. Cloner le projet

```bash
git clone <repository-url>
cd orchestr-a-docker/backend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créer un fichier `.env` à la racine du backend :

```env
# Database
DATABASE_URL="postgresql://orchestr_a:orchestr_a_secure_2025@localhost:5432/orchestr_a"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="30d"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_USE_SSL=false
MINIO_BUCKET_NAME="orchestr-a-files"

# Application
NODE_ENV="development"
PORT=3000
```

### 4. Démarrer l'infrastructure Docker

```bash
cd ..
docker-compose up -d postgres redis minio
```

### 5. Générer le client Prisma et exécuter les migrations

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

### 6. (Optionnel) Charger les données de test

```bash
npx prisma db seed
```

### 7. Démarrer le serveur

```bash
# Mode développement
npm run start:dev

# Mode production
npm run build
npm run start:prod
```

## 🐳 Déploiement Docker Complet (RECOMMANDÉ)

### Démarrer toute la stack containerisée

```bash
# Démarrer tous les services (backend + frontend + infra)
docker-compose -f docker-compose.full.yml up -d

# Vérifier l'état des services
docker-compose -f docker-compose.full.yml ps

# Suivre les logs en temps réel
docker-compose -f docker-compose.full.yml logs -f backend
```

Services disponibles :
- **Backend API** : http://localhost:4000
- **Swagger UI** : http://localhost:4000/api
- **Frontend React** : http://localhost:3001
- **PostgreSQL** : localhost:5432
- **Redis** : localhost:6380 (externe) / 6379 (interne)
- **MinIO Console** : http://localhost:9001
- **Prisma Studio** : `docker exec -it orchestr-a-backend npx prisma studio`

### Vérifier l'état des services

```bash
docker-compose ps
docker-compose logs -f backend
```

### Arrêter les services

```bash
docker-compose down

# Avec suppression des volumes (données)
docker-compose down -v
```

## 🧪 Tests

### Tests unitaires

```bash
npm test

# Avec couverture
npm test -- --coverage
```

### Tests E2E

```bash
# Démarre automatiquement PostgreSQL + Redis via Docker
npm run test:e2e
```

### Tous les tests

```bash
npm run test:all
```

## 📊 Monitoring & Santé

### Health Check

```bash
curl http://localhost:3000/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

### Métriques API

- **Swagger UI** : http://localhost:3000/api
- **11 modules** : Auth, Users, Projects, Tasks, Leaves, Departments, Roles, Comments, Notifications, Files, Health
- **68 routes API** : Toutes documentées dans Swagger

## 🔐 Sécurité

### Variables d'environnement en production

**⚠️ IMPORTANT** : Ne JAMAIS commit les secrets en production !

```bash
# Générer des secrets sécurisés
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Remplacer dans `.env` :
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- Password PostgreSQL

### Helmet & Rate Limiting

Le backend inclut :
- **Helmet** : Protection headers HTTP
- **CORS** : Configuration sécurisée
- **Rate Limiting** : Protection DoS (100 req/15min par IP)
- **Validation** : Validation automatique des DTOs
- **RBAC** : Contrôle d'accès basé sur les rôles

## 🚦 CI/CD (GitHub Actions)

Le pipeline CI/CD s'exécute automatiquement sur chaque commit/PR :

### Jobs
1. **Lint & Type Check** : ESLint + TypeScript + Prisma validation
2. **Unit Tests** : 32 tests unitaires avec couverture
3. **E2E Tests** : 95 tests E2E (90.5% succès)
4. **Build Production** : Vérification du build
5. **Docker Build** : Image Docker (uniquement sur main/master)
6. **Security Audit** : npm audit
7. **Summary** : Rapport final

### Badges

```markdown
![CI/CD](https://github.com/your-org/orchestr-a-docker/workflows/CI%2FCD%20Pipeline/badge.svg)
![Tests](https://img.shields.io/badge/tests-95%2F105%20passing-green)
![Coverage](https://img.shields.io/badge/coverage-85%25-green)
```

## 📦 Build Production

### Build local

```bash
npm run build
npm run start:prod
```

### Build Docker

```bash
docker build -t orchestr-a-backend:latest .
docker run -p 3000:3000 --env-file .env orchestr-a-backend:latest
```

## 🗄️ Gestion Base de Données

### Créer une migration

```bash
npx prisma migrate dev --name description_changement
```

### Appliquer les migrations (production)

```bash
npx prisma migrate deploy
```

### Visualiser les données (Prisma Studio)

```bash
npx prisma studio
```

Accès : http://localhost:5555

### Reset complet de la DB

```bash
npx prisma migrate reset
```

## 📈 Statistiques du Backend

### État actuel
- **Modules** : 11
- **Routes API** : 68
- **Tests unitaires** : 32/37 (86.5%)
- **Tests E2E** : 95/105 (90.5%)
- **Couverture** : ~85%
- **Données migrées** : 181 enregistrements
  - 41 utilisateurs
  - 6 projets
  - 104 tâches
  - 30 membres de projets

### Performances
- **Temps de démarrage** : ~3-5 secondes
- **Migration complète** : ~11 secondes
- **Tests E2E** : ~45 secondes
- **Build production** : ~30 secondes

## 🔍 Résolution de Problèmes

### Erreur : "Cannot connect to database"

```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# Vérifier les logs
docker-compose logs postgres

# Redémarrer PostgreSQL
docker-compose restart postgres
```

### Erreur : "Prisma Client not generated"

```bash
npx prisma generate
```

### Erreur : "Redis connection failed"

```bash
docker-compose restart redis
```

### Erreur : "Port 3000 already in use"

```bash
# Trouver le processus
lsof -i :3000

# Tuer le processus
kill -9 <PID>

# Ou changer le port dans .env
PORT=3001
```

## 📚 Ressources

- **API Documentation** : http://localhost:3000/api (Swagger)
- **Prisma Studio** : http://localhost:5555
- **Architecture** : `/ARCHITECTURE-DIAGRAMS.md`
- **Status projet** : `/STATUS.md`
- **Tests guide** : `/GUIDE_TESTS_ET_DEMARRAGE.md`

## 🎯 Checklist Déploiement Production

- [ ] Variables d'environnement sécurisées
- [ ] Secrets JWT générés aléatoirement
- [ ] PostgreSQL sauvegardé régulièrement
- [ ] HTTPS activé (reverse proxy)
- [ ] Rate limiting configuré
- [ ] Logs centralisés
- [ ] Monitoring actif (Prometheus/Grafana)
- [ ] Alertes configurées
- [ ] Documentation API à jour
- [ ] Tests passant à 100%
- [ ] CI/CD pipeline validé

## 📞 Support

Pour toute question ou problème :
1. Consulter la documentation Swagger
2. Vérifier les logs : `docker-compose logs -f backend`
3. Vérifier les issues GitHub
4. Consulter `/STATUS.md` pour l'état du projet

---

**Dernière mise à jour** : 13 octobre 2025
**Version Backend** : 1.0.0
**NestJS** : 10.x
**Node.js** : 20.x
