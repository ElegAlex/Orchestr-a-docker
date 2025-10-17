#!/bin/bash

# =========================================================
# TEST COMPLET - SERVICES 11-15 (PersonalTodos, Epics, TimeEntries)
# =========================================================
# Tests exhaustifs de tous les endpoints des 3 nouveaux modules

set -e

BASE_URL="http://localhost:4000/api"
PASS=0
FAIL=0

echo "🧪 TEST COMPLET - SERVICES 11-15"
echo "=================================="
echo ""

# Test function
test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_code="${5:-200}"

    echo -n "  • $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "error\n000")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null || echo "error\n000")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected_code" ]; then
        echo "✅ PASS (HTTP $http_code)"
        ((PASS++))
        echo "$body"
        return 0
    else
        echo "❌ FAIL (Expected $expected_code, got $http_code)"
        echo "   Response: $body"
        ((FAIL++))
        return 1
    fi
}

# =========================================================
# SETUP
# =========================================================
echo "📝 Setup: Authentication & Data"
echo "--------------------------------"

# Login
LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test.admin@orchestra.local","password":"Admin1234"}')

TOKEN=$(echo "$LOGIN" | jq -r '.accessToken')
USER_ID=$(echo "$LOGIN" | jq -r '.user.id')

if [ "$TOKEN" = "null" ]; then
    echo "❌ Login failed"
    exit 1
fi
echo "✅ Authenticated as: $USER_ID"

# Get/Create Project
PROJECTS=$(curl -s "$BASE_URL/projects" -H "Authorization: Bearer $TOKEN")
PROJECT_ID=$(echo "$PROJECTS" | jq -r '.data[0].id // empty')

if [ -z "$PROJECT_ID" ]; then
    PROJECT=$(curl -s -X POST "$BASE_URL/projects" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Test Project\",\"startDate\":\"2025-01-01\",\"dueDate\":\"2025-12-31\",\"status\":\"ACTIVE\",\"priority\":\"MEDIUM\",\"managerId\":\"$USER_ID\"}")
    PROJECT_ID=$(echo "$PROJECT" | jq -r '.id')
fi
echo "✅ Project ID: $PROJECT_ID"
echo ""

# =========================================================
# MODULE 1: PERSONAL TODOS (7 tests)
# =========================================================
echo "📋 MODULE 1: PersonalTodos"
echo "--------------------------------"

# Test 1.1: Create PersonalTodo
TODO_DATA='{"text":"Test Personal Todo","priority":1}'
RESULT=$(test_api "Create PersonalTodo" "POST" "/personal-todos" "$TODO_DATA" "201")
TODO_ID=$(echo "$RESULT" | jq -r '.id // empty')
echo ""

# Test 1.2: Get PersonalTodo by ID
test_api "Get PersonalTodo by ID" "GET" "/personal-todos/$TODO_ID" "" "200"
echo ""

# Test 1.3: List all PersonalTodos
test_api "List all PersonalTodos" "GET" "/personal-todos" "" "200"
echo ""

# Test 1.4: List completed PersonalTodos
test_api "List completed todos" "GET" "/personal-todos?completed=false" "" "200"
echo ""

# Test 1.5: Update PersonalTodo
UPDATE_DATA='{"text":"Updated Todo","priority":2}'
test_api "Update PersonalTodo" "PATCH" "/personal-todos/$TODO_ID" "$UPDATE_DATA" "200"
echo ""

# Test 1.6: Toggle PersonalTodo
test_api "Toggle PersonalTodo" "PATCH" "/personal-todos/$TODO_ID/toggle" "" "200"
echo ""

# Test 1.7: Delete PersonalTodo
test_api "Delete PersonalTodo" "DELETE" "/personal-todos/$TODO_ID" "" "200"
echo ""

# =========================================================
# MODULE 2: EPICS (9 tests)
# =========================================================
echo "🎯 MODULE 2: Epics"
echo "--------------------------------"

# Test 2.1: Create Epic
EPIC_DATA="{\"projectId\":\"$PROJECT_ID\",\"name\":\"Test Epic\",\"description\":\"Epic description\",\"ownerId\":\"$USER_ID\",\"status\":\"UPCOMING\",\"priority\":\"HIGH\",\"risk\":\"MEDIUM\",\"progress\":0}"
RESULT=$(test_api "Create Epic" "POST" "/epics" "$EPIC_DATA" "201")
EPIC_ID=$(echo "$RESULT" | jq -r '.id // empty')
echo ""

