# Décisions Métier - Backlog Orchestr'A

**Date:** 24 octobre 2025
**Objectif:** Documenter les décisions métier pour guider l'implémentation

---

## Décisions Validées

### BUG-03: Solde RTT Négatif

**Question:** Comment gérer les soldes RTT négatifs ?

**Décision:** ✅ **Autoriser solde négatif illimité**

**Justification:**
- Flexibilité maximale pour les utilisateurs
- Pas de blocage administratif
- La validation managériale (FEAT-01) sera la vraie barrière de contrôle
- Permet de gérer les cas exceptionnels sans intervention technique

**Implémentation:**
```typescript
// Supprimer la vérification de solde minimum dans leaves.service.ts
// Ancienne règle: if (balance < 0) throw new BadRequestException()
// Nouvelle règle: Aucune vérification (autoriser négatif)
```

**Impact:**
- ⚠️ Surveiller les abus potentiels via rapports
- ✅ Workflow de validation (FEAT-01) sera le contrôle principal
- ✅ Système plus souple et moins frustrant pour les users

---

### BUG-06: Droits Équipe Projet

**Question:** Qui peut modifier le statut d'une tâche projet ?

**Décision:** ✅ **Tous les membres de l'équipe peuvent modifier**

**Justification:**
- Équipes autonomes et agiles
- Pas besoin d'attendre le manager pour chaque changement
- Favorise la collaboration
- Le projet reste visible/modifiable par toute l'équipe

**Implémentation:**
```typescript
// Dans tasks.service.ts - méthode updateStatus()
// Vérifier:
// 1. User est membre de l'équipe projet OU
// 2. User est assignee de la tâche OU
// 3. User est ADMIN/RESPONSABLE/MANAGER (global)
```

**Règles:**
- ✅ Membre équipe projet → Peut modifier statut
- ✅ Assignee de la tâche → Peut modifier
- ✅ ADMIN/RESPONSABLE/MANAGER → Peut toujours modifier
- ❌ Utilisateur externe au projet → Interdit (403)

