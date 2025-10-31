# 🚀 QUICKSTART - HÉBERGEMENT LOCAL ORCHESTR'A

> **Guide rapide de déploiement local**
> **Temps estimé** : 10-15 minutes
> **Niveau** : Débutant
> **Version** : 2.0.0
> **Dernière mise à jour** : 20 octobre 2025

---

## 🎯 OBJECTIF

Démarrer l'application **Orchestr'A** complète sur **votre machine locale** en utilisant **Docker Compose**.

**Pas de VPS, pas de cloud, pas de serveur distant** - Tout fonctionne en localhost.

---

## 📋 PRÉREQUIS

### Logiciels Requis

| Logiciel | Version | Installation |
|----------|---------|--------------|
| **Docker** | 24.0+ | [get.docker.com](https://get.docker.com) |
| **Docker Compose** | 2.20+ | Inclus avec Docker Desktop |
| **Node.js** | 20.x LTS | [nodejs.org](https://nodejs.org) |
| **Git** | 2.40+ | [git-scm.com](https://git-scm.com) |

### Ressources Machine

- **RAM** : 8 GB minimum (16 GB recommandé)
- **CPU** : 4 cores minimum
- **Stockage** : 20 GB libres
- **OS** : Linux, macOS, Windows (avec WSL2)

---

## ⚡ DÉMARRAGE RAPIDE (10 MINUTES)

### Étape 1 : Cloner le Projet (1 min)

```bash
# Cloner le repository
git clone https://github.com/votre-org/orchestr-a-docker.git
cd orchestr-a-docker
```

### Étape 2 : Démarrer Infrastructure Docker (3 min)

```bash
# Aller dans le dossier backend
cd backend

# Démarrer PostgreSQL, Redis, MinIO
docker-compose up -d

# Vérifier que tout est healthy (attendre 10-20 secondes)
docker-compose ps
```

**Attendu** : 3 containers avec status **"healthy"**
```
NAME                      STATUS
orchestr-a-postgres-dev   Up 20 seconds (healthy)
orchestr-a-redis-dev      Up 20 seconds (healthy)
orchestr-a-minio-dev      Up 20 seconds (healthy)
```

### Étape 3 : Démarrer Backend (3 min)

```bash
# Installer dépendances (première fois uniquement)
npm install

# Démarrer backend NestJS
npm start

# Attendre ~10 secondes, puis vérifier
curl http://localhost:4000/api/health
```

**Attendu** : `{"status":"ok","uptime":...}`

### Étape 4 : Démarrer Frontend (3 min)

```bash
# Dans un NOUVEAU terminal
cd orchestra-app

# Installer dépendances (première fois uniquement)
npm install

# Démarrer React en mode dev
PORT=3001 npm start
```

**Attendu** : `Compiled successfully!` après ~30 secondes

### Étape 5 : Accéder à l'Application

Ouvrez votre navigateur : **http://localhost:3001**

**Page de login** doit s'afficher ✅

---

## 👤 CRÉER PREMIER UTILISATEUR ADMIN

### Méthode 1 : Via API REST (Recommandé)

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@orchestr-a.local",
    "password": "Admin1234!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

**Attendu** : Réponse JSON avec `id`, `email`, `role: "ADMIN"`

### Méthode 2 : Via Interface Web

1. Ouvrir **http://localhost:3001**
2. Cliquer sur "S'inscrire" ou "Créer un compte"
3. Remplir le formulaire
4. Se connecter avec les identifiants créés

---

## ✅ VÉRIFICATION COMPLÈTE

### 1. Infrastructure Docker

```bash
cd backend
docker-compose ps
```

**Attendu** : 3 containers **"healthy"**

### 2. Backend API

```bash
# Health check
curl http://localhost:4000/api/health

# Documentation Swagger
open http://localhost:4000/api/docs
```

**Attendu** :
- Health check : `{"status":"ok"}`
- Swagger UI : Interface de documentation API

### 3. Frontend React

```bash
# Vérifier compilation
# Dans le terminal du frontend, vérifier absence d'erreurs critiques
```

**Attendu** :
- `Compiled successfully!` ou `Compiled with warnings`
- Warnings TypeScript (~45) sont **normaux** (migration en cours)

### 4. Base de Données

```bash
# Vérifier tables PostgreSQL
docker exec orchestr-a-postgres-dev psql -U dev -d orchestra_dev -c "\dt" | wc -l
```

**Attendu** : ~40-42 lignes (38 tables + headers)

### 5. Connexion Frontend ↔ Backend

1. Ouvrir http://localhost:3001
2. Se connecter avec admin créé
3. Vérifier Dashboard s'affiche
4. Ouvrir Console développeur (F12) → onglet Network
5. Vérifier requêtes vers `http://localhost:4000/api/*`

**Attendu** : Requêtes API avec status **200 OK**

---

## 🔧 COMMANDES UTILES

### Gestion Containers Docker

```bash
# Démarrer infrastructure
cd backend
docker-compose up -d

# Arrêter infrastructure
docker-compose down

# Voir logs d'un service
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f minio

# Vérifier status
docker-compose ps

# Restart un service
docker-compose restart postgres
```

### Backend NestJS

```bash
cd backend

# Démarrer
npm start

# Démarrer en mode watch (redémarre auto sur changement)
npm run start:dev

# Voir logs
# (Logs affichés directement dans le terminal)

# Arrêter
Ctrl+C
```

### Frontend React

```bash
cd orchestra-app

# Démarrer
PORT=3001 npm start

# Build production (optionnel)
npm run build

# Arrêter
Ctrl+C
```

### Base de Données

```bash
# Accéder à PostgreSQL
docker exec -it orchestr-a-postgres-dev psql -U dev -d orchestra_dev

# Lister tables
docker exec orchestr-a-postgres-dev psql -U dev -d orchestra_dev -c "\dt"

# Prisma Studio (interface graphique)
cd backend
npx prisma studio
# Ouvrir http://localhost:5555
```

---

## 🐛 TROUBLESHOOTING

### Problème 1 : Container PostgreSQL ne démarre pas

**Symptômes** : `docker-compose ps` montre postgres "unhealthy" ou "restarting"

**Solution** :
```bash
# Vérifier logs
docker-compose logs postgres

# Si port 5432 déjà utilisé, stopper le processus concurrent
sudo lsof -i :5432
sudo kill -9 <PID>

# Restart
docker-compose restart postgres
```

---

### Problème 2 : Backend erreur "Cannot connect to database"

**Symptômes** : Backend crash au démarrage avec erreur connexion DB

**Solution** :
```bash
# 1. Vérifier PostgreSQL est healthy
docker-compose ps postgres

# 2. Attendre 10-20 secondes que PostgreSQL soit prêt
sleep 20

# 3. Redémarrer backend
npm start
```

---

### Problème 3 : Frontend erreur "Network Error" ou "Failed to fetch"

**Symptômes** : Frontend ne peut pas se connecter au backend

**Solution** :
```bash
# 1. Vérifier backend est démarré
curl http://localhost:4000/api/health

# 2. Si backend down, le démarrer
cd backend
npm start

# 3. Vérifier REACT_APP_API_URL dans orchestra-app/.env
# Doit être : REACT_APP_API_URL=http://localhost:4000/api
```

---

### Problème 4 : Port déjà utilisé

**Symptômes** : Erreur "Port 4000 already in use" ou "Port 3001 already in use"

**Solution** :
```bash
# Trouver processus utilisant le port
sudo lsof -i :4000  # Backend
sudo lsof -i :3001  # Frontend

# Tuer le processus
sudo kill -9 <PID>

# Ou changer le port
PORT=4001 npm start  # Backend
PORT=3002 npm start  # Frontend
```

---

### Problème 5 : "Error: ENOSPC: System limit for number of file watchers"

**Symptômes** : Erreur lors `npm start` (Linux uniquement)

**Solution** :
```bash
# Augmenter limite file watchers
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

### Problème 6 : Warnings TypeScript (~45 warnings)

**Symptômes** : Nombreux warnings lors compilation frontend

**Note** : ✅ **C'EST NORMAL !**

Ces warnings sont liés à la migration Firebase → REST en cours et **n'empêchent pas le fonctionnement**.

Types de warnings attendus :
- Incompatibilités de types entre API et composants
- Props manquantes dans certains composants
- Enums non alignés

**L'application fonctionne correctement malgré ces warnings.**

---

### Problème 7 : Docker Desktop ne démarre pas (Windows)

**Symptômes** : "Docker daemon not running"

**Solution** :
```powershell
# 1. Activer WSL2
wsl --install

# 2. Activer virtualisation dans BIOS
# (Redémarrer PC → BIOS → Activer VT-x/AMD-V)

# 3. Restart Docker Desktop
```

---

## 📊 MÉTRIQUES NORMALES

### Usage Ressources

```bash
docker stats --no-stream
```

**Attendu** :
- **PostgreSQL** : 50-200 MB RAM
- **Redis** : 10-50 MB RAM
- **MinIO** : 50-100 MB RAM
- **Total Docker** : 150-500 MB RAM

**Backend NestJS** : 200-500 MB RAM
**Frontend React** : 500-800 MB RAM (dev mode)

**TOTAL** : ~1-2 GB RAM utilisés

### Temps de Réponse

```bash
# Temps réponse API
time curl http://localhost:4000/api/health
```

**Attendu** : < 100ms (latence locale)

---

## 🔄 ARRÊT ET REDÉMARRAGE

### Arrêt Complet

```bash
# 1. Arrêter frontend (Ctrl+C dans terminal frontend)
# 2. Arrêter backend (Ctrl+C dans terminal backend)

# 3. Arrêter Docker containers
cd backend
docker-compose down
```

### Redémarrage Complet

```bash
# 1. Démarrer Docker
cd backend
docker-compose up -d

# 2. Démarrer backend
npm start

# 3. Démarrer frontend (nouveau terminal)
cd orchestra-app
PORT=3001 npm start
```

---

## 📚 RESSOURCES

- **Documentation Complète** : [STATUS.md](./STATUS.md)
- **Guide Détaillé Local** : [LOCAL-DEPLOYMENT-GUIDE.md](./LOCAL-DEPLOYMENT-GUIDE.md)
- **Index Documentation** : [DOCUMENTATION-INDEX.md](./DOCUMENTATION-INDEX.md)
- **Guide Claude** : [CLAUDE.md](./CLAUDE.md)

---

## ✅ CHECKLIST FINALE

### Infrastructure
- [ ] Docker installé et fonctionnel
- [ ] Docker Compose disponible (`docker-compose --version`)
- [ ] 3 containers Docker healthy (postgres, redis, minio)
- [ ] PostgreSQL accessible (port 5432)
- [ ] Redis accessible (port 6379)
- [ ] MinIO accessible (ports 9000-9001)

### Application
- [ ] Backend démarré (port 4000)
- [ ] Backend health check OK (`/api/health`)
- [ ] Swagger UI accessible (`/api/docs`)
- [ ] Frontend démarré (port 3001)
- [ ] Frontend chargé dans navigateur
- [ ] Aucune erreur critique dans consoles

### Fonctionnel
- [ ] Utilisateur admin créé
- [ ] Connexion réussie
- [ ] Dashboard s'affiche
- [ ] Requêtes API fonctionnent (onglet Network)

---

## 🎉 FÉLICITATIONS !

Votre instance **Orchestr'A** est maintenant opérationnelle en local !

**Accès** : http://localhost:3001

**Prochaines étapes** :
1. Explorer l'interface (Projets, Tâches, Calendrier, etc.)
2. Créer des utilisateurs supplémentaires
3. Tester les fonctionnalités
4. Consulter la documentation pour aller plus loin

---

**Version** : 2.0.0
**Date** : 20 octobre 2025
**Auteur** : Claude Code
**Objectif** : ✅ **Hébergement Local Docker Uniquement**

---

## 📝 NOTES IMPORTANTES

### Ce Projet N'EST PAS Conçu Pour

- ❌ Déploiement sur VPS/serveur distant
- ❌ Déploiement cloud (AWS, GCP, Azure)
- ❌ Accès depuis Internet
- ❌ Production multi-utilisateurs distant

### Ce Projet EST Conçu Pour

- ✅ Développement local
- ✅ Tests locaux
- ✅ Démos locales
- ✅ Environnement de développement complet
- ✅ Utilisation sur réseau local (LAN)

**L'objectif est un environnement Docker Compose local parfait.**
