#!/bin/bash

# ==========================================
# SCRIPT DE DÉMARRAGE - ORCHESTR'A DOCKER
# ==========================================
# Lance l'environnement complet en local
#
# Usage:
#   ./start.sh              # Démarrage normal
#   ./start.sh --rebuild    # Rebuild les images
#   ./start.sh --logs       # Démarrage + logs
#   ./start.sh --stop       # Arrêter les services

set -e

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.full.yml"
REBUILD=false
SHOW_LOGS=false
STOP_ONLY=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --rebuild)
      REBUILD=true
      shift
      ;;
    --logs)
      SHOW_LOGS=true
      shift
      ;;
    --stop)
      STOP_ONLY=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --rebuild    Rebuild les images Docker"
      echo "  --logs       Afficher les logs après démarrage"
      echo "  --stop       Arrêter les services"
      echo "  --help       Afficher ce message"
      exit 0
      ;;
  esac
done

# Function: Header
print_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  🎯 ORCHESTR'A - Plateforme de Gestion de Projets${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Function: Check prerequisites
check_prerequisites() {
  echo -e "${YELLOW}🔍 Vérification des prérequis...${NC}"

  if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé !${NC}"
    echo "   Installer Docker: https://www.docker.com/products/docker-desktop"
    exit 1
  fi

  if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas disponible !${NC}"
    exit 1
  fi

  echo -e "${GREEN}✅ Docker et Docker Compose détectés${NC}"
  echo ""
}

# Function: Stop services
stop_services() {
  echo -e "${YELLOW}🛑 Arrêt des services Docker...${NC}"
  docker compose -f "$COMPOSE_FILE" down
  echo -e "${GREEN}✅ Services arrêtés${NC}"
}

# Function: Start services
start_services() {
  if [ "$REBUILD" = true ]; then
    echo -e "${YELLOW}🔨 Rebuild des images Docker...${NC}"
    docker compose -f "$COMPOSE_FILE" build --no-cache
    echo ""
  fi

  echo -e "${YELLOW}🐳 Démarrage des services Docker...${NC}"
  docker compose -f "$COMPOSE_FILE" up -d

  echo ""
  echo -e "${YELLOW}⏳ Attente du démarrage des services (healthchecks)...${NC}"

  # Attendre que les services soient healthy
  local max_wait=60
  local elapsed=0

  while [ $elapsed -lt $max_wait ]; do
    local healthy=$(docker compose -f "$COMPOSE_FILE" ps | grep -c "healthy" || echo "0")

    if [ "$healthy" -ge 3 ]; then
      echo -e "${GREEN}✅ Tous les services sont opérationnels !${NC}"
      break
    fi

    sleep 2
    elapsed=$((elapsed + 2))
    echo -n "."
  done

  echo ""
}

# Function: Show status
show_status() {
  echo ""
  echo -e "${BLUE}📊 État des services :${NC}"
  docker compose -f "$COMPOSE_FILE" ps
  echo ""
}

# Function: Show access info
show_access_info() {
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ✅ ORCHESTR'A DOCKER EST DÉMARRÉ !${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${BLUE}🌐 ACCÈS À L'APPLICATION :${NC}"
  echo ""
  echo "   Frontend     : http://localhost:3001"
  echo "   Backend API  : http://localhost:4000/api"
  echo "   API Swagger  : http://localhost:4000/api/docs"
  echo ""
  echo -e "${BLUE}👤 Compte Admin par défaut :${NC}"
  echo "   Email    : test.admin@orchestra.local"
  echo "   Password : Admin1234"
  echo ""
  echo -e "${BLUE}🗄️  Services Infrastructure :${NC}"
  echo "   PostgreSQL  : localhost:5432 (dev/devpassword)"
  echo "   Redis       : localhost:6379"
  echo "   MinIO Web   : http://localhost:9001 (devuser/devpassword)"
  echo "   MinIO API   : http://localhost:9000"
  echo ""
  echo -e "${BLUE}📝 Commandes utiles :${NC}"
  echo "   Logs temps réel : docker compose -f $COMPOSE_FILE logs -f"
  echo "   Logs backend    : docker compose -f $COMPOSE_FILE logs -f backend"
  echo "   Logs frontend   : docker compose -f $COMPOSE_FILE logs -f frontend"
  echo "   Arrêter         : ./start.sh --stop"
  echo "   Rebuild         : ./start.sh --rebuild"
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Main execution
main() {
  print_header
  check_prerequisites

  if [ "$STOP_ONLY" = true ]; then
    stop_services
    exit 0
  fi

  stop_services
  echo ""
  start_services
  show_status
  show_access_info

  if [ "$SHOW_LOGS" = true ]; then
    echo -e "${YELLOW}📋 Affichage des logs (CTRL+C pour quitter)...${NC}"
    echo ""
    docker compose -f "$COMPOSE_FILE" logs -f
  fi
}

main
