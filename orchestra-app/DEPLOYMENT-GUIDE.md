# 🚀 Guide de Déploiement Local - Orchestra Frontend

## Architecture Container Docker

L'application frontend Orchestra est complètement containerisée et déployée localement via Docker Compose.

```
Frontend React (Port 3001)
├── nginx (reverse proxy)
├── Build production React
└── Variables d'environnement injectées
```

## 🐳 Déploiement avec Docker Compose

### Prérequis

- Docker 20.10+
- Docker Compose 2.0+
- Backend déjà en cours d'exécution (port 4000)

### 1. Configuration Variables d'Environnement

Créer/vérifier le fichier `.env` à la racine du projet frontend:

```env
# API Backend
REACT_APP_API_URL=http://localhost:4000

# Mode
NODE_ENV=production
```

### 2. Build et Déploiement

```bash
# Démarrer toute la stack (backend + frontend)
docker-compose -f docker-compose.full.yml up -d

# Ou uniquement le frontend (backend doit tourner)
docker-compose -f docker-compose.full.yml up -d frontend
```

### 3. Vérification Post-Déploiement

```bash
# Vérifier que le container tourne
docker ps | grep orchestr-a-frontend

# Tester l'accès
curl -I http://localhost:3001

# Voir les logs
docker logs orchestr-a-frontend -f
```

## 🔧 Développement Local (Hors Docker)

### Installation

```bash
cd orchestra-app
npm install
```

### Configuration

Créer un fichier `.env.local`:

```env
REACT_APP_API_URL=http://localhost:4000
```

### Démarrage

```bash
# Mode développement (hot reload)
npm start

# Build production local
npm run build

# Servir le build localement
npx serve -s build -l 3001
```

### URLs Locales

- **App React**: http://localhost:3000 (dev) ou http://localhost:3001 (prod)
- **Backend API**: http://localhost:4000
- **Swagger UI**: http://localhost:4000/api

## 📦 Build Production

### Build Manuel

```bash
cd orchestra-app
npm run build
```

Le dossier `build/` contiendra l'application optimisée.

### Build Docker

Le Dockerfile utilise un multi-stage build pour optimiser la taille:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Rebuild Image Docker

```bash
docker-compose -f docker-compose.full.yml build frontend
docker-compose -f docker-compose.full.yml up -d frontend
```

## 🎯 Composants et Services Migrés

### Services REST API (Migrés depuis Firebase)

✅ **Services complètement migrés**:
- `auth.service.ts` - Authentification JWT
- `user.service.ts` - Gestion utilisateurs
- `project.service.ts` - Gestion projets
- `task.service.ts` - Gestion tâches
- `milestone.service.ts` - Gestion jalons
- `department.service.ts` - Gestion départements
- `comment.service.ts` - Commentaires
- `document.service.ts` - Documents
- `leave.service.ts` - Congés
- `simpleTask.service.ts` - Tâches simples
- `presence.service.ts` - Présences
- `personalTodo.service.ts` - Todos personnelles ✨ NOUVEAU
- `epic.service.ts` - Epics ✨ NOUVEAU
- `timeEntry.service.ts` - Saisies de temps ✨ NOUVEAU

### Architecture API

Tous les services utilisent le client API centralisé:

```typescript
// services/api/client.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

## 🧪 Tests Frontend

### Tests Unitaires

```bash
npm test

# Avec couverture
npm test -- --coverage
```

### Tests E2E (Cypress)

```bash
# Démarrer l'app en mode test
npm start

# Dans un autre terminal
npm run cypress:open
```

## 🔧 Configuration Nginx

Le fichier `nginx.conf` configure le reverse proxy:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🚦 Gestion des Erreurs

### Erreur: "Cannot connect to backend"

```bash
# Vérifier que le backend tourne
docker ps | grep orchestr-a-backend

# Vérifier les logs backend
docker logs orchestr-a-backend

# Vérifier la variable REACT_APP_API_URL
docker exec orchestr-a-frontend env | grep REACT_APP_API_URL
```

### Erreur: "Port 3001 already in use"

```bash
# Trouver le processus
lsof -i :3001

# Tuer le processus
kill -9 <PID>

# Ou modifier le port dans docker-compose.full.yml
```

### Rebuild complet

```bash
# Arrêter et supprimer les containers
docker-compose -f docker-compose.full.yml down

# Rebuild sans cache
docker-compose -f docker-compose.full.yml build --no-cache frontend

# Redémarrer
docker-compose -f docker-compose.full.yml up -d
```

## 📊 Monitoring et Logs

### Logs en temps réel

```bash
# Frontend uniquement
docker logs orchestr-a-frontend -f

# Tous les services
docker-compose -f docker-compose.full.yml logs -f
```

### État des services

```bash
docker-compose -f docker-compose.full.yml ps
```

### Métriques

- **Taille image Docker**: ~150MB (optimisée avec nginx:alpine)
- **Temps de build**: ~2-3 minutes
- **Temps de démarrage**: ~5 secondes

## 🎯 Checklist Déploiement

- [ ] Variables d'environnement configurées (`.env`)
- [ ] Backend démarré et accessible (http://localhost:4000)
- [ ] PostgreSQL en cours d'exécution
- [ ] Build frontend réussi (`npm run build`)
- [ ] Container frontend démarré
- [ ] Application accessible (http://localhost:3001)
- [ ] Authentification fonctionnelle
- [ ] Tous les services API fonctionnels

## 📚 Ressources

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:4000
- **Swagger UI**: http://localhost:4000/api/docs
- **Logs**: `docker logs orchestr-a-frontend -f`

---

**Dernière mise à jour**: 15 octobre 2025
**Architecture**: Docker Compose multi-container
**Mode déploiement**: Local uniquement (pas de cloud)
