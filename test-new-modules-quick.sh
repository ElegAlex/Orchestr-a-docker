#!/bin/bash

# =====================================================
# TEST RAPIDE - NOUVEAUX MODULES (Sessions 11-15)
# =====================================================
# Test des 3 nouveaux modules backend:
# - PersonalTodos
# - Epics
# - TimeEntries

set -e

BASE_URL="http://localhost:4000/api"
PASS_COUNT=0
FAIL_COUNT=0

echo "🧪 TEST RAPIDE DES NOUVEAUX MODULES"
echo "===================================="
echo ""

# Fonction de test
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_code="$5"

    echo -n "Testing $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected_code" ]; then
        echo "✅ PASS (HTTP $http_code)"
        ((PASS_COUNT++))
        return 0
    else
        echo "❌ FAIL (Expected $expected_code, got $http_code)"
        echo "Response: $body"
        ((FAIL_COUNT++))
        return 1
    fi
}

# 1. LOGIN
echo "📝 Step 1: Authentication"
echo "-------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test.admin@orchestra.local",
        "password": "Admin1234"
    }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Login FAILED"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login successful"
echo ""

# Récupérer l'ID de l'utilisateur et d'un projet
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')
echo "User ID: $USER_ID"

# Récupérer un projet pour les tests
PROJECT_RESPONSE=$(curl -s "$BASE_URL/projects" -H "Authorization: Bearer $TOKEN")
PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.data[0].id // empty')

if [ -z "$PROJECT_ID" ]; then
    echo "⚠️  No project found, creating one..."
    CREATE_PROJECT=$(curl -s -X POST "$BASE_URL/projects" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Test Project Quick\",
            \"description\": \"Project for quick tests\",
            \"startDate\": \"2025-01-01T00:00:00.000Z\",
            \"dueDate\": \"2025-12-31T00:00:00.000Z\",
            \"status\": \"ACTIVE\",
            \"priority\": \"MEDIUM\",
            \"managerId\": \"$USER_ID\"
        }")
    PROJECT_ID=$(echo $CREATE_PROJECT | jq -r '.id')
fi

echo "Project ID: $PROJECT_ID"
echo ""

# =====================================================
# TEST MODULE 1: PERSONAL TODOS
# =====================================================
echo "📝 Module 1: PersonalTodos"
echo "-------------------------"

# Test 1.1: Create PersonalTodo
TODO_DATA='{
    "text": "Test personal todo",
    "priority": 1
}'
test_endpoint "Create PersonalTodo" "POST" "/personal-todos" "$TODO_DATA" "201"

# Test 1.2: List PersonalTodos
test_endpoint "List PersonalTodos" "GET" "/personal-todos" "" "200"

echo ""

# =====================================================
# TEST MODULE 2: EPICS
# =====================================================
echo "📝 Module 2: Epics"
echo "-------------------------"

# Test 2.1: Create Epic
EPIC_DATA="{
    \"projectId\": \"$PROJECT_ID\",
    \"name\": \"Test Epic\",
    \"description\": \"Epic de test\",
    \"status\": \"UPCOMING\",
    \"priority\": \"HIGH\",
    \"risk\": \"MEDIUM\",
    \"ownerId\": \"$USER_ID\",
    \"progress\": 0
}"
test_endpoint "Create Epic" "POST" "/epics" "$EPIC_DATA" "201"

# Test 2.2: List Epics
test_endpoint "List Epics" "GET" "/epics" "" "200"

# Test 2.3: List Epics by Project
test_endpoint "List Epics by Project" "GET" "/epics/project/$PROJECT_ID" "" "200"

echo ""

# =====================================================
# TEST MODULE 3: TIME ENTRIES
# =====================================================
echo "📝 Module 3: TimeEntries"
echo "-------------------------"

# Test 3.1: Create TimeEntry
TIME_ENTRY_DATA="{
    \"projectId\": \"$PROJECT_ID\",
    \"type\": \"DEVELOPMENT\",
    \"description\": \"Test time entry\",
    \"date\": \"2025-10-15T00:00:00.000Z\",
    \"duration\": 120,
    \"isBillable\": true
}"
test_endpoint "Create TimeEntry" "POST" "/time-entries" "$TIME_ENTRY_DATA" "201"

# Test 3.2: List TimeEntries
test_endpoint "List TimeEntries" "GET" "/time-entries" "" "200"

# Test 3.3: Get TimeEntry Stats
test_endpoint "Get TimeEntry Stats" "GET" "/time-entries/stats" "" "200"

echo ""

# =====================================================
# RÉSULTATS
# =====================================================
TOTAL=$((PASS_COUNT + FAIL_COUNT))
SUCCESS_RATE=$((PASS_COUNT * 100 / TOTAL))

echo "======================================"
echo "📊 RÉSULTATS DU TEST RAPIDE"
echo "======================================"
echo "✅ Tests réussis   : $PASS_COUNT/$TOTAL"
echo "❌ Tests échoués   : $FAIL_COUNT/$TOTAL"
echo "📈 Taux de réussite: $SUCCESS_RATE%"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 TOUS LES TESTS SONT PASSÉS! Backend Phase 1 COMPLET!"
    exit 0
else
    echo "⚠️  Certains tests ont échoué. Vérifiez les logs ci-dessus."
    exit 1
fi
