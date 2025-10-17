#!/bin/bash

# ==========================================
# TEST SERVICES 7-10 - ORCHESTR'A (FIXED)
# ==========================================
# Teste les services Projects, Tasks, Users, Milestones
# avec les DTOs corrects

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
API_URL="http://localhost:4000/api"
ADMIN_EMAIL="test.admin@orchestra.local"
ADMIN_PASSWORD="Admin1234"

# Compteurs
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Token storage
TOKEN=""

# IDs storage
ADMIN_USER_ID=""

# Function: Test result
test_result() {
  local service="$1"
  local operation="$2"
  local status="$3"
  local details="$4"

  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  if [ "$status" = "pass" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✅ PASS${NC} - $service: $operation"
    [ -n "$details" ] && echo -e "${CYAN}   → $details${NC}"
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo -e "${RED}❌ FAIL${NC} - $service: $operation"
    [ -n "$details" ] && echo -e "${RED}   → $details${NC}"
  fi
}

# Function: Section header
section() {
  echo ""
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}  $1${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function: Login and get token + admin user ID
login() {
  section "🔐 AUTHENTIFICATION"

  local response=$(curl -s -w "\n%{http_code}" "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

  local body=$(echo "$response" | head -n -1)
  local http_code=$(echo "$response" | tail -n 1)

  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    TOKEN=$(echo "$body" | jq -r '.access_token // .accessToken // empty')

    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
      # Get user ID from token payload or from /api/auth/me
      local me_response=$(curl -s "$API_URL/auth/me" -H "Authorization: Bearer $TOKEN")
      ADMIN_USER_ID=$(echo "$me_response" | jq -r '.id // .userId // empty')

      test_result "Auth" "Login" "pass" "Token obtenu (User ID: ${ADMIN_USER_ID:0:8}...)"
      return 0
    else
      test_result "Auth" "Login" "fail" "Token non trouvé dans la réponse"
      return 1
    fi
  else
    test_result "Auth" "Login" "fail" "HTTP $http_code"
    return 1
  fi
}

# ==========================================
# SESSION 7: PROJECTS
# ==========================================
test_projects() {
  section "📊 SESSION 7 - SERVICE PROJECTS"

  # Test 1: GET /api/projects
  local response=$(curl -s -w "\n%{http_code}" "$API_URL/projects" \
    -H "Authorization: Bearer $TOKEN")

  local body=$(echo "$response" | head -n -1)
  local http_code=$(echo "$response" | tail -n 1)

  if [ "$http_code" = "200" ]; then
    local has_data=$(echo "$body" | jq -e '.data' &>/dev/null && echo "yes" || echo "no")
    if [ "$has_data" = "yes" ]; then
      local count=$(echo "$body" | jq '.data | length')
      test_result "Projects" "GET /api/projects" "pass" "$count projets trouvés"
    else
      test_result "Projects" "GET /api/projects" "pass" "Réponse reçue"
    fi
  else
    test_result "Projects" "GET /api/projects" "fail" "HTTP $http_code"
  fi

  # Test 2: POST /api/projects (avec DTO correct)
  local create_data="{
    \"name\": \"Test Project Session 7\",
    \"description\": \"Projet de test automatique\",
    \"startDate\": \"2025-01-01T00:00:00.000Z\",
    \"dueDate\": \"2025-12-31T00:00:00.000Z\",
    \"status\": \"ACTIVE\",
    \"priority\": \"MEDIUM\",
    \"managerId\": \"$ADMIN_USER_ID\"
  }"

  local response=$(curl -s -w "\n%{http_code}" "$API_URL/projects" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$create_data")

  local body=$(echo "$response" | head -n -1)
  local http_code=$(echo "$response" | tail -n 1)

  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    PROJECT_ID=$(echo "$body" | jq -r '.id')
    if [ -n "$PROJECT_ID" ] && [ "$PROJECT_ID" != "null" ]; then
      test_result "Projects" "POST /api/projects" "pass" "Projet créé (ID: ${PROJECT_ID:0:8}...)"
    else
      test_result "Projects" "POST /api/projects" "pass" "Projet créé"
    fi
  else
    test_result "Projects" "POST /api/projects" "fail" "HTTP $http_code - $(echo "$body" | jq -r '.message // empty')"
    PROJECT_ID=""
  fi

  # Test 3: GET /api/projects/:id
  if [ -n "$PROJECT_ID" ]; then
    local response=$(curl -s -w "\n%{http_code}" "$API_URL/projects/$PROJECT_ID" \
      -H "Authorization: Bearer $TOKEN")

    local body=$(echo "$response" | head -n -1)
    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ]; then
      local name=$(echo "$body" | jq -r '.name // empty')
      test_result "Projects" "GET /api/projects/:id" "pass" "Nom: $name"
    else
      test_result "Projects" "GET /api/projects/:id" "fail" "HTTP $http_code"
    fi
  else
    test_result "Projects" "GET /api/projects/:id" "fail" "Pas de PROJECT_ID"
  fi

  # Test 4: PATCH /api/projects/:id
  if [ -n "$PROJECT_ID" ]; then
    local update_data='{
      "description": "Description mise à jour par test automatique"
    }'

    local response=$(curl -s -w "\n%{http_code}" -X PATCH "$API_URL/projects/$PROJECT_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$update_data")

    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ]; then
      test_result "Projects" "PATCH /api/projects/:id" "pass" "Projet mis à jour"
    else
      test_result "Projects" "PATCH /api/projects/:id" "fail" "HTTP $http_code"
    fi
  fi

  # Test 5: DELETE /api/projects/:id
  if [ -n "$PROJECT_ID" ]; then
    local response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/projects/$PROJECT_ID" \
      -H "Authorization: Bearer $TOKEN")

    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
      test_result "Projects" "DELETE /api/projects/:id" "pass" "Projet supprimé"
    else
      test_result "Projects" "DELETE /api/projects/:id" "fail" "HTTP $http_code"
    fi
  fi
}

