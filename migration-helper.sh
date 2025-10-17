#!/bin/bash

# Script helper pour la migration des services Firebase → NestJS
# Usage: ./migration-helper.sh [commande] [arguments]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Fonction: Obtenir un token JWT
get_token() {
    local email="${1:-admin@orchestra.local}"
    local password="${2:-admin123}"

    token=$(curl -s -X POST http://localhost:4000/api/auth/login \
        -H 'Content-Type: application/json' \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}" \
        | jq -r '.accessToken')

    if [ "$token" != "null" ] && [ -n "$token" ]; then
        echo "$token"
        return 0
    else
        return 1
    fi
}

# Fonction: Tester si une API existe
test_api() {
    local endpoint="$1"

    print_info "Test de l'endpoint: /api/$endpoint"

    token=$(get_token)
    if [ $? -ne 0 ]; then
        print_error "Impossible d'obtenir un token"
        return 1
    fi

    status=$(curl -s -o /dev/null -w "%{http_code}" \
        "http://localhost:4000/api/$endpoint" \
        -H "Authorization: Bearer $token")

    case $status in
        200)
            print_success "API existe (HTTP $status)"
            return 0
            ;;
        404)
            print_warning "API n'existe pas (HTTP $status)"
            return 1
            ;;
        401)
            print_error "Non autorisé (HTTP $status)"
            return 2
            ;;
        *)
            print_warning "Statut inconnu (HTTP $status)"
            return 3
            ;;
    esac
}

# Fonction: Tester toutes les APIs potentielles
test_all_apis() {
    print_info "Test de toutes les APIs potentielles..."
    echo ""

    apis=(
        "projects"
        "tasks"
        "users"
        "comments"
        "documents"
        "leaves"
        "departments"
        "milestones"
        "epics"
        "holidays"
        "presences"
        "capacities"
        "notifications"
        "profiles"
        "resources"
        "analytics"
        "time-entries"
    )

    echo "Endpoint            | Status"
    echo "--------------------|---------"

    for api in "${apis[@]}"; do
        token=$(get_token)
        status=$(curl -s -o /dev/null -w "%{http_code}" \
            "http://localhost:4000/api/$api" \
            -H "Authorization: Bearer $token" 2>/dev/null)

        printf "%-20s| " "$api"

        case $status in
            200) echo -e "${GREEN}✅ Existe${NC}" ;;
            404) echo -e "${RED}❌ N'existe pas${NC}" ;;
            401) echo -e "${YELLOW}⚠️  Auth error${NC}" ;;
            *) echo -e "${YELLOW}? HTTP $status${NC}" ;;
        esac
    done
}

# Fonction: Lister les services Firebase
list_firebase_services() {
    print_info "Services utilisant encore Firebase:"
    echo ""

    cd /home/alex/Documents/Repository/orchestr-a-docker/orchestra-app/src/services

    count=0
    for file in *.service.ts; do
        if grep -q "from.*firebase" "$file" 2>/dev/null; then
            count=$((count + 1))
            echo "$count. $file"
        fi
    done

    echo ""
    print_info "Total: $count services"
}

# Fonction: Analyser un service
analyze_service() {
    local service_name="$1"

    if [ -z "$service_name" ]; then
        print_error "Usage: $0 analyze <nom-service>"
        print_info "Exemple: $0 analyze comment"
        return 1
    fi

    local service_file="orchestra-app/src/services/${service_name}.service.ts"

    if [ ! -f "$service_file" ]; then
        print_error "Service '$service_file' introuvable"
        return 1
    fi

    print_info "Analyse de $service_name.service.ts"
    echo ""

    print_info "Collections Firestore utilisées:"
    grep -E "(collection\(|doc\()" "$service_file" | head -10 || echo "  Aucune trouvée"

    echo ""
    print_info "Méthodes principales:"
    grep -E "^\s*async\s+\w+|^\s*\w+\s*\(" "$service_file" | head -10 || echo "  Aucune trouvée"

    echo ""
    print_info "Imports Firebase:"
    grep "from.*firebase" "$service_file" || echo "  Aucun"
}

