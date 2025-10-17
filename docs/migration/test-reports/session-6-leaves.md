# Test Session 6 - Leaves Service Migration

**Date**: 2025-10-15
**Status**: ✅ VALIDÉ (API + Frontend corrigé + Workflow complet)

## Résumé

Migration du service Leaves de Firebase vers REST API (NestJS + PostgreSQL) validée avec succès.

**Tests validés**:
- ✅ API REST (curl) - Tous les endpoints CRUD fonctionnent
- ✅ Frontend API client - Migré vers client centralisé
- ✅ Workflow complet de validation (PENDING → APPROVED/REJECTED/CANCELLED)
- ✅ Permissions et règles métier respectées

---

## Session 6 - Leaves Service

### Services migrés

#### Backend (NestJS)
- ✅ `LeavesController` - `/api/leaves`
- ✅ `LeavesService` - Logique métier avec workflow d'approbation
- ✅ Prisma Schema - Modèle `Leave`
- ✅ DTOs - `CreateLeaveDto`, `UpdateLeaveDto`, `RejectLeaveDto`, `FilterLeaveDto`
- ✅ Guards - `JwtAuthGuard`, `RolesGuard`
- ✅ Permissions - ADMIN/RESPONSABLE/MANAGER pour approbation
- ✅ Workflow - APPROVE, REJECT, CANCEL

#### Frontend (React)
- ✅ `leaves.api.ts` - API client REST (migré vers client centralisé)
- ✅ `leave.service.ts` - Service métier

### Modèle de données

```prisma
model Leave {
  id         String     @id @default(uuid())
  userId     String     @map("user_id")
  type       LeaveType
  status     LeaveStatus @default(PENDING)
  startDate  DateTime   @map("start_date")
  endDate    DateTime   @map("end_date")
  days       Decimal    @db.Decimal(4, 1) // Support demi-journées
  reason     String?    @db.Text

  approverId String?    @map("approver_id")
  approvedAt DateTime?  @map("approved_at")

  createdAt  DateTime   @default(now()) @map("created_at")
  updatedAt  DateTime   @updatedAt @map("updated_at")

  // Relations
  user       User       @relation("UserLeaves", fields: [userId], references: [id], onDelete: Cascade)
  approver   User?      @relation("ApprovedLeaves", fields: [approverId], references: [id], onDelete: SetNull)

  @@map("leaves")
  @@index([userId, status])
  @@index([status, startDate])
}

enum LeaveType {
  PAID_LEAVE      // Congés payés
  SICK_LEAVE      // Congé maladie
  RTT             // Réduction du temps de travail
  UNPAID_LEAVE    // Congé sans solde
  PARENTAL_LEAVE  // Congé parental
}

enum LeaveStatus {
  PENDING    // En attente d'approbation
  APPROVED   // Approuvé
  REJECTED   // Rejeté
  CANCELLED  // Annulé (après approbation)
}
```

### Fonctionnalités testées

#### ✅ CRUD Basique
1. **CREATE** - Créer une demande de congé (status: PENDING)
2. **READ** - Liste avec filtres (userId, status, type, dates)
3. **UPDATE** - Modifier une demande PENDING
4. **DELETE** - Supprimer une demande PENDING

#### ✅ Workflow d'approbation
1. **APPROVE** - Approuver une demande PENDING
2. **REJECT** - Rejeter une demande PENDING avec motif
3. **CANCEL** - Annuler une demande APPROVED

#### ✅ Statistiques
1. **GET User Stats** - Statistiques par statut et type
2. **Total Days** - Calcul automatique des jours

#### ✅ Règles métier
- Seules les demandes PENDING peuvent être modifiées
- Seules les demandes PENDING peuvent être supprimées
- Seuls ADMIN/RESPONSABLE/MANAGER peuvent approuver/rejeter
- Seuls ADMIN/RESPONSABLE peuvent annuler une demande approuvée
- Le motif de rejet est ajouté au champ `reason`

### Tests API

#### Test complet - Workflow création → approbation → annulation

