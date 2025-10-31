# 📋 PLAN DE MIGRATION - SERVICES 11-15

**Date**: 15 octobre 2025
**Statut**: 🚀 EN COURS
**Session**: Services 11-15 (PersonalTodo, Epic, Notification, Profile, TimeEntry)

---

## 📊 ÉTAT DES LIEUX

### ✅ Services Déjà Migrés (Sessions 1-10)
1. ✅ **Auth** - Authentification JWT
2. ✅ **Department** - Départements
3. ✅ **SimpleTask** - Tâches simples
4. ✅ **Presence** - Présences
5. ✅ **Milestone** - Jalons
6. ✅ **Comment** - Commentaires
7. ✅ **Project** - Projets
8. ✅ **Task** - Tâches
9. ✅ **User** - Utilisateurs
10. ✅ **Document** - Documents

**Résultat**: 10/10 services fonctionnels (100%)

### 🎯 Services à Migrer (Sessions 11-15)

| # | Service | Frontend Firestore | Backend Prisma | Priorité | Complexité |
|---|---------|-------------------|----------------|----------|------------|
| 11 | **PersonalTodo** | ✅ Existe | ❌ À créer | 🔴 HAUTE | 🟢 Faible |
| 12 | **Epic** | ✅ Existe | ❌ À créer | 🔴 HAUTE | 🟡 Moyenne |
| 13 | **Notification** | ✅ Existe | ⚠️ Partiel | 🟡 MOYENNE | 🟢 Faible |
| 14 | **Profile** | ✅ Existe | ⚠️ Partiel | 🟡 MOYENNE | 🟢 Faible |
| 15 | **TimeEntry** | ❌ N'existe pas | ❌ À créer | 🟢 BASSE | 🟡 Moyenne |

---

## 🏗️ ARCHITECTURE CIBLE

### Modèles Prisma Requis

#### 1️⃣ PersonalTodo (Simple - Nouveau modèle)
```prisma
model PersonalTodo {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  text        String
  completed   Boolean   @default(false)
  priority    Int       @default(3) // 1=high, 2=medium, 3=low

  completedAt DateTime? @map("completed_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("personal_todos")
  @@index([userId, completed])
  @@index([createdAt])
}
```

#### 2️⃣ Epic (Complexe - Nouveau modèle)
```prisma
enum EpicStatus {
  UPCOMING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model Epic {
  id              String      @id @default(uuid())
  projectId       String      @map("project_id")
  project         Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)

  code            String      // EP-XXX
  name            String
  description     String      @db.Text

  status          EpicStatus  @default(UPCOMING)
  priority        Priority    @default(MEDIUM)
  risk            RiskLevel   @default(MEDIUM)

  startDate       DateTime?   @map("start_date")
  endDate         DateTime?   @map("end_date")

  progress        Int         @default(0) // 0-100

  ownerId         String      @map("owner_id")
  stakeholders    String[]    @default([])

  // Relations avec tâches
  taskIds         String[]    @default([]) @map("task_ids")
  taskCount       Int         @default(0) @map("task_count")
  completedTaskCount Int      @default(0) @map("completed_task_count")

  // Dépendances
  dependencies    Json        @default("[]") // Array d'objets {epicId, type}

  // Business Value
  businessValue   Int?        @map("business_value")

  // Métadonnées
  tags            String[]
  metadata        Json?

  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  @@map("epics")
  @@index([projectId, status])
  @@index([ownerId])
  @@index([code])
}
```

#### 3️⃣ Notification (Extension existante)
✅ **Déjà existe dans Prisma** - Améliorer le service backend

Champs existants:
- `type: NotificationType` (enum)
- `isRead: Boolean`
- `readAt: DateTime?`
- `priority` (à ajouter via metadata JSON)
- `category` (à ajouter via metadata JSON)

#### 4️⃣ Profile (Extension User existante)
⚠️ **Model User existe** - Ajouter champs profil:

```prisma
// À ajouter au model User
model User {
  // ... champs existants

  avatarUrl       String?   @map("avatar_url")
  phoneNumber     String?   @map("phone_number")
  jobTitle        String?   @map("job_title")
  bio             String?   @db.Text

  // Préférences (JSON)
  preferences     Json?     // theme, language, notifications

  // Stats (calculées)
  lastActivityAt  DateTime? @map("last_activity_at")
}
```

