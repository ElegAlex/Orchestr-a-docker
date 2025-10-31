# 🐳 Guide Docker Compose - Orchestr'A

## 📋 Vue d'Ensemble

Ce fichier `docker-compose.yml` remplace les commandes Podman manuelles et simplifie drastiquement le démarrage de l'infrastructure.

### Avant (Podman manuel)
```bash
podman network create orchestr-a-dev
podman run -d --name orchestr-a-postgres-dev --network orchestr-a-dev ...
podman run -d --name orchestr-a-redis-dev --network orchestr-a-dev ...
podman run -d --name orchestr-a-minio-dev --network orchestr-a-dev ...
```

### Maintenant (Docker Compose)
```bash
docker-compose up -d
```

---

## 🚀 Démarrage Rapide

### Prérequis

**Option 1 - Docker (Recommandé)**
```bash
# Installer Docker et Docker Compose
# https://docs.docker.com/get-docker/

docker --version
docker-compose --version
```

**Option 2 - Podman avec podman-compose**
```bash
# Si Podman est déjà installé
pip3 install podman-compose

podman --version
podman-compose --version
```

### Premier Démarrage

```bash
# 1. Se placer dans le dossier backend
cd backend

# 2. Démarrer tous les services
docker-compose up -d

# 3. Vérifier que tout tourne
docker-compose ps

# 4. Voir les logs
docker-compose logs -f

# 5. Appliquer les migrations Prisma
npx prisma migrate deploy

# 6. (Optionnel) Seed la base avec les données de test
npx prisma db seed

# 7. Lancer le backend
npm run start:dev
```

---

## 📦 Services Inclus

### PostgreSQL 16
- **Port:** 5432
- **Database:** orchestra_dev
- **User:** dev
- **Password:** devpassword
- **Volume:** orchestr-a-postgres-data

### Redis 7
- **Port:** 6379
- **Mode:** Persistence activée (AOF)
- **Volume:** orchestr-a-redis-data

### MinIO
- **API Port:** 9000
- **Console Port:** 9001
- **User:** devuser
- **Password:** devpassword
- **Console URL:** http://localhost:9001
- **Volume:** orchestr-a-minio-data

---

## ⚡ Commandes Essentielles

### Gestion des Services

```bash
# Démarrer tous les services (en arrière-plan)
docker-compose up -d

# Démarrer avec les logs visibles
docker-compose up

# Arrêter tous les services
docker-compose down

# Arrêter ET supprimer les volumes (⚠️ perte de données)
docker-compose down -v

# Redémarrer tous les services
docker-compose restart

# Redémarrer un service spécifique
docker-compose restart postgres
```

### Logs et Monitoring

```bash
# Voir tous les logs en temps réel
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f minio

# Dernières 50 lignes de logs
docker-compose logs --tail=50

# État des services
docker-compose ps

# Statistiques de ressources
docker stats
```

### Accès aux Conteneurs

```bash
# Shell PostgreSQL
docker-compose exec postgres psql -U dev -d orchestra_dev

# Shell Redis
docker-compose exec redis redis-cli

# Shell dans MinIO
docker-compose exec minio sh

# Commande arbitraire dans un conteneur
docker-compose exec postgres pg_dump -U dev orchestra_dev > backup.sql
```

---

## 🔧 Configuration Avancée

### Variables d'Environnement

Le fichier `docker-compose.yml` utilise des valeurs par défaut. Pour personnaliser, créer un `.env` :

```bash
# .env
POSTGRES_DB=orchestra_dev
POSTGRES_USER=dev
POSTGRES_PASSWORD=devpassword
POSTGRES_PORT=5432

REDIS_PORT=6379

MINIO_ROOT_USER=devuser
MINIO_ROOT_PASSWORD=devpassword
MINIO_API_PORT=9000
MINIO_CONSOLE_PORT=9001
```

Puis modifier `docker-compose.yml` pour utiliser ces variables :
```yaml
environment:
  POSTGRES_DB: ${POSTGRES_DB}
  POSTGRES_USER: ${POSTGRES_USER}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

### Health Checks

Les services ont des health checks configurés :

```bash
# Vérifier la santé d'un service
docker inspect orchestr-a-postgres-dev | jq '.[0].State.Health'

# PostgreSQL
docker-compose exec postgres pg_isready -U dev

# Redis
docker-compose exec redis redis-cli ping

# MinIO
curl http://localhost:9000/minio/health/live
```

---

## 📊 Volumes et Données

### Lister les Volumes

```bash
docker volume ls | grep orchestr-a
```

### Backup des Données

```bash
# PostgreSQL
docker-compose exec -T postgres pg_dump -U dev orchestra_dev > backup.sql

# Restaurer
cat backup.sql | docker-compose exec -T postgres psql -U dev orchestra_dev

