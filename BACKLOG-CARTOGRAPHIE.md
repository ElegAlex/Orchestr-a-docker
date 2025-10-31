# Cartographie des Modules - Orchestr'A

**Date:** 24 octobre 2025
**Objectif:** Cartographier les modules principaux avant de traiter le backlog de bugs et fonctionnalités

---

## Table des Matières

1. [Vue d'Ensemble Architecture](#vue-densemble-architecture)
2. [Module Congés/Absences](#1-module-congésabsences)
3. [Système de Permissions](#2-système-de-permissions)
4. [Module Projets/Tâches](#3-module-projetstâches)
5. [Dashboard/Hub Principal](#4-dashboardhub-principal)
6. [Calendrier et Filtres](#5-calendrier-et-filtres)
7. [Points d'Attention pour le Backlog](#6-points-dattention-pour-le-backlog)

---

## Vue d'Ensemble Architecture

### Stack Technique
- **Backend:** NestJS + PostgreSQL (Prisma ORM)
- **Frontend:** React + Redux + Material-UI
- **Authentification:** JWT + Guards multi-niveaux
- **Base de données:** PostgreSQL avec isolation par département
- **Migration:** Firebase → PostgreSQL (complète)

### Architecture Globale
```
Client (React)
    ↓ JWT Bearer Token
Backend API (NestJS)
    ↓ Guards (JWT + Roles + Department)
Business Logic (Services)
    ↓ Prisma ORM
Database (PostgreSQL)
```

---

## 1. Module Congés/Absences

### 📂 Fichiers Backend
| Fichier | Lignes | Description |
|---------|--------|-------------|
| `backend/src/leaves/leaves.service.ts` | 577 | CRUD congés, validation, workflow |
| `backend/src/holidays/holidays.service.ts` | 292 | Gestion jours fériés |
| `backend/src/school-holidays/school-holidays.service.ts` | 190 | Vacances scolaires zones A/B/C |
| `backend/src/telework/telework.service.ts` | 930 | Gestion télétravail |

### 📂 Fichiers Frontend
- `orchestra-app/src/components/leave/MyLeaves.tsx` (575 lignes)
- `orchestra-app/src/components/leave/LeaveManagement.tsx`
- `orchestra-app/src/services/leave.service.ts`

### 🗄️ Modèles Base de Données (Prisma)

#### Leave
```prisma
model Leave {
  id          String      @id @default(uuid())
  userId      String
  type        LeaveType   // PAID_LEAVE, SICK_LEAVE, RTT, etc.
  status      LeaveStatus // PENDING, APPROVED, REJECTED, CANCELLED
  startDate   DateTime
  endDate     DateTime
  days        Decimal     @db.Decimal(4, 1)  // Support demi-journées
  reason      String?
  approverId  String?
  approvedAt  DateTime?

  @@index([userId, status])
  @@index([startDate, endDate])
}
```

#### Holiday
```prisma
model Holiday {
  id           String      @id @default(uuid())
  name         String
  date         DateTime
  type         HolidayType // FIXED, CALCULATED, CUSTOM
  isNational   Boolean
  regions      String[]    // Alsace, Moselle, etc.
  isWorkingDay Boolean     // Override pour 26/12 Saint-Étienne

  @@unique([name, date])
}
```

### 🔌 API Endpoints
```
POST   /leaves                  Créer congé
GET    /leaves                  Liste (pagination + filtres)
GET    /leaves/:id              Détails congé
PATCH  /leaves/:id              Modifier (PENDING uniquement)
DELETE /leaves/:id              Supprimer (PENDING uniquement)
POST   /leaves/:id/approve      Approuver (ADMIN/RESPONSABLE/MANAGER)
POST   /leaves/:id/reject       Rejeter
POST   /leaves/:id/cancel       Annuler un congé approuvé

GET    /holidays/year/:year     Jours fériés de l'année
POST   /holidays                Créer jour férié custom
DELETE /holidays/:id            Supprimer jour férié
```

### ⚙️ Fonctionnalités Clés
- ✅ Support demi-journées (0.5)
- ✅ Validation des chevauchements
- ✅ Workflow d'approbation (PENDING → APPROVED)
- ✅ Calcul jours ouvrés (exclut weekends + jours fériés)
- ✅ Isolation par département
- ✅ Jours fériés régionaux (Alsace, Moselle)
- ✅ Vacances scolaires zones A/B/C

### 🐛 Bugs Identifiés du Backlog
- **BUG-01:** Configuration jours fériés (26/12 Saint-Étienne)
  - 📍 Fichier: `holidays.service.ts:292`
  - 🔧 Action: Ajouter DELETE endpoint pour supprimer jours fériés

- **BUG-03:** Blocage saisie RTT si solde = 0
  - 📍 Fichier: `leaves.service.ts:577` (validation)
  - 🔧 Action: Permettre solde négatif temporaire

---

## 2. Système de Permissions

### 📂 Fichiers Backend (Guards)
| Fichier | Description |
|---------|-------------|
| `backend/src/auth/guards/jwt-auth.guard.ts` | Validation JWT Bearer Token |
| `backend/src/auth/guards/roles.guard.ts` | Vérification rôles (@Roles decorator) |
| `backend/src/auth/guards/department-isolation.guard.ts` | Isolation département (Global) |

### 📂 Fichiers Frontend
| Fichier | Description |
|---------|-------------|
| `orchestra-app/src/services/permissions.service.ts` | Matrice permissions par rôle |
| `orchestra-app/src/hooks/usePermissions.ts` | Hook React permissions |
| `orchestra-app/src/components/ProtectedRoute.tsx` | Protection routes |

### 👥 Hiérarchie des Rôles

```
ADMIN (100%)
├─ Accès technique complet
├─ Cross-département
└─ Configuration système

RESPONSABLE (95%)
├─ Toutes permissions business
├─ Cross-département
└─ PAS: Logs, backups, webhooks

MANAGER (60%)
├─ Gestion projets/équipes
├─ Approbation congés
└─ Vision département uniquement

TEAM_LEAD (40%)
├─ Coordination tâches
└─ Gestion membres équipe

CONTRIBUTOR (20%)
├─ Exécution tâches
└─ Gestion propres congés

VIEWER (5%)
└─ Lecture seule
```

### 🔒 Isolation par Département

**Guard Global** (appliqué automatiquement):
```typescript
// DepartmentIsolationGuard
if (user.role === 'ADMIN' || user.role === 'RESPONSABLE') {
  request.departmentFilter = null; // Accès cross-département
} else {
  request.departmentFilter = user.departmentId; // Filtrage
}
```

**Utilisation dans Services:**
```typescript
// Exemple dans leaves.service.ts
const leaves = await prisma.leave.findMany({
  where: {
    ...(departmentFilter && {
      user: { departmentId: departmentFilter }
    })
  }
});
```

### 🔑 Permissions Granulaires (Frontend)

30+ permissions définies:
- `project.view`, `project.create`, `project.edit`, `project.delete`
- `task.view`, `task.create`, `task.assign`
- `hr.approve_leaves`, `hr.manage_employees`
- `admin.access`, `admin.settings`

### 🐛 Bugs Identifiés du Backlog

- **BUG-02:** Modification congé posé par manager impossible
  - 📍 Fichier: `leaves.service.ts` + `RolesGuard`
  - 🔧 Action: Permettre user de modifier ses propres entrées

- **BUG-05:** Droits télétravail mois futurs
  - 📍 Fichier: `telework.service.ts` + Guards
  - 🔧 Action: Vérifier permissions périodes futures

- **BUG-06:** Modification statut tâche projet restreinte
  - 📍 Fichier: `tasks.service.ts` + permissions
  - 🔧 Action: Assouplir droits membres équipe

---

## 3. Module Projets/Tâches

### 📂 Fichiers Backend
| Fichier | Lignes | Description |
|---------|--------|-------------|
| `backend/src/projects/projects.service.ts` | 502 | CRUD projets + membres |
| `backend/src/tasks/tasks.service.ts` | ~400 | Gestion tâches projet |
| `backend/src/simple-tasks/simple-tasks.service.ts` | ~200 | Tâches simples |
| `backend/src/comments/comments.service.ts` | ~100 | Commentaires tâches |

### 📂 Fichiers Frontend
- `orchestra-app/src/components/project/ProjectTasks.tsx` (300+ lignes)
- `orchestra-app/src/components/tasks/TaskComments.tsx` (350 lignes)
- `orchestra-app/src/pages/ProjectCreate.tsx`

### 🗄️ Distinction "Tâche Simple" vs "Tâche Projet"

| Aspect | Tâche Simple | Tâche Projet |
|--------|-------------|-------------|
| **Table** | `simple_tasks` | `tasks` |
| **Projet** | ❌ Aucun | ✅ Obligatoire |
| **Status** | TODO, IN_PROGRESS, DONE | TODO, IN_PROGRESS, REVIEW, COMPLETED, CANCELLED |
| **Priorité** | P0, P1, P2, P3 | LOW, MEDIUM, HIGH, CRITICAL |
| **Planning** | Date + timeStart/timeEnd | dueDate (optionnel) |
| **Commentaires** | ❌ Non supporté | ✅ Complet |
| **Dépendances** | ❌ Non | ✅ Array task IDs |
| **Time Tracking** | ❌ Non | ✅ estimatedHours / actualHours |
| **Endpoint** | `/simple-tasks` | `/tasks` |

### 🔌 API Endpoints

#### Projets
```
POST   /projects              Créer projet
GET    /projects              Liste (pagination + filtres)
PATCH  /projects/:id          Modifier
DELETE /projects/:id          Supprimer (si aucune tâche)
POST   /projects/:id/members  Ajouter membre équipe
DELETE /projects/:id/members/:userId  Retirer membre
GET    /projects/:id/stats    Statistiques projet
```

#### Tâches Projet
```
POST   /tasks                 Créer tâche
GET    /tasks                 Liste
PATCH  /tasks/:id/status      Changer statut
PATCH  /tasks/:id/assign      Assigner tâche
DELETE /tasks/:id             Supprimer
```

#### Tâches Simples
```
POST   /simple-tasks          Créer tâche simple
POST   /simple-tasks/batch    Création batch (multi-users)
GET    /simple-tasks/date/:date  Tâches d'un jour
DELETE /simple-tasks/:id      Supprimer
```

#### Commentaires
```
POST   /comments              Ajouter commentaire
GET    /comments/task/:taskId Commentaires d'une tâche
PATCH  /comments/:id          Modifier (auteur ou ADMIN)
DELETE /comments/:id          Supprimer (auteur ou ADMIN)
```

### ⚙️ Système de Commentaires

**État:** ✅ FONCTIONNEL (contrairement à BUG-08 qui dit "KO")

**Fonctionnalités:**
- Ajout/édition/suppression commentaires
- @mentions utilisateurs
- Réactions emoji (like, heart)
- Notifications temps réel
- Historique modifications (updatedAt)

**Fichier Frontend:** `TaskComments.tsx` (350 lignes)

### 🐛 Bugs Identifiés du Backlog

- **BUG-04:** Suppression tâche simple impossible
  - 📍 Fichier: `simple-tasks.service.ts` + permissions
  - 🔧 Action: Permettre user de supprimer ses propres tâches

- **BUG-07:** Tâches simples dépassées sur dashboard
  - 📍 Fichier: `DashboardHub.tsx` + `simple-tasks.service.ts`
  - 🔧 Action: Filtrer date < aujourd'hui

- **BUG-08:** Commentaires tâches projet KO
  - 📍 Fichier: `TaskComments.tsx` + `comments.service.ts`
  - 🔧 Action: **À VÉRIFIER** - Le code semble fonctionnel !

---

## 4. Dashboard/Hub Principal

### 📂 Fichiers Frontend
| Fichier | Description |
|---------|-------------|
| `orchestra-app/src/pages/DashboardHub.tsx` | Page principale hub |
| `orchestra-app/src/services/dashboard-hub-v2.service.ts` | Agrégation données (REST API) |
| `orchestra-app/src/components/dashboard/MyProjectsWidget.tsx` | Widget projets |
| `orchestra-app/src/components/dashboard/MyTasksWidget.tsx` | Widget tâches par urgence |
| `orchestra-app/src/components/dashboard/PersonalTodoWidget.tsx` | Widget todos personnels |

### 📊 Données Affichées

#### Header Metrics (Chips)
- 📁 **Total Projets:** Nombre projets où user est membre
- 📋 **Total Tâches:** Nombre tâches assignées
- ⚠️ **En Retard:** Nombre tâches overdue

#### Widget "Mes Projets" (50% gauche)
Pour chaque projet:
- Nom + code projet
- Icône statut (on track / at risk / overdue)
- Barre progression globale
- Métriques: tâches en retard, en cours, à faire

#### Widget "Mes Tâches" (50% droite)
Organisé par urgence:
1. 🔴 **En Retard** (dueDate < now)
2. 🟠 **Échéance Proche** (< 3 jours)
3. 🔴 **Bloquées** (status = BLOCKED)
4. 🔵 **En Cours** (IN_PROGRESS)
5. ⚪ **À Faire** (TODO)
6. 🟣 **Tâches Simples**

### 🔄 Flux d'Agrégation de Données

```
DashboardHub.tsx
  ↓
dashboardHubV2Service.getDashboardData(userId)
  ↓
  ├─ getMyResponsibleTasks(userId)
  │   └─ API: GET /tasks?assigneeId=userId
  │
  ├─ sortTasksByUrgency(tasks)
  │   └─ Catégorisation par urgence
  │
  ├─ getMyProjectsWithMetrics(userId, myTasks)
  │   ├─ API: GET /projects?teamMemberId=userId
  │   └─ API: GET /projects/:id/stats
  │
  └─ getMySimpleTasks(userId)
      └─ API: GET /simple-tasks?userId=userId
```

### 🐛 Bugs Identifiés du Backlog

- **BUG-07:** Tâches simples dépassées affichées
  - 📍 Fichier: `dashboard-hub-v2.service.ts` ligne `getMySimpleTasks()`
  - 🔧 Action: Ajouter filtre `date >= today`

---

## 5. Calendrier et Filtres

### 📂 Fichiers Frontend
| Fichier | Tokens | Description |
|---------|--------|-------------|
| `orchestra-app/src/pages/Calendar.tsx` | - | Page calendrier principal |
| `orchestra-app/src/components/calendar/PlanningCalendar.tsx` | 28,875 | Calendrier planning avancé |
| `orchestra-app/src/components/calendar/MonthView.tsx` | - | Vue mois |

### 🎨 Système de Couleurs

```typescript
Events:
  task:        #2196f3 (Bleu)
  project:     #ff9800 (Orange)
  simple_task: #9c27b0 (Violet)
  leave:       #4caf50 (Vert)

Priorités:
  P0/CRITICAL: #f44336 (Rouge)
  P1/HIGH:     #ff9800 (Orange)
  P2/MEDIUM:   #2196f3 (Bleu)
  P3/LOW:      Gris
```

### 📅 Types d'Événements Agrégés

1. **Tâches Projet** (bleu)
2. **Tâches Simples** (violet)
3. **Jalons Projet** (orange)
4. **Congés** (vert) - avec support demi-journées
5. **Jours Fériés** (indicateurs)
6. **Vacances Scolaires** (zones A/B/C)
7. **Télétravail** (badge "TLT")

### 🔍 Filtres Disponibles

#### Filtres Services
- ✅ Multi-sélection services
- ✅ "Tout sélectionner" (demandé UI-02)
- ✅ Groupement par service
- ✅ Couleurs personnalisées

#### Filtres Types d'Événements
- Tous / Tâches / Tâches Simples / Projets / Congés

#### Filtres Département
- 🔒 Isolation automatique (sauf ADMIN/RESPONSABLE)

#### Filtres Zones Vacances (FEAT-02)
- ✅ Zone A, B, C, ALL
- Affichage discret pour ne pas surcharger

#### Filtre Week-ends (FEAT-03)
- ⚠️ Non implémenté actuellement
- 🔧 Action: Ajouter toggle "Masquer week-ends"

### 🗄️ Modèles Spécifiques Calendrier

#### Congés avec Demi-Journées
```prisma
model Leave {
  days Decimal @db.Decimal(4, 1)  // Support 0.5, 1.5, etc.
}
```

**Affichage:**
- 🌅 Matin: `linear-gradient(90deg, #4caf50 0%, #81c784 100%)`
- 🌆 Après-midi: `linear-gradient(90deg, #81c784 0%, #4caf50 100%)`
- 🌞 Journée complète: Vert uni

#### Vacances Scolaires
```prisma
model SchoolHoliday {
  zone   SchoolHolidayZone  // A, B, C, ALL
  period SchoolHolidayPeriod // TOUSSAINT, NOEL, HIVER, PRINTEMPS, ETE
}
```

### 🔌 API Endpoints Calendrier

```
GET /leaves?startDate=X&endDate=Y&departmentId=Z
GET /holidays/period?startDate=X&endDate=Y&region=Z
GET /school-holidays/period?startDate=X&endDate=Y&zone=A
GET /tasks?assigneeId=userId
GET /simple-tasks?userId=userId&date=X
```

### 🐛 Bugs/Features Identifiés du Backlog

- **UI-02:** Bouton "Tout sélectionner" services
  - 📍 Fichier: `PlanningCalendar.tsx` (filtres services)
  - 🔧 Action: Ajouter checkbox "Tout cocher/décocher"

- **FEAT-02:** Zones vacances scolaires
  - 📍 Fichier: `MonthView.tsx` + `school-holidays.service.ts`
  - 🔧 Action: **DÉJÀ IMPLÉMENTÉ** (zones A/B/C disponibles)

- **FEAT-03:** Filtre masquer week-ends
  - 📍 Fichier: `MonthView.tsx`
  - 🔧 Action: Ajouter toggle + logique filtrage colonnes Sam/Dim

---

## 6. Points d'Attention pour le Backlog

### 🔴 Bugs Critiques (Quick Wins)

#### BUG-07 - Tâches simples dépassées (2h - Facile)
```typescript
// dashboard-hub-v2.service.ts
async getMySimpleTasks(userId: string): Promise<SimpleTask[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.simpleTaskService.getByUser(userId).then(tasks =>
    tasks.filter(task => new Date(task.date) >= today) // AJOUTER CE FILTRE
  );
}
```

#### BUG-04 - Suppression tâche simple (2h - Facile)
```typescript
// simple-tasks.controller.ts
@Delete(':id')
@UseGuards(JwtAuthGuard)
async remove(@Param('id') id: string, @CurrentUser() user: User) {
  // VÉRIFIER: task.createdBy === user.id OU user.role === 'ADMIN'
}
```

#### UI-02 - "Tout sélectionner" services (2h - Facile)
```typescript
// PlanningCalendar.tsx - Ajouter dans filtres
<FormControlLabel
  control={
    <Checkbox
      checked={selectedServices.length === allServices.length}
      onChange={handleSelectAllServices}
    />
  }
  label="Tout sélectionner"
/>
```

### 🟠 Bugs Moyens (Permissions)

#### BUG-02 - Modification congé posé par manager (4h)
```typescript
// leaves.service.ts - Méthode update()
async update(id: string, dto: UpdateLeaveDto, currentUser: User) {
  const leave = await this.findOne(id);

  // PERMETTRE si:
  // 1. leave.userId === currentUser.id (propriétaire)
  // 2. OU currentUser.role === ADMIN/RESPONSABLE
  if (leave.userId !== currentUser.id &&
      !['ADMIN', 'RESPONSABLE'].includes(currentUser.role)) {
    throw new ForbiddenException();
  }
  // ...
}
```

#### BUG-01 - Configuration jours fériés (4h)
```typescript
// holidays.controller.ts - AJOUTER endpoint
@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.RESPONSABLE)
async remove(@Param('id') id: string) {
  return this.holidaysService.remove(id);
}

// holidays.service.ts
async remove(id: string): Promise<void> {
  await this.prisma.holiday.delete({ where: { id } });
}
```

### 🔴 Fonctionnalités Majeures

#### FEAT-01 - Workflow validation congés (2-3 jours)
**Dépendances:** BUG-01, BUG-02, BUG-03

**Changements requis:**
1. **Leave Model:** Déjà prêt (status PENDING/APPROVED/REJECTED)
2. **Notifications:** Ajouter notification manager lors demande
3. **Frontend:** Boutons Approuver/Rejeter pour managers
4. **Permissions:** Vérifier guards approbation

```prisma
// DÉJÀ EXISTANT dans schema.prisma
enum LeaveStatus {
  PENDING    // Demandé
  APPROVED   // Approuvé
  REJECTED   // Refusé
  CANCELLED  // Annulé
}

model Leave {
  status     LeaveStatus @default(PENDING)
  approverId String?
  approvedAt DateTime?
}
```

#### FEAT-03 - Filtre week-ends (3h - Facile)
```typescript
// MonthView.tsx
const [hideWeekends, setHideWeekends] = useState(false);

const visibleDaysOfWeek = hideWeekends
  ? [1, 2, 3, 4, 5]  // Lun-Ven
  : [0, 1, 2, 3, 4, 5, 6];  // Dim-Sam
```

### ⚠️ Points de Clarification Nécessaires

1. **BUG-03 - Solde RTT négatif:**
   - Question: Acceptez-vous soldes négatifs temporaires ?
   - Alternative: Système d'avance sur congés ?

2. **BUG-06 - Statut tâches projet:**
   - Question: Tous les membres d'équipe peuvent changer statut ?
   - Ou seulement assignee + manager ?

3. **BUG-08 - Commentaires tâches:**
   - **À VÉRIFIER EN PRIORITÉ** - Le code semble fonctionnel
   - Possible problème frontend (API call) ou backend (endpoint)

4. **FEAT-01 - Workflow validation:**
   - Simple (demande → validation) ?
   - Ou multi-niveaux (demande → validation N+1 → validation RH) ?

---

## 7. Résumé des Fichiers Critiques

### Backend (NestJS)
```
backend/src/
├── leaves/leaves.service.ts           (577 lignes) - BUG-01, BUG-03, FEAT-01
├── holidays/holidays.service.ts       (292 lignes) - BUG-01
├── simple-tasks/simple-tasks.service.ts            - BUG-04, BUG-07
├── tasks/tasks.service.ts                          - BUG-06
├── comments/comments.service.ts                    - BUG-08
├── telework/telework.service.ts       (930 lignes) - BUG-05
└── auth/guards/
    ├── jwt-auth.guard.ts                           - Tous bugs permissions
    ├── roles.guard.ts                              - BUG-02, BUG-05, BUG-06
    └── department-isolation.guard.ts               - BUG-02, BUG-05
```

### Frontend (React)
```
orchestra-app/src/
├── pages/
│   ├── DashboardHub.tsx                            - BUG-07
│   └── Calendar.tsx                                - FEAT-03, UI-02
├── components/
│   ├── dashboard/
│   │   └── MyTasksWidget.tsx                       - BUG-07
│   ├── calendar/
│   │   ├── PlanningCalendar.tsx   (28,875 tokens) - UI-02, FEAT-02, FEAT-03
│   │   └── MonthView.tsx                           - FEAT-03
│   ├── leave/
│   │   └── MyLeaves.tsx           (575 lignes)     - UI-01, FEAT-01
│   └── tasks/
│       └── TaskComments.tsx       (350 lignes)     - BUG-08
└── services/
    ├── dashboard-hub-v2.service.ts                 - BUG-07
    └── permissions.service.ts                      - BUG-02, BUG-05, BUG-06
```

---

## 8. Prochaines Étapes Recommandées

### Phase 1: Quick Wins (2-3 jours)
1. ✅ **BUG-07** - Filtrer tâches simples dépassées (2h)
2. ✅ **BUG-04** - Permettre suppression tâches simples (2h)
3. ✅ **UI-02** - Bouton "Tout sélectionner" services (2h)
4. ✅ **BUG-01** - Endpoint suppression jours fériés (4h)

### Phase 2: Permissions (3-4 jours)
5. ✅ **BUG-02** - Modification congés par user propriétaire (4h)
6. ✅ **BUG-05** - Droits télétravail périodes futures (3h)
7. ✅ **BUG-06** - Assouplir droits statut tâches équipe (3h)

### Phase 3: Workflow Congés (4-5 jours)
8. ✅ **BUG-03** - Permettre saisie RTT solde zéro (6h)
9. ✅ **FEAT-01** - Workflow validation congés (2-3 jours)

### Phase 4: UX (2-3 jours)
10. ✅ **UI-01** - Bouton "Déclarer absence" sur hub (4h)
11. ✅ **UI-03** - Clarifier "tâche simple" (1h)
12. ✅ **FEAT-03** - Filtre masquer week-ends (3h)

### Phase 5: Features Avancées (3-4 jours)
13. ⚠️ **BUG-08** - Debug commentaires tâches (6h - à vérifier)
14. ✅ **FEAT-02** - Zones vacances scolaires (1 jour - DÉJÀ FAIT ?)
15. ✅ **FEAT-04** - Projets terminés récemment (4h)

---

**Document créé le:** 24 octobre 2025
**Dernière mise à jour:** 24 octobre 2025
**Créé par:** Claude AI (Cartographie automatique)
