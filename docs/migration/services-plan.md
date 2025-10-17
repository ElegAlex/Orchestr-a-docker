# 📋 Plan de Migration - Services Firebase → API REST

**Date:** 2025-10-14
**Objectif:** Migrer les 35 services Firebase restants vers l'API NestJS

---

## 📊 État Actuel

### ✅ Services Déjà Migrés (6/41)
1. ✅ `project.service.ts` - Gestion projets → API REST
2. ✅ `task.service.ts` - Gestion tâches → API REST
3. ✅ `user.service.ts` - Gestion utilisateurs → API REST
4. ✅ `comment.service.ts` - Commentaires → API REST
5. ✅ `document.service.ts` - Documents → API REST
6. ✅ `leave.service.ts` - Congés → API REST

### 🔴 Services Firebase Restants (35/41)

**Backend Prisma Models existants:**
- ✅ User (utilisé)
- ✅ Department (modèle existe, API manquante)
- ✅ Project (utilisé)
- ✅ Task (utilisé)
- ✅ Milestone (modèle existe, API manquante)
- ✅ Comment (utilisé)
- ✅ Document (utilisé)
- ✅ Leave (utilisé)
- ✅ Notification (modèle existe, API manquante)
- ✅ Activity (modèle existe, API manquante)

---

## 🎯 Plan de Migration par Phases

### **PHASE 1 - Services Critiques (Priorité HAUTE)** 🔴

Ces services sont utilisés dans les pages principales et bloquent certaines fonctionnalités.

#### 1.1 Department Service (CRITIQUE)
- **Fichier:** `department.service.ts`
- **API Backend:** ❌ À créer
- **Modèle Prisma:** ✅ Existe
- **Impact:** Bloque HRAdmin, filtrage par département
- **Estimation:** 2h
- **Dépendances:** Aucune

**Actions:**
1. Créer module backend `departments`
2. Créer DTOs (CreateDepartmentDto, UpdateDepartmentDto)
3. Créer controller avec CRUD
4. Migrer `department.service.ts` pour utiliser API
5. Tester avec HRAdmin

---

#### 1.2 Milestone Service (CRITIQUE)
- **Fichier:** `milestone.service.ts`
- **API Backend:** ❌ À créer
- **Modèle Prisma:** ✅ Existe
- **Impact:** Gestion des jalons de projet
- **Estimation:** 2h
- **Dépendances:** Projects, Tasks

**Actions:**
1. Créer module backend `milestones`
2. Créer DTOs avec relations
3. Créer controller avec CRUD + relations projet
4. Migrer `milestone.service.ts`
5. Tester affichage jalons dans ProjectDetail

---

#### 1.3 Presence Service (CRITIQUE)
- **Fichier:** `presence.service.ts`
- **API Backend:** ❌ À créer (nouveau modèle)
- **Modèle Prisma:** ❌ À créer
- **Impact:** Pointage, présences journalières
- **Estimation:** 3h
- **Dépendances:** Users, Leaves, Departments

**Actions:**
1. Créer modèle Prisma `Presence`
2. Migration base de données
3. Créer module backend `presences`
4. Migrer `presence.service.ts`
5. Tester PresenceModal

---

#### 1.4 SimpleTask Service (CRITIQUE)
- **Fichier:** `simpleTask.service.ts`
- **API Backend:** ⚠️ Utilise le modèle Task (déjà existant)
- **Modèle Prisma:** ✅ Task existe
- **Impact:** Dashboard simple, widgets
- **Estimation:** 1h
- **Dépendances:** Tasks

**Actions:**
1. Analyser la différence entre Task et SimpleTask
2. Adapter endpoints `/api/tasks` si nécessaire
3. Migrer `simpleTask.service.ts` vers `/api/tasks`
4. Tester DashboardHub

---

### **PHASE 2 - Services Importants (Priorité MOYENNE)** 🟡

Services utilisés mais non bloquants pour l'usage de base.

#### 2.1 Holiday Service
- **Fichier:** `holiday.service.ts`
- **API Backend:** ❌ À créer (nouveau modèle)
- **Modèle Prisma:** ❌ À créer
- **Estimation:** 2h
- **Impact:** Jours fériés, calcul congés

#### 2.2 SchoolHolidays Service
- **Fichier:** `schoolHolidays.service.ts`
- **API Backend:** ❌ À créer (nouveau modèle)
- **Modèle Prisma:** ❌ À créer
- **Estimation:** 1.5h
- **Impact:** Vacances scolaires

#### 2.3 Epic Service
- **Fichier:** `epic.service.ts`
- **API Backend:** ❌ À créer (nouveau modèle)
- **Modèle Prisma:** ❌ À créer
- **Estimation:** 2.5h
- **Impact:** Gestion des epics (features grandes)

#### 2.4 Service Service (organisationnel)
- **Fichier:** `service.service.ts`
- **API Backend:** ❌ À créer (nouveau modèle)
- **Modèle Prisma:** ❌ À créer
- **Estimation:** 1.5h
- **Impact:** Services/Départements organisationnels

#### 2.5 PersonalTodo Service
- **Fichier:** `personalTodo.service.ts`
- **API Backend:** ❌ À créer (nouveau modèle)
- **Modèle Prisma:** ❌ À créer
- **Estimation:** 1.5h
- **Impact:** Tâches personnelles utilisateur

#### 2.6 Session Service
- **Fichier:** `session.service.ts`
- **API Backend:** ❌ À créer (nouveau modèle)
- **Modèle Prisma:** ❌ À créer
- **Estimation:** 2h
- **Impact:** Sessions de travail, temps passé

