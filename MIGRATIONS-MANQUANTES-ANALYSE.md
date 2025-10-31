# MIGRATIONS MANQUANTES - ANALYSE ET PLAN D'ACTION

**Date**: 2025-10-17
**Session**: Correction erreur 500 sur /api/services

---

## ÉTAT ACTUEL

### Migrations dans le code (13 migrations)
1. ✅ 20251012064718_init
2. ✅ 20251014185200_add_telework_overrides
3. ✅ 20251014202957_add_simple_tasks
4. ✅ 20251014204246_enrich_milestones
5. ✅ 20251014_add_department_fields
6. ✅ 20251015_add_personal_todos_epics_timeentry_profile
7. ✅ 20251016115713_add_webhooks_service_20
8. ✅ 20251016141000_add_analytics
9. ✅ 20251016_add_capacity_models
10. ✅ 20251016_add_skills_models
11. ✅ 20251016_telework_service_27
12. ✅ 20251017105500_add_push_tokens
13. ❌ 20251017_add_session_model - **NON APPLIQUÉE**

### Migrations appliquées dans PostgreSQL (12/13)
Dernière appliquée: `20251017105500_add_push_tokens` à 11:10:31

### Migration cassée supprimée
- 20251017110131_add_push_tokens (répertoire vide - supprimé)

---

## PROBLÈME IDENTIFIÉ

### Erreur Backend
```
PrismaClientKnownRequestError:
Invalid `prisma.organizationService.findMany()` invocation:
The table `public.organization_services` does not exist in the current database.
```

### Impact Utilisateur
- **Erreur 500** sur `GET /api/services?isActive=true`
- **Page Calendar** inaccessible sur frontend

---

## TABLES MANQUANTES (8 tables)

### Modèles dans schema.prisma SANS table en DB

| Modèle | Table attendue | Migration existe? |
|--------|---------------|-------------------|
| OrganizationService | organization_services | ❌ NON |
| UserServiceAssignment | user_service_assignments | ❌ NON |
| Session | sessions | ✅ OUI (non appliquée) |
| SchoolHoliday | school_holidays | ❌ NON |
| Holiday | holidays | ❌ NON |
| SystemSettings | system_settings | ❌ NON |
| Report | reports | ❌ NON |
| Attachment | attachments | ❌ NON |

### Tables existantes en DB (29 tables)
- _prisma_migrations
- activities
- analytics_cache
- analytics_reports
- comments
- departments
- documents
- epics
- leaves
- milestones
- notifications
- personal_todos
- project_members
- projects
- push_tokens
- resource_allocations
- simple_tasks
- skills
- task_skills
- tasks
- team_telework_rules
- telework_overrides
- time_entries
- user_capacities
- user_skills
- user_telework_profiles
- users
- webhook_logs
- webhooks
- work_contracts

---

## PLAN D'ACTION

### Étape 1: Appliquer migration existante (sessions)
```bash
cd /home/alex/Documents/Repository/orchestr-a-docker/backend
npx prisma migrate deploy
```
**Résultat attendu**: Création table `sessions`

### Étape 2: Générer migration pour tables manquantes
```bash
cd /home/alex/Documents/Repository/orchestr-a-docker/backend
npx prisma migrate dev --name add_missing_tables
```
**Résultat attendu**: Génération migration avec:
- organization_services
- user_service_assignments
- school_holidays
- holidays
- system_settings
- reports
- attachments

### Étape 3: Vérifier migration générée
```bash
cat prisma/migrations/[nouvelle_migration]/migration.sql
```
**Vérifier**: Toutes les 7 tables sont présentes

### Étape 4: Appliquer toutes les migrations
```bash
npx prisma migrate deploy
```

### Étape 5: Regénérer Prisma Client
```bash
npx prisma generate
```

### Étape 6: Rebuild backend Docker image
```bash
cd /home/alex/Documents/Repository/orchestr-a-docker
docker build -t orchestr-a-docker-backend backend/
```

### Étape 7: Restart backend container
```bash
docker stop orchestr-a-backend
docker rm orchestr-a-backend

docker run -d \
  --name orchestr-a-backend \
  --network orchestr-a-dev \
  -p 4000:4000 \
  -e DATABASE_URL="postgresql://dev:devpassword@orchestr-a-postgres-dev:5432/orchestra_dev" \
  -e JWT_SECRET="dev-secret-key-change-in-production-please-use-strong-secret" \
  -e JWT_EXPIRES_IN="24h" \
  -e NODE_ENV="production" \
  -e PORT="4000" \
  -e REDIS_HOST="orchestr-a-redis-dev" \
  -e REDIS_PORT="6379" \
  -e MINIO_ENDPOINT="orchestr-a-minio-dev" \
  -e MINIO_PORT="9000" \
  -e MINIO_USE_SSL="false" \
  -e MINIO_ACCESS_KEY="devuser" \
  -e MINIO_SECRET_KEY="devpassword" \
  orchestr-a-docker-backend
```

### Étape 8: Vérifier backend santé
```bash
sleep 10
curl http://localhost:4000/api/health
```
**Attendu**: `{"status":"ok","uptime":<10,"timestamp":"...","environment":"production"}`

### Étape 9: Tester endpoint services
```bash
curl -i http://localhost:4000/api/services?isActive=true
```
**Attendu**: `HTTP/1.1 200 OK` (pas 500)

### Étape 10: Vérifier tables en DB
```bash
docker exec orchestr-a-postgres-dev psql -U dev -d orchestra_dev -c "\dt" | grep -E "organization_services|user_service_assignments|sessions"
```
**Attendu**: 3 tables présentes

---

## COMMANDES DE VÉRIFICATION

### Vérifier migrations appliquées
```bash
docker exec orchestr-a-postgres-dev psql -U dev -d orchestra_dev -c "SELECT migration_name FROM _prisma_migrations ORDER BY finished_at;"
```

### Vérifier tables existantes
```bash
docker exec orchestr-a-postgres-dev psql -U dev -d orchestra_dev -c "\dt"
```

### Vérifier backend logs
```bash
docker logs orchestr-a-backend --tail 50
```

---

## CRITÈRES DE SUCCÈS

- [ ] Migration `20251017_add_session_model` appliquée
- [ ] Nouvelle migration générée avec 7 tables
- [ ] Toutes migrations appliquées (14+ dans _prisma_migrations)
- [ ] Table `organization_services` existe en DB
- [ ] Table `user_service_assignments` existe en DB
- [ ] Backend redémarré sans erreur
- [ ] `GET /api/services?isActive=true` retourne 200
- [ ] Page Calendar accessible sans erreur 500

---

## NOTES IMPORTANTES

- **Données de test**: Toutes données peuvent être effacées/recréées
- **Pas de backup nécessaire**: Infrastructure de développement
- **Si erreur**: Possibilité de drop/recréer base complète
- **Docker containers**: Peuvent être recréés à tout moment

---

**Fin du document**