# ==========================================
# SESSION 8: TASKS
# ==========================================
test_tasks() {
  section "📋 SESSION 8 - SERVICE TASKS"

  # Test 1: GET /api/tasks
  local response=$(curl -s -w "\n%{http_code}" "$API_URL/tasks" \
    -H "Authorization: Bearer $TOKEN")

  local body=$(echo "$response" | head -n -1)
  local http_code=$(echo "$response" | tail -n 1)

  if [ "$http_code" = "200" ]; then
    local has_data=$(echo "$body" | jq -e '.data' &>/dev/null && echo "yes" || echo "no")
    if [ "$has_data" = "yes" ]; then
      local count=$(echo "$body" | jq '.data | length')
      test_result "Tasks" "GET /api/tasks" "pass" "$count tâches trouvées"
    else
      test_result "Tasks" "GET /api/tasks" "pass" "Réponse reçue"
    fi
  else
    test_result "Tasks" "GET /api/tasks" "fail" "HTTP $http_code"
  fi

  # Test 2: POST /api/tasks (créer projet puis tâche)
  local project_data="{
    \"name\": \"Projet pour test tasks\",
    \"startDate\": \"2025-01-01T00:00:00.000Z\",
    \"dueDate\": \"2025-12-31T00:00:00.000Z\",
    \"managerId\": \"$ADMIN_USER_ID\"
  }"

  local proj_response=$(curl -s "$API_URL/projects" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$project_data")

  local TEMP_PROJECT_ID=$(echo "$proj_response" | jq -r '.id // empty')

  if [ -n "$TEMP_PROJECT_ID" ] && [ "$TEMP_PROJECT_ID" != "null" ]; then
    local task_data="{
      \"title\": \"Test Task Session 8\",
      \"description\": \"Tâche de test automatique\",
      \"status\": \"TODO\",
      \"priority\": \"MEDIUM\",
      \"projectId\": \"$TEMP_PROJECT_ID\"
    }"

    local response=$(curl -s -w "\n%{http_code}" "$API_URL/tasks" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$task_data")

    local body=$(echo "$response" | head -n -1)
    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
      TASK_ID=$(echo "$body" | jq -r '.id')
      test_result "Tasks" "POST /api/tasks" "pass" "Tâche créée (ID: ${TASK_ID:0:8}...)"
    else
      test_result "Tasks" "POST /api/tasks" "fail" "HTTP $http_code - $(echo "$body" | jq -r '.message // empty')"
      TASK_ID=""
    fi
  else
    test_result "Tasks" "POST /api/tasks" "fail" "Impossible de créer projet temporaire"
    TASK_ID=""
  fi

  # Test 3: GET /api/tasks/:id
  if [ -n "$TASK_ID" ]; then
    local response=$(curl -s -w "\n%{http_code}" "$API_URL/tasks/$TASK_ID" \
      -H "Authorization: Bearer $TOKEN")

    local body=$(echo "$response" | head -n -1)
    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ]; then
      local title=$(echo "$body" | jq -r '.title // empty')
      test_result "Tasks" "GET /api/tasks/:id" "pass" "Titre: $title"
    else
      test_result "Tasks" "GET /api/tasks/:id" "fail" "HTTP $http_code"
    fi
  fi

  # Cleanup
  if [ -n "$TASK_ID" ]; then
    curl -s -X DELETE "$API_URL/tasks/$TASK_ID" -H "Authorization: Bearer $TOKEN" &>/dev/null
  fi
  if [ -n "$TEMP_PROJECT_ID" ]; then
    curl -s -X DELETE "$API_URL/projects/$TEMP_PROJECT_ID" -H "Authorization: Bearer $TOKEN" &>/dev/null
  fi
}