# Redis
docker-compose exec redis redis-cli BGSAVE
docker cp orchestr-a-redis-dev:/data/dump.rdb ./redis-backup.rdb

# MinIO (via mc client)
# https://min.io/docs/minio/linux/reference/minio-mc.html
```

### Nettoyer les Volumes

```bash
# ⚠️ ATTENTION: Supprime toutes les données!

# Arrêter et supprimer les volumes
docker-compose down -v

# Ou supprimer manuellement
docker volume rm orchestr-a-postgres-data
docker volume rm orchestr-a-redis-data
docker volume rm orchestr-a-minio-data
```

---

## 🐛 Troubleshooting

### Problème: Port déjà utilisé

**Erreur:** `Bind for 0.0.0.0:5432 failed: port is already allocated`

**Solution:**
```bash
# Identifier le processus
lsof -i :5432

# Tuer le processus
kill -9 <PID>

# Ou changer le port dans docker-compose.yml
ports:
  - "5433:5432"  # Utiliser le port 5433 sur l'hôte
```

### Problème: Service ne démarre pas

**Solution:**
```bash
# Voir les logs détaillés
docker-compose logs postgres

# Recréer le conteneur
docker-compose up -d --force-recreate postgres

# Vérifier l'état
docker-compose ps
```

### Problème: Connexion refusée

**Erreur:** `Connection refused` depuis le backend

**Cause:** Le backend tourne sur l'hôte, pas dans Docker

**Solution:** Utiliser `localhost` dans `.env` (pas le nom du service) :
```env
DATABASE_URL="postgresql://dev:devpassword@localhost:5432/orchestra_dev?schema=public"
```

Si le backend était aussi dans Docker, on utiliserait:
```env
DATABASE_URL="postgresql://dev:devpassword@postgres:5432/orchestra_dev?schema=public"
```

### Problème: Volumes non persistants

**Solution:** Vérifier que les volumes sont bien nommés :
```bash
docker volume inspect orchestr-a-postgres-data
```

### Problème: Permissions denied

**Erreur:** Permission issues dans les volumes

**Solution:**
```bash
# Changer les permissions du volume
docker-compose exec postgres chown -R postgres:postgres /var/lib/postgresql/data
```

---

## 🔄 Migration depuis Podman

Si tu as déjà des conteneurs Podman en cours :

### 1. Exporter les Données

```bash
# PostgreSQL
podman exec orchestr-a-postgres-dev pg_dump -U dev orchestra_dev > backup.sql

# Redis
podman exec orchestr-a-redis-dev redis-cli BGSAVE
podman cp orchestr-a-redis-dev:/data/dump.rdb ./redis-backup.rdb
```

### 2. Arrêter Podman

```bash
podman stop orchestr-a-postgres-dev orchestr-a-redis-dev orchestr-a-minio-dev
podman rm orchestr-a-postgres-dev orchestr-a-redis-dev orchestr-a-minio-dev
```

### 3. Démarrer Docker Compose

```bash
docker-compose up -d
```

### 4. Importer les Données

```bash
# PostgreSQL
cat backup.sql | docker-compose exec -T postgres psql -U dev orchestra_dev

# Redis
docker cp redis-backup.rdb orchestr-a-redis-dev:/data/dump.rdb
docker-compose restart redis
```

---

## 🎯 Utilisation avec Podman

Si tu préfères continuer avec Podman :

### Installation de podman-compose

```bash
pip3 install podman-compose
```

### Utilisation

```bash
# Même syntaxe que docker-compose
podman-compose up -d
podman-compose down
podman-compose logs -f
podman-compose ps
```

**Note:** `podman-compose` n'est pas aussi mature que `docker-compose`, certaines fonctionnalités peuvent différer.

---

## 📝 Fichier docker-compose.yml Complet

Le fichier inclut :

✅ **3 services** (PostgreSQL, Redis, MinIO)
✅ **3 volumes persistants** nommés
✅ **1 réseau dédié** isolé
✅ **Health checks** pour chaque service
✅ **Restart policy** (unless-stopped)
✅ **Labels** pour documentation
✅ **Commentaires** explicatifs

---

## 🚀 Workflow de Développement Typique

```bash
# Matin - Démarrer l'infrastructure
cd backend
docker-compose up -d

# Vérifier que tout est OK
docker-compose ps

# Lancer le backend en dev
npm run start:dev

# (Optionnel) Lancer Prisma Studio
npx prisma studio

# Développer, tester, coder...

# Soir - Arrêter (en gardant les données)
docker-compose stop

# Ou tout arrêter proprement
docker-compose down
```

---

## 📚 Ressources

- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)
- [MinIO Docker Image](https://hub.docker.com/r/minio/minio)
- [Podman Compose](https://github.com/containers/podman-compose)

---

**✅ Avec Docker Compose, l'infrastructure est maintenant un simple `docker-compose up -d` !**
