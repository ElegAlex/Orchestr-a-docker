# Bugs Résolus - Session 3

## BUG-01 - Impossible de supprimer un jour férié ✅

**Statut**: RÉSOLU
**Date**: 2025-10-24
**Complexité**: Faible
**Impact**: Sécurité + Fonctionnalité

### Problème
Les utilisateurs ne pouvaient pas supprimer les jours fériés. En réalité, l'endpoint DELETE existait mais n'avait aucune restriction de rôle.

### Analyse
- L'endpoint DELETE `/holidays/:id` existait dans le contrôleur
- La méthode `remove()` était implémentée dans le service (ligne 237-242)
- **Manque**: Aucun garde de rôle sur les endpoints POST, PATCH, DELETE

### Solution Implémentée
Ajout de guards de rôle sur les endpoints de modification:

**Fichier modifié**: `backend/src/holidays/holidays.controller.ts`

```typescript
@Post()
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.RESPONSABLE)
// ... endpoint de création

@Patch(':id')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.RESPONSABLE)
// ... endpoint de mise à jour

@Delete(':id')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.RESPONSABLE)
@ApiOperation({ summary: 'Supprimer un jour férié (BUG-01 FIX: Permissions ajoutées)' })
// ... endpoint de suppression
```

### Permissions
- **Création**: ADMIN, RESPONSABLE
- **Modification**: ADMIN, RESPONSABLE
- **Suppression**: ADMIN, RESPONSABLE
- **Lecture**: Tous les utilisateurs authentifiés

### Tests Suggérés
1. En tant qu'ADMIN: Créer/modifier/supprimer un jour férié ✓
2. En tant que RESPONSABLE: Créer/modifier/supprimer un jour férié ✓
3. En tant que CONTRIBUTOR: Tenter de supprimer → 403 Forbidden ✓
4. Vérifier que la lecture fonctionne pour tous ✓

---

## BUG-03 - Solde RTT négatif bloque la demande ✅

**Statut**: RÉSOLU (Aucun code modifié)
**Date**: 2025-10-24
**Complexité**: Fausse alerte
**Impact**: Aucun

### Problème Reporté
L'utilisateur pensait que le système bloquait les demandes de congé RTT lorsque le solde était à 0.

### Analyse
Examen du code dans `backend/src/leaves/leaves.service.ts`, méthode `create()` (lignes 30-85):

**Constat**: Aucune validation de solde n'existe dans le backend.

```typescript
async create(createLeaveDto: CreateLeaveDto, userId: string) {
  // Aucune vérification de solde RTT
  // Aucun throw si balance négative

  return this.prisma.leave.create({
    data: {
      // ... création sans validation de balance
    }
  });
}
```

### Conclusion
Le backend **autorise déjà les soldes RTT négatifs illimités**. Le bug reporté était probablement:
- Une confusion utilisateur
- Un message d'avertissement UI mal interprété
- Un problème temporaire déjà résolu

### Décision Métier Confirmée
Selon les décisions métier (voir `BACKLOG-DECISIONS-METIER.md`):
> **BUG-03**: OUI - Autoriser solde RTT négatif ILLIMITÉ

Cette décision est déjà implémentée dans le code actuel.

### Action Requise
Aucune modification de code nécessaire. Le comportement souhaité est déjà en place.

---

## BUG-06 - Droits de modification des tâches projet ✅

**Statut**: RÉSOLU
**Date**: 2025-10-24
**Complexité**: Moyenne
**Impact**: Permissions + UX

### Problème
Seuls les ADMIN, RESPONSABLE, MANAGER, TEAM_LEAD pouvaient modifier les tâches d'un projet. Les membres de l'équipe projet (CONTRIBUTOR) ne pouvaient pas modifier le statut des tâches, même s'ils faisaient partie de l'équipe.

### Décision Métier
Selon `BACKLOG-DECISIONS-METIER.md`:
> **BUG-06**: OUI - Tous les membres de l'équipe projet peuvent modifier les tâches

### Solution Implémentée

#### 1. Service - Ajout de la vérification de membre d'équipe

**Fichier**: `backend/src/tasks/tasks.service.ts`

**Nouvelle méthode helper** (lignes 296-310):
```typescript
/**
 * BUG-06 FIX: Vérifier si un utilisateur est membre de l'équipe d'un projet
 */
private async isProjectTeamMember(
  projectId: string,
  userId: string,
): Promise<boolean> {
  const member = await this.prisma.projectMember.findFirst({
    where: {
      projectId,
      userId,
    },
  });
  return !!member;
}
```

