# 🏗️ Guide Infrastructure - Orchestr'A

> Documentation complète de l'infrastructure Docker pour Orchestr'A

**Version**: 2.0.0
**Dernière mise à jour**: 2025-10-15
**Audience**: DevOps, SysAdmin, Développeurs

---

## 📑 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Services](#services)
4. [Déploiement Local](#déploiement-local)
5. [Configuration](#configuration)
6. [Healthchecks](#healthchecks)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Production](#production)

---

## Vue d'ensemble

### Stack Technique

```
┌─────────────────────────────────────────────────────────┐
│                     Orchestr'A Stack                     │
├─────────────────────────────────────────────────────────┤
│  Frontend:  React 18 + TypeScript + Redux + MUI         │
│  Backend:   NestJS 10 + Prisma + PostgreSQL             │
│  Cache:     Redis 7                                      │
│  Storage:   MinIO (S3-compatible)                        │
│  Database:  PostgreSQL 16                                │
│  Container: Docker + Docker Compose                      │
└─────────────────────────────────────────────────────────┘
```

### Fichiers Docker

| Fichier | Description |
|---------|-------------|
| `docker-compose.full.yml` | Stack complète (production locale) |
| `docker-compose.dev.yml` | Développement (services uniquement) |
| `docker-compose.simple.yml` | Setup minimal |
| `backend/Dockerfile` | Image backend NestJS |
| `orchestra-app/Dockerfile` | Image frontend React + Nginx |

---

## Architecture

### Schéma des Services

```
                    ┌──────────────┐
                    │   Internet   │
                    └───────┬──────┘
                            │
                    ┌───────▼──────┐
                    │   Frontend   │
                    │ React + Nginx│
                    │  Port: 3001  │
                    └───────┬──────┘
                            │
                    ┌───────▼──────┐
                    │   Backend    │
                    │    NestJS    │
                    │  Port: 4000  │
                    └───┬───┬───┬──┘
                        │   │   │
        ┌───────────────┘   │   └───────────────┐
        │                   │                   │
┌───────▼──────┐   ┌────────▼────────┐   ┌─────▼─────┐
│  PostgreSQL  │   │     Redis       │   │   MinIO   │
│  Port: 5432  │   │   Port: 6379    │   │ Port: 9000│
└──────────────┘   └─────────────────┘   └───────────┘
```

### Réseau Docker

**Network**: `orchestr-a-network` (bridge)

Tous les services communiquent via ce réseau interne. Les ports sont exposés sur l'hôte uniquement pour le développement.

### Volumes Persistants

```yaml
volumes:
  postgres-data:  # Données PostgreSQL
    driver: local
  redis-data:     # Données Redis
    driver: local
  minio-data:     # Fichiers MinIO
    driver: local
```

---

## Services

### 1. PostgreSQL 16

**Image**: `postgres:16-alpine`
**Container**: `orchestr-a-postgres`
**Port**: 5432

#### Configuration
```yaml
environment:
  POSTGRES_DB: orchestra_dev
  POSTGRES_USER: dev
  POSTGRES_PASSWORD: devpassword
```

#### Healthcheck
```bash
pg_isready -U dev -d orchestra_dev
# Interval: 10s, Timeout: 5s, Retries: 5
```

#### Connexion
```bash
# CLI
psql -h localhost -U dev -d orchestra_dev

# Connection string
postgresql://dev:devpassword@localhost:5432/orchestra_dev
```

#### Commandes Utiles
```bash
# Backup
docker exec orchestr-a-postgres pg_dump -U dev orchestra_dev > backup.sql

# Restore
docker exec -i orchestr-a-postgres psql -U dev orchestra_dev < backup.sql

# Logs
docker logs orchestr-a-postgres -f

# Shell PostgreSQL
docker exec -it orchestr-a-postgres psql -U dev -d orchestra_dev
```

---

### 2. Redis 7

**Image**: `redis:7-alpine`
**Container**: `orchestr-a-redis`
**Port**: 6379

#### Configuration
```yaml
volumes:
  - redis-data:/data
command: redis-server --appendonly yes
```

#### Healthcheck
```bash
redis-cli ping
# Interval: 10s, Timeout: 3s, Retries: 5
```

#### Connexion
```bash
# CLI
redis-cli -h localhost -p 6379

# Test connexion
redis-cli ping
# PONG
```

#### Commandes Utiles
```bash
# Voir toutes les clés
redis-cli KEYS '*'

# Voir la mémoire utilisée
redis-cli INFO memory

# Monitor en temps réel
redis-cli MONITOR

# Flush toutes les données (DEV ONLY!)
redis-cli FLUSHALL
```

#### Utilisation dans l'application
```typescript
// Cache des sessions utilisateurs
// Cache des requêtes fréquentes
// Rate limiting
// Job queues (BullMQ)
```

---

### 3. MinIO (S3-compatible)

**Image**: `minio/minio:latest`
**Container**: `orchestr-a-minio`
**Ports**:
- 9000 (API S3)
- 9001 (Console Web)

#### Configuration
```yaml
environment:
  MINIO_ROOT_USER: devuser
  MINIO_ROOT_PASSWORD: devpassword
command: server /data --console-address ":9001"
```

#### Healthcheck
```bash
curl -f http://localhost:9000/minio/health/live
# Interval: 30s, Timeout: 10s, Retries: 3
```

#### Accès Console Web
```
URL: http://localhost:9001
User: devuser
Password: devpassword
```

#### Buckets par défaut
```
- orchestra-documents  # Documents projets
- orchestra-avatars    # Photos profils
- orchestra-exports    # Exports/rapports
```

#### Commandes Utiles (mc client)
```bash
# Installer MinIO Client
brew install minio/stable/mc  # macOS
apt install minio-client      # Linux

# Configurer alias
mc alias set local http://localhost:9000 devuser devpassword

# Lister buckets
mc ls local

# Créer bucket
mc mb local/orchestra-test

# Upload fichier
mc cp file.pdf local/orchestra-documents/

# Download fichier
mc cp local/orchestra-documents/file.pdf ./
```

---

### 4. Backend NestJS

**Image**: Custom (build depuis `backend/Dockerfile`)
**Container**: `orchestr-a-backend`
**Port**: 4000

#### Configuration
```yaml
environment:
  DATABASE_URL: postgresql://dev:devpassword@postgres:5432/orchestra_dev
  JWT_SECRET: dev-secret-key-change-in-production
  JWT_EXPIRES_IN: 24h
  NODE_ENV: production
  PORT: 4000
  CORS_ORIGIN: http://localhost:3001
  REDIS_HOST: redis
  REDIS_PORT: 6379
  MINIO_ENDPOINT: minio
  MINIO_PORT: 9000
  MINIO_USE_SSL: false
  MINIO_ACCESS_KEY: devuser
  MINIO_SECRET_KEY: devpassword
```

#### Healthcheck
```bash
wget --quiet --tries=1 --spider http://localhost:4000/api/health
# Interval: 30s, Timeout: 10s, Retries: 3, Start period: 40s
```

#### Endpoints principaux
```
GET  /api/health        # Healthcheck
GET  /api/docs          # Swagger documentation
GET  /api               # API info
POST /api/auth/login    # Login
POST /api/auth/refresh  # Refresh token
```

#### Commandes Utiles
```bash
# Logs
docker logs orchestr-a-backend -f

# Shell dans container
docker exec -it orchestr-a-backend sh

# Run migrations
docker exec orchestr-a-backend npx prisma migrate deploy

# Reset database (DEV ONLY!)
docker exec orchestr-a-backend npx prisma migrate reset --force

# Prisma Studio (DB GUI)
docker exec -it orchestr-a-backend npx prisma studio
```

#### Dockerfile Optimisations

**Multi-stage build** :
1. **Stage Builder** : Compilation TypeScript
2. **Stage Production** : Image finale légère

**Sécurité** :
- Utilisateur non-root (`nestjs:nodejs`)
- Pas de dépendances dev en production
- Healthcheck intégré

**Performance** :
- Cache npm optimisé (`--prefer-offline --no-audit`)
- Suppression des tests (`*.spec.ts`, `*.test.ts`)
- Clean node_modules dev

---

### 5. Frontend React

**Image**: Custom (build depuis `orchestra-app/Dockerfile`)
**Container**: `orchestr-a-frontend`
**Port**: 3001 (expose 80 en interne)

#### Configuration
```yaml
build:
  args:
    REACT_APP_API_URL: http://localhost:4000/api
    # Firebase args (pour services non migrés)
```

#### Nginx Configuration

**Gzip compression** :
- Niveau 6
- Types: text, css, js, json, xml, svg
- Min size: 1024 bytes

**Cache Policy** :
```nginx
# HTML: No cache
Cache-Control: no-cache, no-store, must-revalidate

# Assets (js/css avec hash): 1 an
Cache-Control: public, immutable
Expires: 1y

# Service Worker: No cache
Cache-Control: no-cache
```

**Security Headers** :
```nginx
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

#### Commandes Utiles
```bash
# Logs Nginx
docker logs orchestr-a-frontend -f

# Shell dans container
docker exec -it orchestr-a-frontend sh

# Vérifier config Nginx
docker exec orchestr-a-frontend nginx -t

# Reload Nginx
docker exec orchestr-a-frontend nginx -s reload
```

---

## Déploiement Local

### Quick Start

```bash
# 1. Cloner le repo
git clone <repository>
cd orchestr-a-docker

# 2. Lancer tout
./start.sh

# 3. Accéder à l'application
open http://localhost:3001
```

### Options du script start.sh

```bash
./start.sh              # Démarrage normal
./start.sh --rebuild    # Rebuild images (après modif Docker)
./start.sh --logs       # Démarrage + suivi logs
./start.sh --stop       # Arrêter tous les services
./start.sh --help       # Aide
```

### Commandes Docker Compose

```bash
# Démarrer (mode détaché)
docker compose -f docker-compose.full.yml up -d

# Démarrer (mode interactif avec logs)
docker compose -f docker-compose.full.yml up

# Rebuild + démarrer
docker compose -f docker-compose.full.yml up --build

# Rebuild sans cache
docker compose -f docker-compose.full.yml build --no-cache

# Arrêter
docker compose -f docker-compose.full.yml down

# Arrêter + supprimer volumes (⚠️ perte données!)
docker compose -f docker-compose.full.yml down -v

# Voir l'état
docker compose -f docker-compose.full.yml ps

# Logs tous services
docker compose -f docker-compose.full.yml logs -f

# Logs d'un service
docker compose -f docker-compose.full.yml logs -f backend

# Restart un service
docker compose -f docker-compose.full.yml restart backend
```

---

## Configuration

### Variables d'environnement

#### Backend (.env ou docker-compose)

```bash
# Database
DATABASE_URL=postgresql://dev:devpassword@postgres:5432/orchestra_dev

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Application
NODE_ENV=production
PORT=4000
CORS_ORIGIN=http://localhost:3001

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=devuser
MINIO_SECRET_KEY=devpassword
```

#### Frontend (.env)

```bash
# API
REACT_APP_API_URL=http://localhost:4000/api

# Firebase (services non migrés)
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
```

### Ports utilisés

| Service | Port Host | Port Container |
|---------|-----------|----------------|
| Frontend | 3001 | 80 |
| Backend | 4000 | 4000 |
| PostgreSQL | 5432 | 5432 |
| Redis | 6379 | 6379 |
| MinIO API | 9000 | 9000 |
| MinIO Console | 9001 | 9001 |

---

## Healthchecks

### Vérifier tous les healthchecks

```bash
# Docker Compose
docker compose -f docker-compose.full.yml ps

# Format:
# NAME                  STATUS
# orchestr-a-postgres   Up (healthy)
# orchestr-a-redis      Up (healthy)
# orchestr-a-minio      Up (healthy)
# orchestr-a-backend    Up (healthy)
# orchestr-a-frontend   Up
```

### Tests manuels

```bash
# PostgreSQL
docker exec orchestr-a-postgres pg_isready -U dev

# Redis
docker exec orchestr-a-redis redis-cli ping

# MinIO
curl http://localhost:9000/minio/health/live

# Backend
curl http://localhost:4000/api/health

# Frontend
curl http://localhost:3001/health
```

### Endpoints Healthcheck API

```bash
# Backend health
GET /api/health
Response: { "status": "ok", "timestamp": "..." }

# Backend + Database
GET /api/health/db
Response: { "status": "ok", "database": "connected" }
```

---

## Monitoring

### Logs en temps réel

```bash
# Tous les services
docker compose -f docker-compose.full.yml logs -f

# Backend uniquement
docker compose -f docker-compose.full.yml logs -f backend

# PostgreSQL
docker compose -f docker-compose.full.yml logs -f postgres

# Avec filtre
docker compose -f docker-compose.full.yml logs -f | grep ERROR
```

### Métriques Docker

```bash
# Stats en temps réel (CPU, RAM, Network)
docker stats

# Stats d'un service
docker stats orchestr-a-backend

# Disk usage
docker system df

# Détails volumes
docker volume ls
docker volume inspect orchestr-a-docker_postgres-data
```

### Monitoring PostgreSQL

```bash
# Connexions actives
docker exec orchestr-a-postgres psql -U dev -d orchestra_dev -c "SELECT * FROM pg_stat_activity;"

# Taille base de données
docker exec orchestr-a-postgres psql -U dev -d orchestra_dev -c "SELECT pg_size_pretty(pg_database_size('orchestra_dev'));"

# Taille tables
docker exec orchestr-a-postgres psql -U dev -d orchestra_dev -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

### Monitoring Redis

```bash
# Stats
docker exec orchestr-a-redis redis-cli INFO stats

# Mémoire
docker exec orchestr-a-redis redis-cli INFO memory

# Clients connectés
docker exec orchestr-a-redis redis-cli CLIENT LIST

# Monitoring temps réel
docker exec orchestr-a-redis redis-cli MONITOR
```

---

## Troubleshooting

### Services ne démarrent pas

```bash
# 1. Vérifier les logs
docker compose -f docker-compose.full.yml logs

# 2. Vérifier l'état
docker compose -f docker-compose.full.yml ps

# 3. Vérifier les ports
sudo lsof -i :4000  # Port déjà utilisé?
sudo lsof -i :3001
sudo lsof -i :5432

# 4. Clean restart
docker compose -f docker-compose.full.yml down
docker compose -f docker-compose.full.yml up -d
```

### Backend crash au démarrage

```bash
# Logs détaillés
docker logs orchestr-a-backend

# Erreurs communes:
# - DATABASE_URL incorrect
# - Migrations non appliquées
# - PostgreSQL pas ready

# Solutions:
# 1. Vérifier DATABASE_URL
docker exec orchestr-a-backend env | grep DATABASE_URL

# 2. Run migrations manuellement
docker exec orchestr-a-backend npx prisma migrate deploy

# 3. Rebuild backend
docker compose -f docker-compose.full.yml build --no-cache backend
docker compose -f docker-compose.full.yml up -d backend
```

### Problèmes de cache Docker

```bash
# Rebuild sans cache
docker compose -f docker-compose.full.yml build --no-cache

# Nettoyer images inutilisées
docker image prune -a

# Reset complet Docker (⚠️ perte TOUTES données!)
docker system prune -a --volumes
```

### Erreurs "Connection refused"

```bash
# Frontend → Backend
# Vérifier REACT_APP_API_URL
docker exec orchestr-a-frontend env | grep REACT_APP_API_URL

# Backend → PostgreSQL
# Vérifier DATABASE_URL et que postgres est healthy
docker exec orchestr-a-backend env | grep DATABASE_URL
docker compose -f docker-compose.full.yml ps postgres

# Backend → Redis
docker compose -f docker-compose.full.yml ps redis
docker exec orchestr-a-backend nc -zv redis 6379
```

### Performance dégradée

```bash
# 1. Vérifier ressources
docker stats

# 2. Limiter ressources si besoin (docker-compose)
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

# 3. Nettoyer logs
docker compose -f docker-compose.full.yml logs --tail=100

# 4. Restart services
docker compose -f docker-compose.full.yml restart
```

---

## Production

### Différences Dev vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Ports | Exposés sur host | Derrière reverse proxy |
| Secrets | Hardcodés | Variables env/secrets |
| SSL/TLS | Non | Oui (Nginx/Traefik) |
| Volumes | Local | Volumes/NFS distants |
| Logs | Console | Centralisés (ELK/Loki) |
| Healthchecks | Optionnels | Obligatoires |
| Backups | Non | Automatisés |

### Checklist Production

#### 1. Secrets
```bash
# ❌ Ne JAMAIS commit en production:
- Mots de passe hardcodés
- JWT_SECRET par défaut
- API keys Firebase

# ✅ Utiliser:
- Variables d'environnement
- Docker secrets
- Vault / AWS Secrets Manager
```

#### 2. Database
```bash
# Backups automatisés
# Réplication / HA
# Connection pooling
# Monitoring
```

#### 3. Redis
```bash
# Persistence (AOF + RDB)
# Redis Sentinel (HA)
# Monitoring memory usage
```

#### 4. MinIO
```bash
# Multi-tenancy
# Buckets policies
# Lifecycle rules
# Backups
```

#### 5. Nginx/Reverse Proxy
```bash
# SSL/TLS (Let's Encrypt)
# Rate limiting
# WAF (Web Application Firewall)
# Load balancing
```

### Déploiement Cloud

#### Docker Swarm
```bash
docker stack deploy -c docker-compose.prod.yml orchestr-a
```

#### Kubernetes (exemple)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orchestr-a-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: orchestr-a-backend:2.0.0
        ports:
        - containerPort: 4000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

#### AWS ECS/Fargate
- Task definitions depuis docker-compose
- RDS pour PostgreSQL
- ElastiCache pour Redis
- S3 pour storage (au lieu de MinIO)

---

## Références

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Specification](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [Nginx Docker Hub](https://hub.docker.com/_/nginx)

---

**Version**: 2.0.0
**Dernière mise à jour**: 2025-10-15
**Auteur**: Orchestr'A Team
