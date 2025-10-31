# 🚀 GUIDE DE DÉPLOIEMENT PRODUCTION - ORCHESTR'A

> **Version** : 1.0.0
> **Date** : 17 octobre 2025
> **Projet** : Orchestr'A - Migration Docker complète
> **Status** : Production Ready ✅

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Architecture Production](#architecture-production)
4. [Installation Infrastructure](#installation-infrastructure)
5. [Configuration Serveur](#configuration-serveur)
6. [Déploiement Backend](#déploiement-backend)
7. [Déploiement Frontend](#déploiement-frontend)
8. [Configuration Base de Données](#configuration-base-de-données)
9. [Sécurité](#sécurité)
10. [Monitoring & Logs](#monitoring--logs)
11. [Backup & Recovery](#backup--recovery)
12. [CI/CD Pipeline](#cicd-pipeline)
13. [Maintenance](#maintenance)
14. [Troubleshooting](#troubleshooting)

---

## 🎯 VUE D'ENSEMBLE

### Objectifs du Déploiement

- ✅ Infrastructure self-hosted 100% autonome
- ✅ Haute disponibilité et performance
- ✅ Sécurité production (HTTPS, SSL, JWT)
- ✅ Monitoring et alertes
- ✅ Backups automatisés
- ✅ CI/CD automatisé

### Architecture Cible

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNET                             │
└──────────────────────┬──────────────────────────────────┘
                       │
                  ┌────▼────┐
                  │  Nginx  │  Reverse Proxy + SSL
                  │  Port   │  orchestr-a.domain.com
                  │  80/443 │
                  └────┬────┘
                       │
        ┏━━━━━━━━━━━━━┻━━━━━━━━━━━━━┓
        ┃                            ┃
   ┌────▼────┐              ┌────────▼────────┐
   │Frontend │              │    Backend      │
   │React App│              │   NestJS API    │
   │Port 3001│              │   Port 4000     │
   └─────────┘              └────────┬────────┘
                                     │
              ┏━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━┓
              ┃                      ┃                     ┃
        ┌─────▼─────┐      ┌────────▼────────┐   ┌───────▼──────┐
        │PostgreSQL │      │      Redis      │   │    MinIO     │
        │  Port     │      │   Cache Store   │   │  S3 Storage  │
        │  5432     │      │   Port 6379     │   │  Port 9000   │
        └───────────┘      └─────────────────┘   └──────────────┘
```

---

## ⚙️ PRÉREQUIS

### Serveur VPS

**Configuration Minimale** :
- **CPU** : 4 cores
- **RAM** : 8 GB
- **Stockage** : 100 GB SSD
- **OS** : Ubuntu 22.04 LTS (recommandé)
- **Bande passante** : 100 Mbps

**Configuration Recommandée** :
- **CPU** : 8 cores
- **RAM** : 16 GB
- **Stockage** : 200 GB SSD NVMe
- **OS** : Ubuntu 24.04 LTS
- **Bande passante** : 1 Gbps

### Domaine

- Domaine enregistré (ex: `orchestr-a.domain.com`)
- Accès DNS pour configuration A/CNAME records
- Certificat SSL (Let's Encrypt gratuit)

### Logiciels Requis

```bash
# Docker & Docker Compose
Docker Engine 24.0+
Docker Compose 2.20+

# Serveur Web
Nginx 1.24+ (reverse proxy)

# Outils
Git 2.40+
Node.js 20.x LTS (pour builds)
```

---

## 🏗️ ARCHITECTURE PRODUCTION

### Stack Technologique

| Composant | Version | Port | Ressources |
|-----------|---------|------|------------|
| **Frontend** | React 18 | 3001 | 512MB RAM |
| **Backend** | NestJS 10 | 4000 | 2GB RAM |
| **PostgreSQL** | 16 Alpine | 5432 | 2GB RAM |
| **Redis** | 7 Alpine | 6379 | 512MB RAM |
| **MinIO** | Latest | 9000/9001 | 1GB RAM |
| **Nginx** | 1.24 | 80/443 | 256MB RAM |

**Total Ressources** : ~6.3GB RAM + CPU

### Containers Docker

```yaml
services:
  - orchestr-a-frontend    # React build servi par Nginx
  - orchestr-a-backend     # NestJS API
  - orchestr-a-postgres    # Base de données
  - orchestr-a-redis       # Cache
  - orchestr-a-minio       # Stockage S3
  - nginx-proxy            # Reverse proxy
```

---

## 📦 INSTALLATION INFRASTRUCTURE

### Étape 1 : Préparer le Serveur

```bash
# Se connecter au VPS
ssh root@your-server-ip

# Mettre à jour le système
apt update && apt upgrade -y

# Installer dépendances
apt install -y \
  git \
  curl \
  vim \
  ufw \
  htop \
  certbot \
  python3-certbot-nginx

# Créer utilisateur déploiement
adduser deployer
usermod -aG sudo deployer
su - deployer
```

### Étape 2 : Installer Docker

```bash
# Télécharger script installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh

# Exécuter installation
sudo sh get-docker.sh

# Ajouter utilisateur au groupe docker
sudo usermod -aG docker $USER

# Activer Docker au démarrage
sudo systemctl enable docker
sudo systemctl start docker

# Vérifier installation
docker --version
docker compose version
```

### Étape 3 : Installer Nginx

```bash
# Installer Nginx
sudo apt install nginx -y

# Démarrer et activer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Vérifier
sudo systemctl status nginx
```

### Étape 4 : Configuration Firewall

```bash
# Autoriser SSH
sudo ufw allow OpenSSH

# Autoriser HTTP/HTTPS
sudo ufw allow 'Nginx Full'

# Activer firewall
sudo ufw enable

# Vérifier règles
sudo ufw status
```

---

## 🔧 CONFIGURATION SERVEUR

### Configuration Nginx

```bash
# Créer configuration site
sudo vim /etc/nginx/sites-available/orchestr-a
```

**Contenu `/etc/nginx/sites-available/orchestr-a`** :

```nginx
# Frontend - React Application
server {
    listen 80;
    listen [::]:80;
    server_name orchestr-a.domain.com;

    # Redirection HTTPS (après SSL)
    # return 301 https://$server_name$request_uri;

    # Frontend static files
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts pour API
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # MinIO Storage (optionnel - si accès direct nécessaire)
    location /storage {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
# Activer site
sudo ln -s /etc/nginx/sites-available/orchestr-a /etc/nginx/sites-enabled/

# Tester configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

### Configuration SSL (Let's Encrypt)

```bash
# Obtenir certificat SSL
sudo certbot --nginx -d orchestr-a.domain.com

# Vérifier renouvellement auto
sudo certbot renew --dry-run

# Certificat renouvelé automatiquement tous les 90 jours
```

**Nginx sera automatiquement configuré pour HTTPS par Certbot.**

---

## 🐳 DÉPLOIEMENT BACKEND

### Étape 1 : Cloner le Repository

```bash
# Cloner projet
cd /home/deployer
git clone https://github.com/your-org/orchestr-a-docker.git
cd orchestr-a-docker

# Créer fichier .env production
cd backend
cp .env.example .env.production
```

### Étape 2 : Configuration Variables d'Environnement

**Fichier `backend/.env.production`** :

```bash
# Node Environment
NODE_ENV=production

# Server
PORT=4000
HOST=0.0.0.0

# Database PostgreSQL
DATABASE_URL="postgresql://prod_user:STRONG_PASSWORD@localhost:5432/orchestra_prod?schema=public"

# JWT Secrets (GÉNÉRER DES SECRETS FORTS)
JWT_SECRET="YOUR_VERY_STRONG_SECRET_256_BITS_MIN"
JWT_REFRESH_SECRET="YOUR_VERY_STRONG_REFRESH_SECRET_256_BITS_MIN"
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# MinIO S3
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=YOUR_MINIO_ACCESS_KEY
MINIO_SECRET_KEY=YOUR_MINIO_SECRET_KEY
MINIO_BUCKET=orchestra-files

# CORS
CORS_ORIGIN=https://orchestr-a.domain.com

# Email (si notifications email)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@domain.com
SMTP_PASSWORD=YOUR_SMTP_PASSWORD

# Logging
LOG_LEVEL=info
```

**Générer secrets forts** :

```bash
# Générer JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ou avec OpenSSL
openssl rand -hex 64
```

### Étape 3 : Docker Compose Production

**Fichier `backend/docker-compose.production.yml`** :

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: orchestr-a-postgres
    restart: always
    environment:
      POSTGRES_USER: prod_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: orchestra_prod
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U prod_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: orchestr-a-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: orchestr-a-minio
    restart: always
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile.production
    container_name: orchestr-a-backend
    restart: always
    env_file:
      - .env.production
    ports:
      - "4000:4000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  minio_data:
    driver: local
```

### Étape 4 : Dockerfile Production

**Fichier `backend/Dockerfile.production`** :

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copier package files
COPY package*.json ./
COPY prisma ./prisma/

# Installer dépendances
RUN npm ci --only=production && npm cache clean --force

# Copier source code
COPY . .

# Générer Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Installer dumb-init (meilleure gestion processus)
RUN apk add --no-cache dumb-init

# Copier node_modules et build depuis builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Créer utilisateur non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

# Exposer port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Lancer application avec dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
```

### Étape 5 : Démarrer Backend

```bash
# Charger variables d'environnement
export $(cat .env.production | xargs)

# Construire images
docker compose -f docker-compose.production.yml build

# Démarrer services
docker compose -f docker-compose.production.yml up -d

# Vérifier containers
docker compose -f docker-compose.production.yml ps

# Consulter logs
docker compose -f docker-compose.production.yml logs -f backend
```

### Étape 6 : Migrations Base de Données

```bash
# Appliquer migrations Prisma
docker compose -f docker-compose.production.yml exec backend npx prisma migrate deploy

# Vérifier base de données
docker compose -f docker-compose.production.yml exec backend npx prisma db push
```

---

## 🎨 DÉPLOIEMENT FRONTEND

### Étape 1 : Configuration Frontend

```bash
cd /home/deployer/orchestr-a-docker/orchestra-app
cp .env.example .env.production
```

**Fichier `orchestra-app/.env.production`** :

```bash
# API Backend URL
REACT_APP_API_URL=https://orchestr-a.domain.com/api

# Environment
REACT_APP_ENV=production

# Firebase (si encore utilisé pour certaines features)
# REACT_APP_FIREBASE_API_KEY=...
# REACT_APP_FIREBASE_AUTH_DOMAIN=...
```

### Étape 2 : Build Production

```bash
# Installer dépendances
npm ci

# Build production
npm run build

# Le dossier build/ contient les fichiers statiques
```

### Étape 3 : Docker Frontend (Option 1 - Recommandé)

**Fichier `orchestra-app/Dockerfile.production`** :

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production avec Nginx
FROM nginx:alpine

# Copier build
COPY --from=builder /app/build /usr/share/nginx/html

# Configuration Nginx pour React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3001

CMD ["nginx", "-g", "daemon off;"]
```

**Fichier `orchestra-app/nginx.conf`** :

```nginx
server {
    listen 3001;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Ajouter au `docker-compose.production.yml`** :

```yaml
  frontend:
    build:
      context: ../orchestra-app
      dockerfile: Dockerfile.production
    container_name: orchestr-a-frontend
    restart: always
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001"]
      interval: 30s
      timeout: 10s
      retries: 3
```

```bash
# Build et démarrer frontend
docker compose -f docker-compose.production.yml up -d --build frontend
```

### Étape 4 : Déploiement Direct (Option 2 - Alternative)

```bash
# Copier build vers /var/www
sudo mkdir -p /var/www/orchestr-a
sudo cp -r build/* /var/www/orchestr-a/

# Permissions
sudo chown -R www-data:www-data /var/www/orchestr-a
```

**Nginx config** :

```nginx
server {
    listen 3001;
    root /var/www/orchestr-a;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🗄️ CONFIGURATION BASE DE DONNÉES

### Backup Automatique PostgreSQL

```bash
# Créer script backup
sudo vim /usr/local/bin/backup-postgres.sh
```

**Script `/usr/local/bin/backup-postgres.sh`** :

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="orchestra_prod_${DATE}.sql.gz"
RETENTION_DAYS=30

# Créer répertoire si inexistant
mkdir -p $BACKUP_DIR

# Backup
docker exec orchestr-a-postgres pg_dump -U prod_user orchestra_prod | gzip > ${BACKUP_DIR}/${BACKUP_FILE}

# Nettoyer anciens backups
find $BACKUP_DIR -name "orchestra_prod_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: ${BACKUP_FILE}"
```

```bash
# Rendre exécutable
sudo chmod +x /usr/local/bin/backup-postgres.sh

# Tester backup
sudo /usr/local/bin/backup-postgres.sh
```

### Cron Job Backup Quotidien

```bash
# Éditer crontab
sudo crontab -e

# Ajouter ligne (backup tous les jours à 2h du matin)
0 2 * * * /usr/local/bin/backup-postgres.sh >> /var/log/postgres-backup.log 2>&1
```

### Restauration Backup

```bash
# Restaurer depuis backup
gunzip -c /backups/postgresql/orchestra_prod_20251017.sql.gz | \
  docker exec -i orchestr-a-postgres psql -U prod_user -d orchestra_prod
```

---

## 🔒 SÉCURITÉ

### 1. Secrets Management

```bash
# NE JAMAIS commiter .env.production dans Git
echo ".env.production" >> .gitignore

# Utiliser des secrets forts (minimum 32 caractères)
# Stocker secrets dans un gestionnaire sécurisé (Vault, AWS Secrets Manager)
```

### 2. Firewall Configuration

```bash
# Bloquer ports inutiles
sudo ufw deny 5432  # PostgreSQL (accès via Docker uniquement)
sudo ufw deny 6379  # Redis
sudo ufw deny 9000  # MinIO
sudo ufw deny 9001  # MinIO Console

# Autoriser uniquement HTTP/HTTPS/SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 3. Docker Security

```bash
# Ne pas exposer ports sensibles publiquement
# Dans docker-compose.production.yml, utiliser :
ports:
  - "127.0.0.1:5432:5432"  # PostgreSQL accessible uniquement localhost
  - "127.0.0.1:6379:6379"  # Redis accessible uniquement localhost
```

### 4. SSL/TLS

- ✅ Certificat Let's Encrypt renouvelé automatiquement
- ✅ HTTPS obligatoire (redirection HTTP → HTTPS)
- ✅ TLS 1.2+ minimum

### 5. Rate Limiting

**Nginx rate limiting** :

```nginx
http {
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;

    server {
        location /api {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://localhost:4000;
        }
    }
}
```

---

## 📊 MONITORING & LOGS

### Health Checks

```bash
# Backend health
curl https://orchestr-a.domain.com/api/health

# Frontend health
curl https://orchestr-a.domain.com

# PostgreSQL health
docker exec orchestr-a-postgres pg_isready -U prod_user

# Redis health
docker exec orchestr-a-redis redis-cli ping
```

### Logs Centralisés

```bash
# Logs backend
docker compose -f docker-compose.production.yml logs -f backend

# Logs PostgreSQL
docker compose -f docker-compose.production.yml logs -f postgres

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs système
journalctl -u docker -f
```

### Monitoring avec Uptime Kuma (Optionnel)

```bash
# Installer Uptime Kuma
docker run -d \
  --name uptime-kuma \
  --restart=always \
  -p 3003:3001 \
  -v uptime-kuma:/app/data \
  louislam/uptime-kuma:1

# Accès : http://your-server:3003
```

**Monitors à configurer** :
- Backend API : `https://orchestr-a.domain.com/api/health`
- Frontend : `https://orchestr-a.domain.com`
- PostgreSQL : Check internal
- Redis : Check internal

---

## 💾 BACKUP & RECOVERY

### Stratégie Backup 3-2-1

**3 copies** : Production + Backup local + Backup distant
**2 supports** : Disque local + Cloud storage
**1 copie hors site** : S3, Google Cloud Storage, etc.

### Backup PostgreSQL (déjà configuré)

```bash
# Backup manuel
/usr/local/bin/backup-postgres.sh

# Vérifier backups
ls -lh /backups/postgresql/

# Restaurer
gunzip -c /backups/postgresql/backup.sql.gz | \
  docker exec -i orchestr-a-postgres psql -U prod_user -d orchestra_prod
```

### Backup MinIO (Fichiers)

```bash
# Script backup MinIO
sudo vim /usr/local/bin/backup-minio.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups/minio"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup data directory
tar -czf ${BACKUP_DIR}/minio_${DATE}.tar.gz \
  -C /var/lib/docker/volumes/backend_minio_data/_data .

# Retention 30 jours
find $BACKUP_DIR -name "minio_*.tar.gz" -mtime +30 -delete
```

```bash
sudo chmod +x /usr/local/bin/backup-minio.sh

# Cron job (tous les jours 3h)
0 3 * * * /usr/local/bin/backup-minio.sh >> /var/log/minio-backup.log 2>&1
```

### Disaster Recovery Plan

**En cas de panne complète** :

1. **Restaurer infrastructure Docker**
   ```bash
   cd /home/deployer/orchestr-a-docker/backend
   docker compose -f docker-compose.production.yml up -d
   ```

2. **Restaurer PostgreSQL**
   ```bash
   # Dernier backup
   LAST_BACKUP=$(ls -t /backups/postgresql/*.sql.gz | head -1)
   gunzip -c $LAST_BACKUP | docker exec -i orchestr-a-postgres psql -U prod_user -d orchestra_prod
   ```

3. **Restaurer MinIO**
   ```bash
   LAST_BACKUP=$(ls -t /backups/minio/*.tar.gz | head -1)
   tar -xzf $LAST_BACKUP -C /var/lib/docker/volumes/backend_minio_data/_data
   ```

4. **Vérifier services**
   ```bash
   curl https://orchestr-a.domain.com/api/health
   ```

**RTO (Recovery Time Objective)** : < 1 heure
**RPO (Recovery Point Objective)** : < 24 heures (backup quotidien)

---

## 🔄 CI/CD PIPELINE

### GitHub Actions Workflow

**Fichier `.github/workflows/deploy.yml`** :

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Run tests
        run: |
          cd backend
          npm test

      - name: Lint
        run: |
          cd backend
          npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /home/deployer/orchestr-a-docker
            git pull origin main
            cd backend
            docker compose -f docker-compose.production.yml build
            docker compose -f docker-compose.production.yml up -d
            docker compose -f docker-compose.production.yml exec -T backend npx prisma migrate deploy
```

### Configuration Secrets GitHub

Dans GitHub Repository Settings > Secrets and variables > Actions :

```
VPS_HOST=your-server-ip
VPS_USER=deployer
VPS_SSH_KEY=<contenu de ~/.ssh/id_rsa>
```

---

## 🔧 MAINTENANCE

### Mises à Jour

```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Mise à jour Docker images
cd /home/deployer/orchestr-a-docker/backend
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d

# Nettoyage images inutilisées
docker system prune -af --volumes
```

### Monitoring Disque

```bash
# Vérifier espace disque
df -h

# Nettoyer Docker (si espace faible)
docker system prune -af --volumes

# Nettoyer logs anciens
sudo journalctl --vacuum-time=7d
```

### Rotation Logs

```bash
# Configuration logrotate
sudo vim /etc/logrotate.d/nginx-orchestr-a
```

```
/var/log/nginx/access.log /var/log/nginx/error.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}
```

---

## 🐛 TROUBLESHOOTING

### Backend ne démarre pas

```bash
# Vérifier logs
docker compose -f docker-compose.production.yml logs backend

# Problèmes fréquents :
# - Variables d'environnement manquantes
# - Base de données non accessible
# - Port 4000 déjà utilisé

# Vérifier connexion DB
docker compose exec backend npx prisma db pull
```

### Frontend erreur 502 Bad Gateway

```bash
# Vérifier backend actif
curl http://localhost:4000/api/health

# Vérifier Nginx config
sudo nginx -t
sudo systemctl status nginx

# Recharger Nginx
sudo systemctl reload nginx
```

### PostgreSQL out of memory

```bash
# Vérifier RAM
docker stats

# Augmenter limite RAM dans docker-compose.production.yml
services:
  postgres:
    mem_limit: 4g
```

### MinIO fichiers inaccessibles

```bash
# Vérifier bucket
docker exec orchestr-a-minio mc ls local/

# Recréer bucket
docker exec orchestr-a-minio mc mb local/orchestra-files
docker exec orchestr-a-minio mc anonymous set download local/orchestra-files
```

### Performance dégradée

```bash
# Vérifier ressources
htop
docker stats

# Vérifier logs lents queries PostgreSQL
docker compose exec postgres psql -U prod_user -d orchestra_prod -c "
  SELECT query, mean_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Optimiser index Prisma
docker compose exec backend npx prisma db push
```

---

## 📞 SUPPORT

### Contacts

- **Documentation** : `/home/deployer/orchestr-a-docker/docs/`
- **Logs** : `/var/log/` et Docker logs
- **Backups** : `/backups/`

### Commandes Utiles

```bash
# Status infrastructure
docker compose -f docker-compose.production.yml ps

# Restart service
docker compose -f docker-compose.production.yml restart backend

# Vérifier health
curl -f https://orchestr-a.domain.com/api/health || echo "Backend DOWN"

# Backup manuel urgent
/usr/local/bin/backup-postgres.sh
/usr/local/bin/backup-minio.sh
```

---

## ✅ CHECKLIST DÉPLOIEMENT

### Avant Déploiement

- [ ] VPS provisionné (8GB RAM, 4 CPU, 100GB SSD)
- [ ] Domaine configuré (DNS A record)
- [ ] Docker & Docker Compose installés
- [ ] Nginx installé et configuré
- [ ] SSL Let's Encrypt configuré
- [ ] Firewall UFW activé
- [ ] Variables d'environnement configurées
- [ ] Secrets générés (JWT, Redis, MinIO)
- [ ] Backups configurés
- [ ] Monitoring configuré

### Après Déploiement

- [ ] Backend API accessible (`/api/health`)
- [ ] Frontend accessible (https://domain.com)
- [ ] Base de données opérationnelle
- [ ] MinIO stockage fonctionnel
- [ ] Redis cache actif
- [ ] Logs centralisés configurés
- [ ] Backups testés (restauration)
- [ ] Monitoring actif
- [ ] SSL valide (A+ rating)
- [ ] Performance testée (load testing)
- [ ] Documentation à jour

---

**Version** : 1.0.0
**Dernière mise à jour** : 17 octobre 2025
**Auteur** : Claude Code
**Status** : ✅ Production Ready

🚀 **Orchestr'A est prêt pour la production !**