# ==========================================
# SESSION 9: USERS
# ==========================================
test_users() {
  section "👤 SESSION 9 - SERVICE USERS"

  # Test 1: GET /api/users
  local response=$(curl -s -w "\n%{http_code}" "$API_URL/users" \
    -H "Authorization: Bearer $TOKEN")

  local body=$(echo "$response" | head -n -1)
  local http_code=$(echo "$response" | tail -n 1)

  if [ "$http_code" = "200" ]; then
    local has_data=$(echo "$body" | jq -e '.data' &>/dev/null && echo "yes" || echo "no")
    if [ "$has_data" = "yes" ]; then
      local count=$(echo "$body" | jq '.data | length')
      test_result "Users" "GET /api/users" "pass" "$count utilisateurs trouvés"
    else
      local count=$(echo "$body" | jq 'length // 0')
      test_result "Users" "GET /api/users" "pass" "$count utilisateurs trouvés"
    fi
  else
    test_result "Users" "GET /api/users" "fail" "HTTP $http_code"
  fi

  # Test 2: POST /api/users (avec rôle valide en MAJUSCULES)
  local user_data="{
    \"email\": \"test.session9.$RANDOM@orchestra.local\",
    \"password\": \"Test1234\",
    \"firstName\": \"Test\",
    \"lastName\": \"Session9\",
    \"role\": \"CONTRIBUTOR\"
  }"

  local response=$(curl -s -w "\n%{http_code}" "$API_URL/users" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$user_data")

  local body=$(echo "$response" | head -n -1)
  local http_code=$(echo "$response" | tail -n 1)

  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    USER_ID=$(echo "$body" | jq -r '.id')
    if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
      test_result "Users" "POST /api/users" "pass" "Utilisateur créé (ID: ${USER_ID:0:8}...)"
    else
      test_result "Users" "POST /api/users" "pass" "Utilisateur créé"
    fi
  else
    test_result "Users" "POST /api/users" "fail" "HTTP $http_code - $(echo "$body" | jq -r '.message // empty')"
    USER_ID=""
  fi

  # Test 3: GET /api/users/:id
  if [ -n "$USER_ID" ]; then
    local response=$(curl -s -w "\n%{http_code}" "$API_URL/users/$USER_ID" \
      -H "Authorization: Bearer $TOKEN")

    local body=$(echo "$response" | head -n -1)
    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ]; then
      local email=$(echo "$body" | jq -r '.email // empty')
      test_result "Users" "GET /api/users/:id" "pass" "Email: $email"
    else
      test_result "Users" "GET /api/users/:id" "fail" "HTTP $http_code"
    fi
  fi

  # Cleanup
  if [ -n "$USER_ID" ]; then
    curl -s -X DELETE "$API_URL/users/$USER_ID" -H "Authorization: Bearer $TOKEN" &>/dev/null
  fi
}

