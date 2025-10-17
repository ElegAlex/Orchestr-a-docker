#!/bin/bash

# ==========================================
# SCRIPT DE TEST INFRASTRUCTURE - ORCHESTR'A
# ==========================================
# Valide que tous les services fonctionnent
#
# Usage: ./test-infrastructure.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Compteurs
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Configuration
COMPOSE_FILE="docker-compose.full.yml"

# Function: Print header
print_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  🧪 TEST INFRASTRUCTURE - ORCHESTR'A${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Function: Test passed
test_passed() {
  local test_name="$1"
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  PASSED_TESTS=$((PASSED_TESTS + 1))
  echo -e "${GREEN}✅ PASS${NC} - $test_name"
}

# Function: Test failed
test_failed() {
  local test_name="$1"
  local error="$2"
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  FAILED_TESTS=$((FAILED_TESTS + 1))
  echo -e "${RED}❌ FAIL${NC} - $test_name"
  echo -e "${RED}   Error: $error${NC}"
}

# Function: Section header
section() {
  echo ""
  echo -e "${YELLOW}━━━ $1 ━━━${NC}"
}

# ==========================================
# TESTS
# ==========================================

# 1. Docker Prerequisites
section "1. Vérification Prérequis"

if command -v docker &> /dev/null; then
  test_passed "Docker installé"
else
  test_failed "Docker installé" "Docker non trouvé"
  exit 1
fi

if docker compose version &> /dev/null; then
  test_passed "Docker Compose disponible"
else
  test_failed "Docker Compose disponible" "Docker Compose non trouvé"
  exit 1
fi

# 2. Containers Running
section "2. Conteneurs Docker"

services=("postgres" "redis" "minio" "backend" "frontend")

for service in "${services[@]}"; do
  if docker compose -f "$COMPOSE_FILE" ps "$service" 2>/dev/null | grep -q "Up"; then
    test_passed "Container $service running"
  else
    test_failed "Container $service running" "Container not up"
  fi
done

# 3. Healthchecks
section "3. Healthchecks Services"

# PostgreSQL
if docker exec orchestr-a-postgres pg_isready -U dev -d orchestra_dev &>/dev/null; then
  test_passed "PostgreSQL healthy"
else
  test_failed "PostgreSQL healthy" "pg_isready failed"
fi

# Redis
if docker exec orchestr-a-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
  test_passed "Redis healthy"
else
  test_failed "Redis healthy" "redis-cli ping failed"
fi

# MinIO
if curl -sf http://localhost:9000/minio/health/live &>/dev/null; then
  test_passed "MinIO healthy"
else
  test_failed "MinIO healthy" "Health endpoint failed"
fi

# Backend
if curl -sf http://localhost:4000/api/health &>/dev/null; then
  test_passed "Backend healthy"
else
  test_failed "Backend healthy" "Health endpoint failed"
fi

# Frontend
if curl -sf http://localhost:3001/health &>/dev/null; then
  test_passed "Frontend healthy"
else
  test_failed "Frontend healthy" "Health endpoint failed"
fi

# 4. Network Connectivity
section "4. Connectivité Réseau"

# Backend → PostgreSQL
if docker exec orchestr-a-backend sh -c "nc -zv postgres 5432" &>/dev/null; then
  test_passed "Backend → PostgreSQL connection"
else
  test_failed "Backend → PostgreSQL connection" "Connection refused"
fi

# Backend → Redis
if docker exec orchestr-a-backend sh -c "nc -zv redis 6379" &>/dev/null; then
  test_passed "Backend → Redis connection"
else
  test_failed "Backend → Redis connection" "Connection refused"
fi

# Backend → MinIO
if docker exec orchestr-a-backend sh -c "nc -zv minio 9000" &>/dev/null; then
  test_passed "Backend → MinIO connection"
else
  test_failed "Backend → MinIO connection" "Connection refused"
fi

# 5. API Endpoints
section "5. Endpoints API Backend"

# Health endpoint
if curl -sf http://localhost:4000/api/health &>/dev/null; then
  test_passed "GET /api/health"
else
  test_failed "GET /api/health" "Endpoint unreachable"
fi