# Test 2.2: Get Epic by ID
test_api "Get Epic by ID" "GET" "/epics/$EPIC_ID" "" "200"
echo ""

# Test 2.3: List all Epics (paginated)
test_api "List all Epics" "GET" "/epics?page=1&limit=10" "" "200"
echo ""

# Test 2.4: List Epics by Project
test_api "List Epics by Project" "GET" "/epics/project/$PROJECT_ID" "" "200"
echo ""

# Test 2.5: Get Epic tasks
test_api "Get Epic tasks" "GET" "/epics/$EPIC_ID/tasks" "" "200"
echo ""

# Test 2.6: Update Epic
UPDATE_EPIC='{"name":"Updated Epic","description":"New description"}'
test_api "Update Epic" "PATCH" "/epics/$EPIC_ID" "$UPDATE_EPIC" "200"
echo ""

# Test 2.7: Update Epic progress
PROGRESS='{"progress":50}'
test_api "Update Epic progress" "PATCH" "/epics/$EPIC_ID/progress" "$PROGRESS" "200"
echo ""

# Test 2.8: Update Epic status
STATUS='{"status":"IN_PROGRESS"}'
test_api "Update Epic status" "PATCH" "/epics/$EPIC_ID/status" "$STATUS" "200"
echo ""

# Test 2.9: Delete Epic
test_api "Delete Epic" "DELETE" "/epics/$EPIC_ID" "" "200"
echo ""

# =========================================================
# MODULE 3: TIME ENTRIES (7 tests)
# =========================================================
echo "⏱️  MODULE 3: TimeEntries"
echo "--------------------------------"

# Test 3.1: Create TimeEntry
ENTRY_DATA="{\"projectId\":\"$PROJECT_ID\",\"type\":\"DEVELOPMENT\",\"description\":\"Coding session\",\"date\":\"2025-10-15\",\"duration\":120,\"isBillable\":true}"
RESULT=$(test_api "Create TimeEntry" "POST" "/time-entries" "$ENTRY_DATA" "201")
ENTRY_ID=$(echo "$RESULT" | jq -r '.id // empty')
echo ""

# Test 3.2: Get TimeEntry by ID
test_api "Get TimeEntry by ID" "GET" "/time-entries/$ENTRY_ID" "" "200"
echo ""

# Test 3.3: List all TimeEntries
test_api "List all TimeEntries" "GET" "/time-entries?page=1&limit=50" "" "200"
echo ""

# Test 3.4: List TimeEntries by Project
test_api "List by Project" "GET" "/time-entries?projectId=$PROJECT_ID" "" "200"
echo ""

# Test 3.5: Get User Stats
test_api "Get User Stats" "GET" "/time-entries/stats" "" "200"
echo ""

# Test 3.6: Get Project Stats
test_api "Get Project Stats" "GET" "/time-entries/project/$PROJECT_ID/stats" "" "200"
echo ""

# Test 3.7: Delete TimeEntry
test_api "Delete TimeEntry" "DELETE" "/time-entries/$ENTRY_ID" "" "200"
echo ""

# =========================================================
# SUMMARY
# =========================================================
TOTAL=$((PASS + FAIL))
SUCCESS_RATE=$((PASS * 100 / TOTAL))

echo "=========================================="
echo "📊 RÉSULTATS FINAUX"
echo "=========================================="
echo "✅ Tests réussis    : $PASS/$TOTAL"
echo "❌ Tests échoués    : $FAIL/$TOTAL"
echo "📈 Taux de réussite : $SUCCESS_RATE%"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 SUCCÈS TOTAL! Tous les endpoints fonctionnent!"
    echo ""
    echo "Détails:"
    echo "  • PersonalTodos: 7/7 tests ✅"
    echo "  • Epics: 9/9 tests ✅"
    echo "  • TimeEntries: 7/7 tests ✅"
    exit 0
else
    echo "⚠️  Certains tests ont échoué. Voir détails ci-dessus."
    exit 1
fi