#### 5️⃣ TimeEntry (Nouveau modèle complexe)
```prisma
enum TimeEntryType {
  TASK
  MEETING
  SUPPORT
  DEVELOPMENT
  OTHER
}

model TimeEntry {
  id          String         @id @default(uuid())
  userId      String         @map("user_id")
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  projectId   String?        @map("project_id")
  project     Project?       @relation(fields: [projectId], references: [id], onDelete: SetNull)

  taskId      String?        @map("task_id")
  task        Task?          @relation(fields: [taskId], references: [id], onDelete: SetNull)

  type        TimeEntryType  @default(TASK)
  description String?        @db.Text

  date        DateTime       // Date de la saisie
  duration    Int            // Durée en minutes

  isBillable  Boolean        @default(true) @map("is_billable")

  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")

  @@map("time_entries")
  @@index([userId, date])
  @@index([projectId, date])
  @@index([taskId])
}
```

---

## 📝 PLAN D'EXÉCUTION

### 🔵 Phase 1: Préparation Backend (60 min)

#### Étape 1.1: Mise à jour Prisma Schema
- [ ] Ajouter modèle `PersonalTodo`
- [ ] Ajouter modèle `Epic` avec enums
- [ ] Ajouter modèle `TimeEntry` avec enum
- [ ] Étendre modèle `User` (profile fields)
- [ ] Ajouter relations dans `Project`, `Task`, `User`
- [ ] Créer migration Prisma

**Commande**:
```bash
cd backend
npx prisma migrate dev --name add_personal_todos_epics_timeentry
npx prisma generate
```

#### Étape 1.2: Créer modules backend NestJS

**11. PersonalTodo Module**:
```bash
mkdir -p backend/src/personal-todos/dto
touch backend/src/personal-todos/{personal-todos.controller.ts,personal-todos.service.ts,personal-todos.module.ts}
touch backend/src/personal-todos/dto/{create-personal-todo.dto.ts,update-personal-todo.dto.ts}
```

Endpoints:
- `GET /api/personal-todos` - Liste (par user)
- `POST /api/personal-todos` - Créer
- `PATCH /api/personal-todos/:id` - Modifier
- `DELETE /api/personal-todos/:id` - Supprimer
- `PATCH /api/personal-todos/:id/toggle` - Toggle completed

**12. Epic Module**:
```bash
mkdir -p backend/src/epics/dto
touch backend/src/epics/{epics.controller.ts,epics.service.ts,epics.module.ts}
touch backend/src/epics/dto/{create-epic.dto.ts,update-epic.dto.ts}
```

Endpoints:
- `GET /api/epics` - Liste paginée
- `GET /api/epics/project/:projectId` - Par projet
- `POST /api/epics` - Créer
- `PATCH /api/epics/:id` - Modifier
- `DELETE /api/epics/:id` - Supprimer
- `PATCH /api/epics/:id/progress` - Mettre à jour progression
- `GET /api/epics/:id/tasks` - Tâches liées

**13. Notification Module** (Extension):
- ✅ Déjà existe
- [ ] Ajouter méthodes: `markAllAsRead`, `deleteRead`, `getUnreadCount`
- [ ] Ajouter support `priority` et `category` via metadata

**14. Profile Module** (Extension Users):
- [ ] Ajouter endpoint `GET /api/users/profile/:id`
- [ ] Ajouter endpoint `PATCH /api/users/profile/:id`
- [ ] Ajouter endpoint `GET /api/users/profile/:id/stats`
- [ ] Ajouter upload avatar (MinIO)

**15. TimeEntry Module**:
```bash
mkdir -p backend/src/time-entries/dto
touch backend/src/time-entries/{time-entries.controller.ts,time-entries.service.ts,time-entries.module.ts}
touch backend/src/time-entries/dto/{create-time-entry.dto.ts,update-time-entry.dto.ts}
```

Endpoints:
- `GET /api/time-entries` - Liste (par user/date)
- `GET /api/time-entries/project/:projectId` - Par projet
- `POST /api/time-entries` - Créer
- `PATCH /api/time-entries/:id` - Modifier
- `DELETE /api/time-entries/:id` - Supprimer
- `GET /api/time-entries/stats` - Statistiques