```bash
# 1. Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test.admin@orchestra.local","password":"Admin1234"}'

# 2. Créer une demande de congé
curl -X POST http://localhost:4000/api/leaves \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"PAID_LEAVE",
    "startDate":"2025-11-01",
    "endDate":"2025-11-05",
    "days":5,
    "reason":"Vacances en famille"
  }'

# 3. Récupérer les congés d'un utilisateur
curl http://localhost:4000/api/leaves?userId=user-uuid \
  -H "Authorization: Bearer $TOKEN"

# 4. Mettre à jour la demande
curl -X PATCH http://localhost:4000/api/leaves/leave-uuid \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"endDate":"2025-11-06","days":6}'

# 5. Approuver la demande
curl -X POST http://localhost:4000/api/leaves/leave-uuid/approve \
  -H "Authorization: Bearer $TOKEN"

# 6. Annuler la demande approuvée
curl -X POST http://localhost:4000/api/leaves/leave-uuid/cancel \
  -H "Authorization: Bearer $TOKEN"

# 7. Statistiques utilisateur
curl http://localhost:4000/api/leaves/user/user-uuid/stats \
  -H "Authorization: Bearer $TOKEN"

# 8. Rejeter une demande
curl -X POST http://localhost:4000/api/leaves/leave-uuid/reject \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rejectionReason":"Période saturée"}'
```

### Résultats des tests

#### ✅ CREATE Leave Request
```json
{
  "id": "3490266a-fc10-45e5-a894-a0a1c5a2ba7e",
  "userId": "d7958fc0-dbb8-434b-bc8f-250ad4a29166",
  "type": "PAID_LEAVE",
  "status": "PENDING",
  "startDate": "2025-11-01T00:00:00.000Z",
  "endDate": "2025-11-05T00:00:00.000Z",
  "days": "5",
  "reason": "Congés annuels - vacances en famille",
  "approverId": null,
  "approvedAt": null,
  "createdAt": "2025-10-15T11:55:00.169Z",
  "updatedAt": "2025-10-15T11:55:00.169Z",
  "user": {
    "id": "d7958fc0-dbb8-434b-bc8f-250ad4a29166",
    "email": "test.admin@orchestra.local",
    "firstName": "Test",
    "lastName": "Admin",
    "role": "ADMIN"
  }
}
```

#### ✅ UPDATE Leave Request
```json
{
  "id": "3490266a-fc10-45e5-a894-a0a1c5a2ba7e",
  "status": "PENDING",
  "endDate": "2025-11-06T00:00:00.000Z",
  "days": "6",
  "reason": "Congés annuels - vacances en famille (mis à jour)",
  "updatedAt": "2025-10-15T11:55:00.254Z"
}
```

#### ✅ APPROVE Leave Request
```json
{
  "id": "3490266a-fc10-45e5-a894-a0a1c5a2ba7e",
  "status": "APPROVED",
  "approverId": "d7958fc0-dbb8-434b-bc8f-250ad4a29166",
  "approvedAt": "2025-10-15T11:55:00.267Z",
  "updatedAt": "2025-10-15T11:55:00.268Z"
}
```

#### ✅ REJECT Leave Request
```json
{
  "id": "036eb769-d054-43e5-abd0-f10ed5574db0",
  "status": "REJECTED",
  "reason": "Maladie\n\n[REJETÉ] Période déjà saturée en demandes de congés",
  "approverId": "d7958fc0-dbb8-434b-bc8f-250ad4a29166",
  "approvedAt": "2025-10-15T11:55:00.309Z"
}
```

#### ✅ CANCEL Approved Leave
```json
{
  "id": "dc41928a-16ee-4d81-9ddf-a818da53f607",
  "status": "CANCELLED",
  "updatedAt": "2025-10-15T11:55:00.355Z"
}
```

#### ✅ GET User Leave Stats
```json
{
  "userId": "d7958fc0-dbb8-434b-bc8f-250ad4a29166",
  "totalLeaves": 3,
  "byStatus": [
    {
      "status": "APPROVED",
      "count": 1,
      "totalDays": "6"
    },
    {
      "status": "REJECTED",
      "count": 1,
      "totalDays": "2"
    },
    {
      "status": "CANCELLED",
      "count": 1,
      "totalDays": "1"
    }
  ],
  "byType": [
    {
      "type": "PAID_LEAVE",
      "count": 1,
      "totalDays": "6"
    },
    {
      "type": "SICK_LEAVE",
      "count": 1,
      "totalDays": "2"
    },
    {
      "type": "RTT",
      "count": 1,
      "totalDays": "1"
    }
  ]
}
```

---

## Problèmes résolus