**Impact:**
- ✅ Équipes plus autonomes
- ✅ Moins de friction dans le workflow
- ⚠️ Risque de changements non voulus (mitigé par l'historique)

---

### FEAT-01: Workflow Validation Congés

**Question:** Quel type de workflow de validation ?

**Décision:** ✅ **Simple (demande → validation manager)**

**Justification:**
- Simplicité d'implémentation
- Workflow clair et rapide
- Pas de lourdeur administrative
- Suffisant pour la majorité des cas

**Architecture:**
```
1. USER crée congé
   └─ Status: PENDING

2. MANAGER/RESPONSABLE/ADMIN approuve
   └─ Status: APPROVED
   └─ Notification à l'utilisateur

3. Alternative: MANAGER rejette
   └─ Status: REJECTED
   └─ Raison obligatoire
   └─ Notification à l'utilisateur
```

**Implémentation:**
```typescript
// Workflow states (déjà dans schema.prisma)
enum LeaveStatus {
  PENDING    // En attente de validation
  APPROVED   // Approuvé par manager
  REJECTED   // Refusé par manager
  CANCELLED  // Annulé par user ou admin
}

// Nouvelles routes API
POST /leaves/:id/approve  (MANAGER/RESPONSABLE/ADMIN)
POST /leaves/:id/reject   (MANAGER/RESPONSABLE/ADMIN + raison)
```

**Notifications:**
- 📧 Manager reçoit notification lors de demande
- 📧 User reçoit notification lors d'approbation/rejet
- 📧 Option: notification équipe si absence longue durée

**Impact:**
- ✅ Contrôle managérial sur les absences
- ✅ Traçabilité complète
- ✅ Utilisateurs savent où ils en sont (status visible)
- ✅ Répond au besoin #1 des utilisateurs

**Phase 2 (Future - si besoin):**
- Multi-niveaux (N+1 puis RH)
- Délégation de validation
- Validation automatique selon règles

---

## Résumé des Décisions

| Bug/Feature | Question | Décision | Complexité |
|-------------|----------|----------|------------|
| **BUG-03** | Solde RTT négatif | Illimité | 🟢 Faible |
| **BUG-06** | Droits équipe projet | Tous les membres | 🟡 Moyenne |
| **FEAT-01** | Workflow validation | Simple (1 niveau) | 🟠 Moyenne/Haute |

---

## Ordre de Résolution Ajusté

Avec ces décisions, voici l'ordre optimal :

### Jour 2 (Aujourd'hui - Fin de journée)
```
1. BUG-01 - DELETE jours fériés (4h)
   └─ Bloque BUG-03 (calcul correct)
```

### Jour 3
```
2. BUG-03 - Solde RTT illimité (3h au lieu de 6h)
   └─ Simple: supprimer validation solde

3. BUG-06 - Droits équipe projet (4h)
   └─ Vérifier membership équipe projet
```

### Jour 4
```
4. BUG-02 - Permissions modification congé (3h)
   └─ User peut modifier ses propres congés PENDING
```

### Jours 5-7
```
5. FEAT-01 - Workflow validation simple (2-3 jours)
   ├─ Backend: approve/reject endpoints
   ├─ Frontend: boutons validation pour managers
   ├─ Notifications: email/in-app
   └─ Tests: workflow complet
```

---

## Notes d'Implémentation

### BUG-03: Solde RTT Illimité

**Fichier:** `backend/src/leaves/leaves.service.ts`

**Action:**
```typescript
// Ligne à supprimer/commenter dans create()
// if (currentBalance < requestedDays) {
//   throw new BadRequestException('Solde RTT insuffisant');
// }

// Nouvelle logique
// Aucune vérification de solde
// Le workflow de validation (FEAT-01) sera le contrôle
```

**Warning à ajouter:**
```typescript
// Si solde négatif, ajouter un warning dans la réponse
if (newBalance < 0) {
  response.warning = `Attention: solde RTT négatif (${newBalance} jours)`;
}
```

---

### BUG-06: Droits Équipe Projet

**Fichier:** `backend/src/tasks/tasks.service.ts`

**Action:**
```typescript
async updateStatus(taskId: string, status: TaskStatus, currentUser: User) {
  const task = await this.findOne(taskId);

  // Vérifier permissions
  const canUpdate =
    // 1. User est assignee
    task.assigneeId === currentUser.id ||

    // 2. User est membre de l'équipe projet
    await this.isProjectTeamMember(task.projectId, currentUser.id) ||

    // 3. User a rôle global élevé
    ['ADMIN', 'RESPONSABLE', 'MANAGER'].includes(currentUser.role);

  if (!canUpdate) {
    throw new ForbiddenException(
      'Vous devez être membre de l\'équipe projet pour modifier cette tâche'
    );
  }

  // Mettre à jour
  return this.prisma.task.update({ where: { id: taskId }, data: { status } });
}

async isProjectTeamMember(projectId: string, userId: string): Promise<boolean> {
  const member = await this.prisma.projectMember.findFirst({
    where: { projectId, userId }
  });
  return !!member;
}
```

---

### FEAT-01: Workflow Validation Simple

**Backend - Nouvelles Routes:**

```typescript
// leaves.controller.ts
@Post(':id/approve')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.RESPONSABLE, Role.MANAGER)
async approve(
  @Param('id') id: string,
  @CurrentUser('id') approverId: string
) {
  return this.leavesService.approve(id, approverId);
}

@Post(':id/reject')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.RESPONSABLE, Role.MANAGER)
async reject(
  @Param('id') id: string,
  @CurrentUser('id') approverId: string,
  @Body('reason') reason: string
) {
  if (!reason) {
    throw new BadRequestException('Raison du rejet obligatoire');
  }
  return this.leavesService.reject(id, approverId, reason);
}
```

**Backend - Service:**

```typescript
// leaves.service.ts
async approve(leaveId: string, approverId: string) {
  const leave = await this.findOne(leaveId);

  if (leave.status !== 'PENDING') {
    throw new BadRequestException('Seules les demandes en attente peuvent être approuvées');
  }

  const updated = await this.prisma.leave.update({
    where: { id: leaveId },
    data: {
      status: 'APPROVED',
      approverId,
      approvedAt: new Date()
    }
  });

  // Notification utilisateur
  await this.notificationService.create({
    userId: leave.userId,
    type: 'LEAVE_APPROVED',
    message: `Votre demande de congé du ${leave.startDate} au ${leave.endDate} a été approuvée`,
    relatedId: leaveId
  });

  return updated;
}

async reject(leaveId: string, approverId: string, reason: string) {
  const leave = await this.findOne(leaveId);

  if (leave.status !== 'PENDING') {
    throw new BadRequestException('Seules les demandes en attente peuvent être rejetées');
  }

  const updated = await this.prisma.leave.update({
    where: { id: leaveId },
    data: {
      status: 'REJECTED',
      approverId,
      approvedAt: new Date(),
      reason: reason // Stocker la raison du rejet
    }
  });

  // Notification utilisateur
  await this.notificationService.create({
    userId: leave.userId,
    type: 'LEAVE_REJECTED',
    message: `Votre demande de congé a été refusée. Raison: ${reason}`,
    relatedId: leaveId
  });

  return updated;
}
```

**Frontend - Boutons Validation:**

```tsx
// MyLeaves.tsx ou LeaveManagement.tsx
{leave.status === 'PENDING' && hasPermission('hr.approve_leaves') && (
  <Stack direction="row" spacing={1}>
    <Button
      variant="contained"
      color="success"
      startIcon={<CheckIcon />}
      onClick={() => handleApprove(leave.id)}
    >
      Approuver
    </Button>
    <Button
      variant="outlined"
      color="error"
      startIcon={<CloseIcon />}
      onClick={() => handleReject(leave.id)}
    >
      Rejeter
    </Button>
  </Stack>
)}
```

---

## Risques et Mitigations

### BUG-03: Solde Illimité

**Risque:** Abus (utilisateurs qui posent trop de RTT)

**Mitigation:**
- ✅ Workflow de validation (FEAT-01) contrôle en amont
- ✅ Rapports RH montrent les soldes négatifs
- ✅ Warning visuel quand solde négatif
- ✅ Dashboard manager montre les demandes en attente

### BUG-06: Tous les Membres

**Risque:** Changements non voulus de statut

**Mitigation:**
- ✅ Historique des modifications (Activity log)
- ✅ Notifications sur changement de statut
- ✅ Possibilité de revert si besoin
- ✅ Seuls les membres ACTIFS du projet

### FEAT-01: Workflow Simple

**Risque:** Besoin futur de multi-niveaux

**Mitigation:**
- ✅ Architecture extensible (status enum peut évoluer)
- ✅ Champ `approverId` unique pour l'instant
- ✅ Phase 2 possible sans refonte majeure
- ✅ Documenter les besoins futurs au fil de l'usage

---

**Document créé le:** 24 octobre 2025
**Validé par:** Utilisateur
**Prochaine action:** Implémentation BUG-01