# Fonction: Créer un module backend
create_backend_module() {
    local module_name="$1"

    if [ -z "$module_name" ]; then
        print_error "Usage: $0 create-module <nom-module>"
        print_info "Exemple: $0 create-module departments"
        return 1
    fi

    print_info "Création du module backend: $module_name"

    # Générer le module
    docker exec orchestr-a-backend npx nest g module "$module_name" || {
        print_error "Échec de la création du module"
        return 1
    }

    # Générer le controller
    docker exec orchestr-a-backend npx nest g controller "$module_name" || {
        print_error "Échec de la création du controller"
        return 1
    }

    # Générer le service
    docker exec orchestr-a-backend npx nest g service "$module_name" || {
        print_error "Échec de la création du service"
        return 1
    }

    print_success "Module $module_name créé avec succès!"
    print_info "Prochaines étapes:"
    echo "  1. Éditer backend/src/$module_name/$module_name.service.ts"
    echo "  2. Éditer backend/src/$module_name/$module_name.controller.ts"
    echo "  3. Créer les DTOs dans backend/src/$module_name/dto/"
    echo "  4. Rebuild: docker compose -f docker-compose.full.yml build --no-cache backend"
}

# Fonction: Rebuild backend
rebuild_backend() {
    print_info "Rebuild du backend..."
    docker compose -f docker-compose.full.yml build --no-cache backend
    print_success "Backend rebuilded"

    print_info "Redémarrage du backend..."
    docker compose -f docker-compose.full.yml up -d backend
    print_success "Backend redémarré"

    sleep 3
    print_info "Test de santé..."
    if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
        print_success "Backend opérationnel"
    else
        print_warning "Backend peut ne pas être prêt"
    fi
}

# Fonction: Rebuild frontend
rebuild_frontend() {
    print_info "Rebuild du frontend..."
    docker compose -f docker-compose.full.yml build --no-cache frontend
    print_success "Frontend rebuilded"

    print_info "Redémarrage du frontend..."
    docker compose -f docker-compose.full.yml up -d frontend
    print_success "Frontend redémarré"
}

# Fonction: Afficher l'aide
show_help() {
    echo ""
    echo "Migration Helper - Firebase → NestJS"
    echo ""
    echo "Usage: ./migration-helper.sh [commande] [arguments]"
    echo ""
    echo "Commandes disponibles:"
    echo ""
    echo "  test-api <endpoint>      Test si une API existe"
    echo "  test-all                 Test toutes les APIs"
    echo "  list                     Liste les services Firebase"
    echo "  analyze <service>        Analyse un service"
    echo "  create-module <nom>      Crée un module backend"
    echo "  rebuild-backend          Rebuild le backend"
    echo "  rebuild-frontend         Rebuild le frontend"
    echo "  token                    Obtient un token JWT"
    echo "  help                     Affiche cette aide"
    echo ""
    echo "Exemples:"
    echo ""
    echo "  ./migration-helper.sh test-api comments"
    echo "  ./migration-helper.sh test-all"
    echo "  ./migration-helper.sh list"
    echo "  ./migration-helper.sh analyze comment"
    echo "  ./migration-helper.sh create-module departments"
    echo "  ./migration-helper.sh rebuild-backend"
    echo ""
}

# Main
case "${1:-help}" in
    test-api)
        test_api "$2"
        ;;
    test-all)
        test_all_apis
        ;;
    list)
        list_firebase_services
        ;;
    analyze)
        analyze_service "$2"
        ;;
    create-module)
        create_backend_module "$2"
        ;;
    rebuild-backend)
        rebuild_backend
        ;;
    rebuild-frontend)
        rebuild_frontend
        ;;
    token)
        token=$(get_token)
        if [ $? -eq 0 ]; then
            echo "$token"
        else
            print_error "Impossible d'obtenir un token"
            exit 1
        fi
        ;;
    help|*)
        show_help
        ;;
esac
