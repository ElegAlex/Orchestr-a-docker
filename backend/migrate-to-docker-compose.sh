#!/bin/bash

# ==========================================
# Migration Podman → Docker Compose
# ==========================================
#
# Ce script aide à migrer de conteneurs Podman
# manuels vers Docker Compose
#
# Usage: ./migrate-to-docker-compose.sh

set -e  # Arrêter en cas d'erreur

echo "🔄 Migration Podman → Docker Compose"
echo "===================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier si Podman est installé
if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ Podman n'est pas installé${NC}"
    exit 1
fi

# Vérifier si Docker ou Podman-compose est disponible
COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    echo -e "${GREEN}✅ Docker Compose détecté${NC}"
elif command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
    echo -e "${GREEN}✅ Podman Compose détecté${NC}"
else
    echo -e "${RED}❌ Ni docker-compose ni podman-compose n'est installé${NC}"
    echo ""
    echo "Installation requise:"
    echo "  Docker: https://docs.docker.com/get-docker/"
    echo "  Podman Compose: pip3 install podman-compose"
    exit 1
fi

echo ""
echo -e "${BLUE}📦 Étape 1: Vérification des conteneurs Podman existants${NC}"
echo ""

# Liste des conteneurs à migrer
CONTAINERS=("orchestr-a-postgres-dev" "orchestr-a-redis-dev" "orchestr-a-minio-dev")
EXISTING_CONTAINERS=()

for container in "${CONTAINERS[@]}"; do
    if podman ps -a --format "{{.Names}}" | grep -q "^${container}$"; then
        echo -e "${YELLOW}⚠️  Conteneur trouvé: ${container}${NC}"
        EXISTING_CONTAINERS+=("$container")
    fi
done

if [ ${#EXISTING_CONTAINERS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ Aucun conteneur Podman existant${NC}"
    echo ""
    echo -e "${BLUE}Vous pouvez directement lancer Docker Compose:${NC}"
    echo "  $COMPOSE_CMD up -d"
    exit 0
fi

echo ""
echo -e "${RED}⚠️  ${#EXISTING_CONTAINERS[@]} conteneur(s) Podman trouvé(s)${NC}"
echo ""
read -p "Voulez-vous sauvegarder les données avant migration? (o/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo ""
    echo -e "${BLUE}📥 Étape 2: Sauvegarde des données${NC}"
    echo ""

    BACKUP_DIR="./backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    # Backup PostgreSQL
    if podman ps --format "{{.Names}}" | grep -q "^orchestr-a-postgres-dev$"; then
        echo "💾 Backup PostgreSQL..."
        podman exec orchestr-a-postgres-dev pg_dump -U dev orchestra_dev > "$BACKUP_DIR/postgres-backup.sql"
        echo -e "${GREEN}✅ PostgreSQL sauvegardé${NC}"
    fi

    # Backup Redis
    if podman ps --format "{{.Names}}" | grep -q "^orchestr-a-redis-dev$"; then
        echo "💾 Backup Redis..."
        podman exec orchestr-a-redis-dev redis-cli BGSAVE > /dev/null 2>&1 || true
        sleep 2
        podman cp orchestr-a-redis-dev:/data/dump.rdb "$BACKUP_DIR/redis-backup.rdb" 2>/dev/null || echo "  (Redis backup peut être vide si aucune donnée)"
        echo -e "${GREEN}✅ Redis sauvegardé${NC}"
    fi

    echo ""
    echo -e "${GREEN}✅ Données sauvegardées dans: $BACKUP_DIR${NC}"
else
    BACKUP_DIR=""
fi

echo ""
read -p "Voulez-vous arrêter et supprimer les conteneurs Podman? (o/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo -e "${YELLOW}⚠️  Migration annulée${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🛑 Étape 3: Arrêt des conteneurs Podman${NC}"
echo ""

for container in "${EXISTING_CONTAINERS[@]}"; do
    echo "Arrêt de $container..."
    podman stop "$container" 2>/dev/null || true
    echo "Suppression de $container..."
    podman rm "$container" 2>/dev/null || true
    echo -e "${GREEN}✅ $container supprimé${NC}"
done

echo ""
echo -e "${BLUE}🚀 Étape 4: Démarrage de Docker Compose${NC}"
echo ""

$COMPOSE_CMD up -d

echo ""
echo -e "${BLUE}⏳ Attente du démarrage des services...${NC}"
sleep 5

echo ""
echo -e "${BLUE}📊 Étape 5: Vérification des services${NC}"
echo ""

$COMPOSE_CMD ps

echo ""

# Restauration si backup existe
if [ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ]; then
    echo ""
    read -p "Voulez-vous restaurer les données sauvegardées? (o/N) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Oo]$ ]]; then
        echo ""
        echo -e "${BLUE}📤 Étape 6: Restauration des données${NC}"
        echo ""

        # Restaurer PostgreSQL
        if [ -f "$BACKUP_DIR/postgres-backup.sql" ]; then
            echo "📥 Restauration PostgreSQL..."
            cat "$BACKUP_DIR/postgres-backup.sql" | $COMPOSE_CMD exec -T postgres psql -U dev orchestra_dev
            echo -e "${GREEN}✅ PostgreSQL restauré${NC}"
        fi

        # Restaurer Redis
        if [ -f "$BACKUP_DIR/redis-backup.rdb" ]; then
            echo "📥 Restauration Redis..."
            docker cp "$BACKUP_DIR/redis-backup.rdb" orchestr-a-redis-dev:/data/dump.rdb
            $COMPOSE_CMD restart redis
            echo -e "${GREEN}✅ Redis restauré${NC}"
        fi

        echo ""
        echo -e "${GREEN}✅ Données restaurées${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✨ Migration terminée avec succès!${NC}"
echo ""
echo "Commandes utiles:"
echo "  $COMPOSE_CMD ps              # État des services"
echo "  $COMPOSE_CMD logs -f         # Voir les logs"
echo "  $COMPOSE_CMD down            # Arrêter tous les services"
echo ""
echo "Backend:"
echo "  npm run start:dev            # Lancer le backend"
echo "  npx prisma studio            # Interface base de données"
echo ""