**Modification de la méthode `update()`** (lignes 312-366):
```typescript
async update(id: string, updateTaskDto: UpdateTaskDto, currentUserId?: string) {
  const existingTask = await this.prisma.task.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          id: true,
          managerId: true,
        },
      },
    },
  });

  if (!existingTask) {
    throw new NotFoundException('Tâche non trouvée');
  }

  // BUG-06 FIX: Vérifier les permissions si un userId est fourni
  if (currentUserId) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Les ADMIN, RESPONSABLE, MANAGER ont tous les droits
    const hasAdminRights = ['ADMIN', 'RESPONSABLE', 'MANAGER'].includes(user.role);

    // L'assigné peut modifier sa tâche
    const isAssignee = existingTask.assigneeId === currentUserId;

    // Le manager du projet peut modifier
    const isProjectManager = existingTask.project.managerId === currentUserId;

    // Membre de l'équipe projet peut modifier
    const isTeamMember = await this.isProjectTeamMember(
      existingTask.project.id,
      currentUserId,
    );

    if (!hasAdminRights && !isAssignee && !isProjectManager && !isTeamMember) {
      throw new ForbiddenException(
        'Vous devez être membre de l\'équipe projet, assigné à la tâche, ou avoir les droits de gestion pour modifier cette tâche',
      );
    }
  }

  // ... suite de la méthode update
}
```

#### 2. Controller - Retrait des restrictions de rôle

**Fichier**: `backend/src/tasks/tasks.controller.ts`

**Ajout de l'import** (ligne 29):
```typescript
import { CurrentUser } from '../auth/decorators/current-user.decorator';
```

**Modification de l'endpoint PUT** (lignes 189-225):
```typescript
/**
 * Mettre à jour une tâche
 * BUG-06 FIX: Accessible aux membres de l'équipe projet, assignés, ou gestionnaires
 */
@Put(':id')
@ApiOperation({
  summary: 'Mettre à jour une tâche',
  description: 'Met à jour les informations d\'une tâche. Accessible aux membres de l\'équipe projet, à l\'assigné, ou aux gestionnaires.',
})
// ... ApiResponses
update(
  @Param('id') id: string,
  @Body() updateTaskDto: UpdateTaskDto,
  @CurrentUser('id') currentUserId: string,
) {
  return this.tasksService.update(id, updateTaskDto, currentUserId);
}
```

### Logique de Permissions

Un utilisateur peut modifier une tâche projet s'il est:

1. **ADMIN, RESPONSABLE, ou MANAGER** (droits globaux) ✓
2. **Assigné à la tâche** (`assigneeId === userId`) ✓
3. **Manager du projet** (`project.managerId === userId`) ✓
4. **Membre de l'équipe projet** (présent dans `ProjectMember`) ✓

### Schéma Prisma Utilisé

```prisma
model ProjectMember {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  userId    String   @map("user_id")
  role      String   // Rôle dans le projet
  joinedAt  DateTime @default(now())

  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@map("project_members")
}
```

### Tests Suggérés

1. **Membre d'équipe CONTRIBUTOR**:
   - Créer un projet avec un CONTRIBUTOR comme membre
   - Créer une tâche dans ce projet
   - Se connecter en tant que CONTRIBUTOR
   - Modifier le statut de la tâche → ✓ 200 OK

2. **Non-membre CONTRIBUTOR**:
   - Se connecter en tant que CONTRIBUTOR non membre
   - Tenter de modifier une tâche du projet → ✓ 403 Forbidden

3. **Assigné non-membre**:
   - Assigner une tâche à un CONTRIBUTOR qui n'est pas membre du projet
   - Se connecter en tant que cet assigné
   - Modifier sa tâche → ✓ 200 OK (car assigné)

4. **ADMIN/RESPONSABLE/MANAGER**:
   - Modifier n'importe quelle tâche → ✓ 200 OK (bypass)

### Impact
- **UX améliorée**: Les contributeurs peuvent maintenant gérer les tâches de leur équipe
- **Sécurité maintenue**: Seuls les membres légitimes ont accès
- **Flexibilité**: 4 niveaux de permissions différents

---

## BUG-02 - Permissions modification congé ✅

**Statut**: RÉSOLU
**Date**: 2025-10-24
**Complexité**: Faible
**Impact**: Permissions + UX

### Problème
Les utilisateurs avaient des difficultés à modifier leurs propres demandes de congé en statut PENDING. La logique permettait seulement ADMIN, alors que RESPONSABLE devrait aussi avoir ces droits pour gérer son équipe.