---

### **PHASE 3 - Services RH/Télétravail (Priorité MOYENNE)** 🟡

#### 3.1 Remote Work Service
- **Fichier:** `remote-work.service.ts`
- **Estimation:** 2h
- **Impact:** Demandes de télétravail

#### 3.2 Telework V2 Service
- **Fichier:** `telework-v2.service.ts`
- **Estimation:** 2h
- **Impact:** Gestion télétravail v2

#### 3.3 Capacity Service
- **Fichier:** `capacity.service.ts`
- **Estimation:** 2h
- **Impact:** Calcul capacité équipes

#### 3.4 Resource Service
- **Fichier:** `resource.service.ts`
- **Estimation:** 2.5h
- **Impact:** Gestion ressources/planning

---

### **PHASE 4 - Services Avancés (Priorité BASSE)** 🟢

Services pour fonctionnalités avancées, non critiques.

#### 4.1 Analytics Services
- `analytics.service.ts` - 2h
- `hr-analytics.service.ts` - 2h
- `dashboard.service.ts` - 1.5h
- `dashboard-hub.service.ts` - 2h
- `dashboard-hub-v2.service.ts` - 2h

#### 4.2 Notification Services
- `notification.service.ts` - 2h
- `push-notification.service.ts` - 2.5h
- `realtime-notification.service.ts` - 3h

#### 4.3 Skills/Profile
- `skill-management.service.ts` - 2h
- `skills.service.ts` - 1.5h
- `profile.service.ts` - 1.5h

#### 4.4 Integration/Export
- `webhook.service.ts` - 2h
- `hr-export.service.ts` - 1.5h
- `import.service.ts` - 2h

#### 4.5 Utilities
- `cache-manager.service.ts` - 1h
- `robust-query.service.ts` - 1h
- `workload-calculator.service.ts` - 2h
- `team-supervision.service.ts` - 2h

---

## 📈 Récapitulatif des Phases

| Phase | Services | Estimation | Priorité | Statut |
|-------|----------|------------|----------|---------|
| **Phase 1** | 4 services | 8h | 🔴 HAUTE | À faire |
| **Phase 2** | 6 services | 11h | 🟡 MOYENNE | À planifier |
| **Phase 3** | 4 services | 8.5h | 🟡 MOYENNE | À planifier |
| **Phase 4** | 21 services | 35h+ | 🟢 BASSE | Optionnel |
| **TOTAL** | **35 services** | **62.5h+** | - | - |

---

## 🎯 Recommandation : Commencer par Phase 1

### Ordre d'exécution suggéré:

**Session 1 (2h) - Department Service**
- ✅ Modèle Prisma existe déjà
- Créer API backend
- Migrer service frontend
- **Impact immédiat:** Débloquer HRAdmin

**Session 2 (1h) - SimpleTask Service**
- ✅ Modèle Task existe déjà
- Adapter API existante
- Migrer service frontend
- **Impact immédiat:** Débloquer DashboardHub

**Session 3 (2h) - Milestone Service**
- ✅ Modèle Prisma existe déjà
- Créer API backend
- Migrer service frontend
- **Impact immédiat:** Jalons de projets fonctionnels

**Session 4 (3h) - Presence Service**
- Créer modèle Prisma
- Créer API backend
- Migrer service frontend
- **Impact immédiat:** Pointage fonctionnel

---

## 📝 Template de Migration (à suivre pour chaque service)

### Backend (API NestJS)

1. **Créer le modèle Prisma** (si n'existe pas)
   ```prisma
   model NomDuModele {
     id String @id @default(uuid())
     // champs...
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

2. **Migration base de données**
   ```bash
   cd backend
   npx prisma migrate dev --name add_nom_modele
   ```

3. **Créer le module NestJS**
   ```bash
   cd backend/src
   nest g module nom-module
   nest g service nom-module
   nest g controller nom-module
   ```

4. **Créer les DTOs**
   - `create-nom.dto.ts`
   - `update-nom.dto.ts`

5. **Implémenter CRUD dans le service**

6. **Créer les endpoints dans le controller**

7. **Tester les endpoints**
   ```bash
   curl http://localhost:4000/api/nom-module
   ```

### Frontend (React)

8. **Créer le client API** dans `services/api/`
   ```typescript
   // services/api/nom.api.ts
   export const nomApi = {
     getAll: () => api.get('/nom-module'),
     getById: (id: string) => api.get(`/nom-module/${id}`),
     create: (data) => api.post('/nom-module', data),
     update: (id, data) => api.patch(`/nom-module/${id}`, data),
     delete: (id) => api.delete(`/nom-module/${id}`)
   };
   ```

9. **Migrer le service Firebase**
   - Sauvegarder l'ancien: `nom.service.ts.firebase-backup`
   - Remplacer les appels Firebase par appels API
   - Adapter les types de retour

10. **Tester dans l'interface**
    - Vérifier que les pages fonctionnent
    - Vérifier les CRUD
    - Vérifier les relations

---

## 🚀 Commencer Maintenant ?

**Prêt à commencer la migration ?**

Dis-moi quelle session tu veux commencer :
- **Session 1** : Department Service (2h) - Débloquer HRAdmin
- **Session 2** : SimpleTask Service (1h) - Débloquer DashboardHub
- **Session 3** : Milestone Service (2h) - Jalons de projets
- **Session 4** : Presence Service (3h) - Pointage

Ou tu préfères que je fasse toutes les sessions de la Phase 1 d'affilée ?

---

**Fichier créé le:** 2025-10-14
**Prochaine mise à jour:** Après chaque session de migration