---

### 🟢 Phase 2: Migration Frontend (90 min)

Pour chaque service:
1. **Backup Firebase version**: `.service.ts` → `.service.ts.firebase-backup`
2. **Créer nouvelle version**: Appels API REST
3. **Tester intégration**
4. **Valider fonctionnalités**

#### Migration Pattern:

**Avant (Firebase)**:
```typescript
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

async getAll(userId: string) {
  const q = query(
    collection(db, 'personalTodos'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

**Après (REST API)**:
```typescript
import api from './api/client';

async getAll(userId: string) {
  const response = await api.get(`/personal-todos?userId=${userId}`);
  return response.data;
}
```

---

### 🔴 Phase 3: Tests & Validation (45 min)

#### Test Script: `test-services-11-15.sh`

**Structure**:
```bash
#!/bin/bash
# Tests Services 11-15

# 1. Login
TOKEN=$(curl -s http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test.admin@orchestra.local","password":"Admin1234"}' \
  | jq -r '.accessToken')

# 2. Test PersonalTodo (CRUD + Toggle)
# 3. Test Epic (CRUD + Progress)
# 4. Test Notification (List + MarkRead + Unread count)
# 5. Test Profile (Get + Update + Stats)
# 6. Test TimeEntry (CRUD + Stats)

# Scoring: 20 tests au total
```

**Tests par service**:
- PersonalTodo: 5 tests (Create, Get, List, Toggle, Delete)
- Epic: 5 tests (Create, Get, List by Project, Update Progress, Delete)
- Notification: 3 tests (List, MarkRead, GetUnreadCount)
- Profile: 4 tests (Get, Update, Get Stats, Upload Avatar)
- TimeEntry: 3 tests (Create, List by Date, Get Stats)

**Objectif**: ≥ 95% (19/20 tests)

---

## 🎯 CRITÈRES DE SUCCÈS

### Backend
- ✅ Tous les modèles Prisma créés et migrés
- ✅ Tous les modules NestJS fonctionnels
- ✅ DTOs avec validation complète
- ✅ Guards JWT sur toutes les routes
- ✅ Healthcheck passe

### Frontend
- ✅ Services migrés vers API REST
- ✅ Backups Firebase créés
- ✅ Aucune erreur console
- ✅ Types TypeScript corrects

### Tests
- ✅ ≥ 95% tests passants (19/20)
- ✅ CRUD complet validé
- ✅ Pagination fonctionnelle
- ✅ Relations correctes

### Documentation
- ✅ Rapport de migration créé
- ✅ Endpoints documentés
- ✅ Exemples de requêtes fournis

---

## ⏱️ ESTIMATION TEMPS

| Phase | Durée | Détails |
|-------|-------|---------|
| **Phase 1: Backend** | 60 min | Prisma (15min) + PersonalTodo (10min) + Epic (15min) + Notification (5min) + Profile (5min) + TimeEntry (10min) |
| **Phase 2: Frontend** | 90 min | PersonalTodo (15min) + Epic (25min) + Notification (15min) + Profile (20min) + TimeEntry (15min) |
| **Phase 3: Tests** | 45 min | Script (15min) + Exécution (10min) + Corrections (20min) |
| **Documentation** | 30 min | Rapport + README |
| **TOTAL** | **3h45** | |

---

## 📦 LIVRABLES

1. ✅ Prisma schema étendu avec 3 nouveaux modèles
2. ✅ 3 nouveaux modules backend NestJS (PersonalTodo, Epic, TimeEntry)
3. ✅ 2 modules backend étendus (Notification, User/Profile)
4. ✅ 5 services frontend migrés
5. ✅ Script de test complet (`test-services-11-15.sh`)
6. ✅ Rapport de migration avec résultats
7. ✅ Documentation API endpoints

---

## 🚀 DÉMARRAGE

**Commande pour lancer la migration**:
```bash
# 1. Créer une branche Git
git checkout -b feature/migration-services-11-15

# 2. Lancer Docker (si pas déjà fait)
docker-compose -f docker-compose.full.yml up -d

# 3. Commencer Phase 1
cd backend
code prisma/schema.prisma
```

---

**Prêt à démarrer ! 🎯**
