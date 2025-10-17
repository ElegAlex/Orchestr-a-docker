#!/bin/bash

# Test simple des nouveaux modules
set -e

BASE_URL="http://localhost:4000/api"

echo "=== TEST NOUVEAUX MODULES ==="
echo ""

# 1. Login
echo "1. Login..."
LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test.admin@orchestra.local","password":"Admin1234"}')

TOKEN=$(echo "$LOGIN" | jq -r '.accessToken')
USER_ID=$(echo "$LOGIN" | jq -r '.user.id')

if [ "$TOKEN" = "null" ]; then
    echo "❌ Login failed"
    exit 1
fi
echo "✅ Login OK (User: $USER_ID)"
echo ""

# 2. Get a project ID
echo "2. Getting project..."
PROJECTS=$(curl -s "$BASE_URL/projects" -H "Authorization: Bearer $TOKEN")
PROJECT_ID=$(echo "$PROJECTS" | jq -r '.data[0].id // empty')

if [ -z "$PROJECT_ID" ]; then
    echo "⚠️  No project, creating one..."
    PROJECT=$(curl -s -X POST "$BASE_URL/projects" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Test\",\"startDate\":\"2025-01-01\",\"dueDate\":\"2025-12-31\",\"status\":\"ACTIVE\",\"priority\":\"MEDIUM\",\"managerId\":\"$USER_ID\"}")
    PROJECT_ID=$(echo "$PROJECT" | jq -r '.id')
fi
echo "✅ Project: $PROJECT_ID"
echo ""

# 3. Test PersonalTodos
echo "3. Testing PersonalTodos..."
TODO=$(curl -s -X POST "$BASE_URL/personal-todos" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"text":"Test todo","priority":1}')
TODO_ID=$(echo "$TODO" | jq -r '.id // "error"')

if [ "$TODO_ID" = "error" ]; then
    echo "❌ Create PersonalTodo failed: $TODO"
    exit 1
fi
echo "✅ Created PersonalTodo: $TODO_ID"

TODOS=$(curl -s "$BASE_URL/personal-todos" -H "Authorization: Bearer $TOKEN")
COUNT=$(echo "$TODOS" | jq '. | length')
echo "✅ List PersonalTodos: $COUNT todos"
echo ""

# 4. Test Epics
echo "4. Testing Epics..."
EPIC=$(curl -s -X POST "$BASE_URL/epics" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"projectId\":\"$PROJECT_ID\",\"name\":\"Test Epic\",\"ownerId\":\"$USER_ID\",\"status\":\"UPCOMING\"}")
EPIC_ID=$(echo "$EPIC" | jq -r '.id // "error"')

if [ "$EPIC_ID" = "error" ]; then
    echo "❌ Create Epic failed: $EPIC"
    exit 1
fi
echo "✅ Created Epic: $EPIC_ID"

EPICS=$(curl -s "$BASE_URL/epics" -H "Authorization: Bearer $TOKEN")
EPIC_COUNT=$(echo "$EPICS" | jq '.data | length')
echo "✅ List Epics: $EPIC_COUNT epics"
echo ""

# 5. Test TimeEntries
echo "5. Testing TimeEntries..."
ENTRY=$(curl -s -X POST "$BASE_URL/time-entries" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"projectId\":\"$PROJECT_ID\",\"type\":\"DEVELOPMENT\",\"date\":\"2025-10-15\",\"duration\":120}")
ENTRY_ID=$(echo "$ENTRY" | jq -r '.id // "error"')

if [ "$ENTRY_ID" = "error" ]; then
    echo "❌ Create TimeEntry failed: $ENTRY"
    exit 1
fi
echo "✅ Created TimeEntry: $ENTRY_ID"

ENTRIES=$(curl -s "$BASE_URL/time-entries" -H "Authorization: Bearer $TOKEN")
ENTRY_COUNT=$(echo "$ENTRIES" | jq '.data | length')
echo "✅ List TimeEntries: $ENTRY_COUNT entries"

STATS=$(curl -s "$BASE_URL/time-entries/stats" -H "Authorization: Bearer $TOKEN")
TOTAL_HOURS=$(echo "$STATS" | jq -r '.totalHours')
echo "✅ TimeEntry Stats: $TOTAL_HOURS hours"
echo ""

# Summary
echo "================================"
echo "✅ TOUS LES TESTS RÉUSSIS!"
echo "================================"
echo "PersonalTodos: $COUNT todos"
echo "Epics: $EPIC_COUNT epics"
echo "TimeEntries: $ENTRY_COUNT entries ($TOTAL_HOURS hours)"
echo ""
exit 0
