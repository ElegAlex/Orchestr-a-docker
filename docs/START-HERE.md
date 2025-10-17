# 🚀 Orchestr'A Docker - Démarrage Rapide

## ✅ Application 100% Locale

Stack complète : **PostgreSQL** + **MinIO S3** + **NestJS** + **React**
**ZERO dépendance Firebase Cloud** pour les fonctionnalités de base !

---

## 📦 Prérequis

- Docker
- Docker Compose
- 4 GB RAM minimum

---

## 🏃‍♂️ Démarrer l'Application

```bash
cd /home/alex/Documents/Repository/orchestr-a-docker
docker-compose -f docker-compose.full.yml up -d
```

**⏱️ Temps de démarrage :** ~30 secondes

---

## 🌐 Accès à l'Application

### Frontend React
**URL :** http://localhost:3001

### Identifiants de Test

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `admin@orchestra.local` | `admin123` | ADMIN |
| `marie.dubois@orchestra.local` | `password123` | CONTRIBUTOR |
| `jean.martin@orchestra.local` | `password123` | CONTRIBUTOR |
| `sophie.bernard@orchestra.local` | `password123` | CONTRIBUTOR |
| `pierre.leroy@orchestra.local` | `password123` | MANAGER |
| `claire.moreau@orchestra.local` | `password123` | RESPONSABLE |
| `thomas.petit@orchestra.local` | `password123` | VIEWER |

---

## 📊 Données de Test

### 5 Projets
1. **Site Web E-commerce** (ACTIVE, HIGH) - 3 tâches
2. **Application Mobile** (ACTIVE, HIGH) - 3 tâches
3. **Migration Cloud** (ACTIVE, CRITICAL) - 4 tâches
4. **Dashboard Analytics** (DRAFT, MEDIUM) - 2 tâches
5. **API v2** (COMPLETED, HIGH) - 3 tâches

### 15 Tâches
Réparties entre 6 utilisateurs, avec statuts variés (TODO, IN_PROGRESS, COMPLETED)

### 7 Utilisateurs
1 admin + 3 contributeurs + 2 managers + 1 viewer

---

## 🔍 Vérifier que tout fonctionne

```bash
# Voir les logs
docker-compose -f docker-compose.full.yml logs -f

# Vérifier les containers
docker-compose -f docker-compose.full.yml ps

# Devrait afficher :
# ✅ orchestr-a-postgres (healthy)
# ✅ orchestr-a-minio (healthy)
# ✅ orchestr-a-backend (healthy)
# ✅ orchestr-a-frontend (running)
```

---

## 🛑 Arrêter l'Application

```bash
docker-compose -f docker-compose.full.yml down
```

---

## 🔧 Services Disponibles

| Service | Port | URL | Credentials |
|---------|------|-----|-------------|
| Frontend React | 3001 | http://localhost:3001 | Voir tableau ci-dessus |
| API Backend | 4000 | http://localhost:4000/api | Token JWT |
| PostgreSQL | 5432 | localhost:5432 | dev / devpassword |
| MinIO Console | 9001 | http://localhost:9001 | devuser / devpassword |
| MinIO API S3 | 9000 | http://localhost:9000 | devuser / devpassword |

---

## 🔥 Test Rapide API

### 1. Obtenir un token JWT
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@orchestra.local","password":"admin123"}' \
  | jq .
```

### 2. Lister les projets
```bash
TOKEN="votre_token_ici"
curl http://localhost:4000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

### 3. Lister les tâches
```bash
curl http://localhost:4000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

---

## 📚 Documentation Complète

- **[DOCKER-COMPLETE.md](DOCKER-COMPLETE.md)** - Guide complet avec architecture, APIs, dépannage
- **[init-data.sql](init-data.sql)** - Script SQL des données de test (projets/tâches)
- **[add-users.sql](add-users.sql)** - Script SQL des utilisateurs de test
- **[docker-compose.full.yml](docker-compose.full.yml)** - Configuration Docker

---

## 🐛 Problèmes Courants

### Port déjà utilisé
```bash
# Changer le port dans docker-compose.full.yml
# Ligne "3001:80" -> "3002:80"
```

### Container ne démarre pas
```bash
# Rebuild complet
docker-compose -f docker-compose.full.yml down -v
docker-compose -f docker-compose.full.yml up --build -d
```

### Backend crashe
```bash
# Vérifier PostgreSQL
docker exec orchestr-a-postgres pg_isready

# Voir les logs
docker logs orchestr-a-backend --tail 50
```

---

## ✅ Ce qui Fonctionne

- ✅ Authentification JWT
- ✅ Gestion des projets (CRUD complet)
- ✅ Gestion des tâches (CRUD complet)
- ✅ Gestion des utilisateurs
- ✅ Dashboard avec statistiques
- ✅ APIs REST complètes
- ✅ Stockage PostgreSQL persistant
- ✅ Stockage fichiers S3 (MinIO)

---

## 🎯 Prochaines Étapes (optionnel)

- Migrer les 36 services restants encore sur Firebase
- Créer API backend pour departments, milestones, epics
- Ajouter plus de données de test
- Configurer les départements
- Implémenter les webhooks

---

## 💡 Astuce Pro

Pour tester rapidement l'application :
1. Lance `docker-compose -f docker-compose.full.yml up -d`
2. Attends 30 secondes
3. Ouvre http://localhost:3001
4. Login avec `admin@orchestra.local` / `admin123`
5. Tu vois 5 projets et 15 tâches immédiatement !

---

**Version :** 1.0.0
**Dernière mise à jour :** 2025-10-14
**Stack :** PostgreSQL 16 + MinIO + NestJS + React 18