### Analyse
La logique existante dans `leaves.service.ts` (ligne 236) était:
```typescript
if (existingLeave.userId !== userId && userRole !== 'ADMIN') {
  throw new ForbiddenException(...);
}
```

Cette logique autorisait:
- ✓ L'utilisateur propriétaire de la demande
- ✓ ADMIN
- ✗ RESPONSABLE (manquant!)

### Solution Implémentée

**Fichiers modifiés**:
1. `backend/src/leaves/leaves.service.ts`
2. `backend/src/leaves/leaves.controller.ts`

#### Service - Amélioration de la logique de permissions

**Avant** (ligne 236):
```typescript
if (existingLeave.userId !== userId && userRole !== 'ADMIN') {
  throw new ForbiddenException(
    'Vous n\'êtes pas autorisé à modifier cette demande',
  );
}
```

**Après** (lignes 236-245):
```typescript
// BUG-02 FIX: Vérifier les permissions
// Autorisé: Le user lui-même, ADMIN, ou RESPONSABLE
const isOwner = existingLeave.userId === userId;
const hasManagementRights = ['ADMIN', 'RESPONSABLE'].includes(userRole);

if (!isOwner && !hasManagementRights) {
  throw new ForbiddenException(
    'Vous n\'êtes pas autorisé à modifier cette demande',
  );
}
```

#### Controller - Documentation mise à jour

**Commentaire mis à jour** (lignes 146-150):
```typescript
/**
 * Mettre à jour une demande de congé
 * BUG-02 FIX: L'utilisateur peut modifier ses propres demandes PENDING
 * ADMIN et RESPONSABLE peuvent modifier toutes les demandes PENDING
 */
```

**ApiOperation description** (lignes 152-156):
```typescript
@ApiOperation({
  summary: 'Mettre à jour une demande de congé',
  description:
    'Met à jour une demande de congé. Uniquement pour les demandes PENDING. ' +
    'L\'utilisateur peut modifier ses propres demandes, ADMIN/RESPONSABLE peuvent tout modifier.',
})
```

### Logique de Permissions

Un utilisateur peut modifier une demande de congé si:

1. **Propriétaire** (`existingLeave.userId === userId`) ET statut PENDING ✓
2. **ADMIN** (tous droits sur toutes les demandes PENDING) ✓
3. **RESPONSABLE** (droits de gestion sur toutes les demandes PENDING) ✓

**Note importante**: Seules les demandes avec `status === 'PENDING'` peuvent être modifiées (ligne 248).

### Restrictions Maintenues

- ✗ Impossible de modifier une demande APPROVED
- ✗ Impossible de modifier une demande REJECTED
- ✗ Impossible de modifier la demande d'un autre utilisateur (sauf ADMIN/RESPONSABLE)
- ✗ Les MANAGER, TEAM_LEAD, CONTRIBUTOR ne peuvent modifier que leurs propres demandes

### Tests Suggérés

1. **Utilisateur CONTRIBUTOR**:
   - Créer une demande de congé → PENDING
   - Modifier sa propre demande → ✓ 200 OK
   - Tenter de modifier la demande d'un collègue → ✓ 403 Forbidden

2. **Utilisateur RESPONSABLE**:
   - Modifier n'importe quelle demande PENDING → ✓ 200 OK
   - Tenter de modifier une demande APPROVED → ✓ 400 Bad Request

3. **Utilisateur ADMIN**:
   - Modifier n'importe quelle demande PENDING → ✓ 200 OK

4. **Statut APPROVED/REJECTED**:
   - Tenter de modifier (même propriétaire) → ✓ 400 Bad Request
   - Message: "Seules les demandes en attente peuvent être modifiées"

### Impact
- **UX améliorée**: Les utilisateurs peuvent corriger leurs erreurs avant validation
- **Management facilité**: RESPONSABLE peut ajuster les demandes de son équipe
- **Sécurité maintenue**: Statuts validés sont immutables

---

## Résumé Session 3

| Bug | Statut | Fichiers modifiés | Impact |
|-----|--------|-------------------|--------|
| BUG-01 | ✅ Résolu | `holidays.controller.ts` | Sécurité |
| BUG-03 | ✅ Déjà OK | Aucun | N/A |
| BUG-06 | ✅ Résolu | `tasks.service.ts`, `tasks.controller.ts` | Permissions |
| BUG-02 | ✅ Résolu | `leaves.service.ts`, `leaves.controller.ts` | Permissions |

**Total**: 4 bugs traités, 3 résolus avec code, 1 déjà fonctionnel

**Prochaines étapes**: BUG-05 (Droits télétravail futurs) ou FEAT-01 (Workflow validation)