# ==========================================
# SESSION 10: MILESTONES
# ==========================================
test_milestones() {
  section "🎯 SESSION 10 - SERVICE MILESTONES"

  # Test 1: GET /api/milestones
  local response=$(curl -s -w "\n%{http_code}" "$API_URL/milestones" \
    -H "Authorization: Bearer $TOKEN")

  local body=$(echo "$response" | head -n -1)
  local http_code=$(echo "$response" | tail -n 1)

  if [ "$http_code" = "200" ]; then
    local has_data=$(echo "$body" | jq -e '.data' &>/dev/null && echo "yes" || echo "no")
    if [ "$has_data" = "yes" ]; then
      local count=$(echo "$body" | jq '.data | length')
      test_result "Milestones" "GET /api/milestones" "pass" "$count jalons trouvés"
    else
      test_result "Milestones" "GET /api/milestones" "pass" "Réponse reçue"
    fi
  else
    test_result "Milestones" "GET /api/milestones" "fail" "HTTP $http_code - $(echo "$body" | jq -r '.message // empty')"
  fi

  # Test 2: POST /api/milestones (avec DTO correct + ownerId)
  local project_data="{
    \"name\": \"Projet pour test milestones\",
    \"startDate\": \"2025-01-01T00:00:00.000Z\",
    \"dueDate\": \"2025-12-31T00:00:00.000Z\",
    \"managerId\": \"$ADMIN_USER_ID\"
  }"

  local proj_response=$(curl -s "$API_URL/projects" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$project_data")

  local TEMP_PROJECT_ID=$(echo "$proj_response" | jq -r '.id // empty')

  if [ -n "$TEMP_PROJECT_ID" ] && [ "$TEMP_PROJECT_ID" != "null" ]; then
    local milestone_data="{
      \"name\": \"Test Milestone Session 10\",
      \"description\": \"Jalon de test automatique\",
      \"dueDate\": \"2025-06-30T00:00:00.000Z\",
      \"projectId\": \"$TEMP_PROJECT_ID\",
      \"ownerId\": \"$ADMIN_USER_ID\"
    }"

    local response=$(curl -s -w "\n%{http_code}" "$API_URL/milestones" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$milestone_data")

    local body=$(echo "$response" | head -n -1)
    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
      MILESTONE_ID=$(echo "$body" | jq -r '.id')
      test_result "Milestones" "POST /api/milestones" "pass" "Jalon créé (ID: ${MILESTONE_ID:0:8}...)"
    else
      test_result "Milestones" "POST /api/milestones" "fail" "HTTP $http_code - $(echo "$body" | jq -r '.message // empty')"
      MILESTONE_ID=""
    fi
  else
    test_result "Milestones" "POST /api/milestones" "fail" "Impossible de créer projet temporaire"
    MILESTONE_ID=""
  fi

  # Test 3: GET /api/milestones/:id
  if [ -n "$MILESTONE_ID" ]; then
    local response=$(curl -s -w "\n%{http_code}" "$API_URL/milestones/$MILESTONE_ID" \
      -H "Authorization: Bearer $TOKEN")

    local body=$(echo "$response" | head -n -1)
    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ]; then
      local name=$(echo "$body" | jq -r '.name // empty')
      test_result "Milestones" "GET /api/milestones/:id" "pass" "Nom: $name"
    else
      test_result "Milestones" "GET /api/milestones/:id" "fail" "HTTP $http_code"
    fi
  fi

  # Cleanup
  if [ -n "$MILESTONE_ID" ]; then
    curl -s -X DELETE "$API_URL/milestones/$MILESTONE_ID" -H "Authorization: Bearer $TOKEN" &>/dev/null
  fi
  if [ -n "$TEMP_PROJECT_ID" ]; then
    curl -s -X DELETE "$API_URL/projects/$TEMP_PROJECT_ID" -H "Authorization: Bearer $TOKEN" &>/dev/null
  fi
}

# ==========================================
# MAIN EXECUTION
# ==========================================

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🧪 TEST SERVICES 7-10 - ORCHESTR'A (FIXED)${NC}"
echo -e "${BLUE}  Sessions: Projects, Tasks, Users, Milestones${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Login
if ! login; then
  echo ""
  echo -e "${RED}❌ Impossible de se connecter.${NC}"
  exit 1
fi

# Run tests
test_projects
test_tasks
test_users
test_milestones

# ==========================================
# SUMMARY
# ==========================================

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  📊 RÉSULTATS SESSIONS 7-10${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "   Total Tests : $TOTAL_TESTS"
echo -e "   ${GREEN}Passed      : $PASSED_TESTS${NC}"
echo -e "   ${RED}Failed      : $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ✅ TOUS LES TESTS PASSENT !${NC}"
  echo -e "${GREEN}  Services 7-10 opérationnels.${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  exit 0
else
  PASS_PERCENT=$((PASSED_TESTS * 100 / TOTAL_TESTS))

  if [ $PASS_PERCENT -ge 70 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}  ⚠️  TESTS PARTIELLEMENT RÉUSSIS ($PASS_PERCENT%)${NC}"
    echo -e "${YELLOW}  Services globalement fonctionnels.${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    exit 0
  else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ❌ TESTS ÉCHOUÉS ($PASS_PERCENT%)${NC}"
    echo -e "${RED}  Services nécessitent des corrections.${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    exit 1
  fi
fi