### 1. Utilisation directe d'axios au lieu du client centralisé
**Problème**: Le fichier `leaves.api.ts` utilisait axios directement.

**Solution**: Réécrit pour utiliser le client API centralisé `./client`.

**Code avant**:
```typescript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export const leavesAPI = {
  async createLeave(data: any): Promise<Leave> {
    const response = await axios.post(`${API_URL}/leaves`, data);
    return response.data;
  },
}
```

**Code après**:
```typescript
import api from './client';

export const leavesAPI = {
  async createLeave(data: CreateLeaveRequest): Promise<Leave> {
    return await api.post('/leaves', data);
  },

  async approveLeave(leaveId: string): Promise<Leave> {
    return await api.post(`/leaves/${leaveId}/approve`);
  },

  async rejectLeave(leaveId: string, data: RejectLeaveRequest): Promise<Leave> {
    return await api.post(`/leaves/${leaveId}/reject`, data);
  },

  async cancelLeave(leaveId: string): Promise<Leave> {
    return await api.post(`/leaves/${leaveId}/cancel`);
  },
}
```

### 2. Champ `days` requis dans CreateLeaveDto
**Problème**: Le DTO exige le champ `days` (nombre de jours de congé).

**Raison**: Permet de supporter les demi-journées (0.5, 1.5, etc.) et de valider que la demande est cohérente.

**Solution**: Ajouter le champ `days` dans toutes les requêtes de création.

### 3. Règles métier strictes sur UPDATE/DELETE
**Problème**: Impossible de modifier/supprimer une demande déjà APPROVED/REJECTED.

**Comportement attendu**: C'est normal ! Règles métier :
- UPDATE : Seulement PENDING
- DELETE : Seulement PENDING
- CANCEL : Seulement APPROVED (et uniquement ADMIN/RESPONSABLE)

**Message d'erreur**:
```json
{
  "message": "Seules les demandes en attente peuvent être supprimées",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## Compte de test

- **Email**: `test.admin@orchestra.local`
- **Password**: `Admin1234`
- **Role**: `ADMIN`
- **ID**: `d7958fc0-dbb8-434b-bc8f-250ad4a29166`

---

## État global de la migration

### ✅ TOUTES LES SESSIONS VALIDÉES (6/6) 🎉
1. ✅ **Session 1**: Departments
2. ✅ **Session 2**: Comments
3. ✅ **Session 3**: SimpleTasks
4. ✅ **Session 4**: Presence
5. ✅ **Session 5**: Documents
6. ✅ **Session 6**: Leaves

### 🏆 Migration COMPLÈTE !

**Tous les services Firebase ont été migrés vers REST API + PostgreSQL**

---

## Notes techniques

- **Base de données**: PostgreSQL 16
- **ORM**: Prisma
- **Backend**: NestJS avec TypeScript
- **Frontend**: React avec TypeScript
- **Auth**: JWT (accessToken 15min + refreshToken 30j)
- **Docker**: Frontend port 3001, Backend port 4000
- **Permissions**: ADMIN/RESPONSABLE/MANAGER pour workflow
- **Decimal**: Support des demi-journées (Prisma Decimal)

---

## Conclusion

✅ La migration du service **Leaves** est **100% fonctionnelle**.
✅ Tous les tests API passent avec succès.
✅ Le workflow complet d'approbation fonctionne (PENDING → APPROVED → CANCELLED).
✅ Le workflow de rejet fonctionne (PENDING → REJECTED).
✅ Les règles métier sont respectées (permissions, statuts).
✅ Le fichier frontend `leaves.api.ts` a été corrigé.
✅ Les statistiques par utilisateur fonctionnent.

**Session 6 : COMPLÈTEMENT VALIDÉE (Backend + Frontend + Workflow)**

---

## 🎉 MIGRATION FIREBASE → REST API : 100% TERMINÉE

**Toutes les 6 sessions ont été testées et validées avec succès !**

1. ✅ Departments - CRUD + Hiérarchie
2. ✅ Comments - CRUD + Permissions
3. ✅ SimpleTasks - CRUD + Bulk operations
4. ✅ Presence - Calculs + Telework overrides
5. ✅ Documents - Upload/Download MinIO + Pre-signed URLs
6. ✅ Leaves - Workflow d'approbation complet

**L'application Orchestra est maintenant 100% sur REST API + PostgreSQL + MinIO !**