# Swagger docs
if curl -sf http://localhost:4000/api/docs &>/dev/null; then
  test_passed "GET /api/docs (Swagger)"
else
  test_failed "GET /api/docs (Swagger)" "Endpoint unreachable"
fi

# Auth login endpoint (should return 400 without body, but reachable)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/auth/login)
if [ "$HTTP_CODE" -eq 400 ] || [ "$HTTP_CODE" -eq 401 ]; then
  test_passed "POST /api/auth/login (reachable)"
else
  test_failed "POST /api/auth/login (reachable)" "HTTP $HTTP_CODE"
fi

# 6. Database
section "6. Base de Données"

# Check Prisma migrations
if docker exec orchestr-a-backend npx prisma migrate status 2>&1 | grep -q "Database schema is up to date"; then
  test_passed "Prisma migrations up to date"
else
  test_failed "Prisma migrations up to date" "Migrations pending or error"
fi

# Check tables exist
TABLES_COUNT=$(docker exec orchestr-a-postgres psql -U dev -d orchestra_dev -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

if [ "$TABLES_COUNT" -gt 10 ]; then
  test_passed "Database tables exist ($TABLES_COUNT tables)"
else
  test_failed "Database tables exist" "Only $TABLES_COUNT tables found"
fi

# 7. Volumes
section "7. Volumes Persistants"

volumes=("postgres-data" "redis-data" "minio-data")

for volume in "${volumes[@]}"; do
  if docker volume ls | grep -q "orchestr-a-docker_$volume"; then
    test_passed "Volume $volume exists"
  else
    test_failed "Volume $volume exists" "Volume not found"
  fi
done

# 8. Nginx Configuration
section "8. Configuration Nginx"

# Test Nginx config syntax
if docker exec orchestr-a-frontend nginx -t &>/dev/null; then
  test_passed "Nginx config valid"
else
  test_failed "Nginx config valid" "Syntax error"
fi

# Test gzip enabled
if curl -sI -H "Accept-Encoding: gzip" http://localhost:3001 | grep -qi "Content-Encoding: gzip"; then
  test_passed "Nginx gzip compression enabled"
else
  test_failed "Nginx gzip compression enabled" "Gzip header not found"
fi

# Test security headers
HEADERS=$(curl -sI http://localhost:3001)

if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
  test_passed "Security header X-Frame-Options"
else
  test_failed "Security header X-Frame-Options" "Header missing"
fi

if echo "$HEADERS" | grep -qi "X-Content-Type-Options"; then
  test_passed "Security header X-Content-Type-Options"
else
  test_failed "Security header X-Content-Type-Options" "Header missing"
fi

# 9. Performance
section "9. Performance & Ressources"

# Check CPU/Memory usage is reasonable
BACKEND_MEM=$(docker stats --no-stream orchestr-a-backend --format "{{.MemUsage}}" | cut -d'/' -f1 | sed 's/MiB//g' | tr -d ' ')

if [ -n "$BACKEND_MEM" ]; then
  if (( $(echo "$BACKEND_MEM < 500" | bc -l) )); then
    test_passed "Backend memory usage acceptable (${BACKEND_MEM}MiB)"
  else
    test_failed "Backend memory usage acceptable" "High memory: ${BACKEND_MEM}MiB"
  fi
else
  test_failed "Backend memory usage check" "Could not get stats"
fi

# ==========================================
# SUMMARY
# ==========================================

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  📊 RÉSULTATS DES TESTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "   Total:  $TOTAL_TESTS tests"
echo -e "   ${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "   ${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ✅ TOUS LES TESTS PASSENT !${NC}"
  echo -e "${GREEN}  Infrastructure Orchestr'A opérationnelle.${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}  ❌ CERTAINS TESTS ONT ÉCHOUÉ${NC}"
  echo -e "${RED}  Vérifier les logs ci-dessus.${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "💡 Aide au troubleshooting:"
  echo "   - Logs: docker compose -f $COMPOSE_FILE logs -f"
  echo "   - Status: docker compose -f $COMPOSE_FILE ps"
  echo "   - Documentation: docs/deployment/infrastructure-guide.md"
  echo ""
  exit 1
fi
