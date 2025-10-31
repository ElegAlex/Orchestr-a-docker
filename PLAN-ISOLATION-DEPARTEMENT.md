# 🏢 PLAN D'ISOLATION PAR DÉPARTEMENT - ORCHESTR'A

> **Objectif** : Isoler les utilisateurs par département avec accès cross-département pour ADMIN et RESPONSABLE
> **Date** : 19 octobre 2025
> **Status** : ✅ Architecture validée - Prêt pour implémentation

---

## 📋 RÉSUMÉ EXÉCUTIF

### Besoin
- Chaque utilisateur doit être lié à **un département obligatoire**
- Les utilisateurs d'un département ne voient/interagissent qu'avec leur département
- **Exceptions** : Les rôles `ADMIN` et `RESPONSABLE` ont accès cross-département

### État Actuel
✅ **Bonne nouvelle** : L'infrastructure de base existe déjà !
- ✅ Champ `departmentId` présent dans le modèle User (actuellement optionnel)
- ✅ Table `Department` complète avec relations
- ✅ Index sur `departmentId` pour performance

### Changements Nécessaires
1. **Backend** : Rendre `departmentId` obligatoire + Guard d'isolation
2. **Frontend** : Filtrage automatique selon le département de l'utilisateur connecté
3. **Migration** : Assigner un département par défaut aux users existants

---

## 🏗️ ARCHITECTURE CIBLE

### 1. Modèle de Données (Prisma)

#### User (modification)
```prisma
model User {
  // ...
  // AVANT : departmentId  String?   @map("department_id")
  // APRÈS :
  departmentId  String    @map("department_id")  // ✅ OBLIGATOIRE
  department    Department @relation(fields: [departmentId], references: [id])
  // ...
}
```

**Exception** : Les utilisateurs `ADMIN` peuvent avoir `departmentId = 'ALL'` (département virtuel)

### 2. Backend - Guard d'Isolation

#### Nouveau Guard : `DepartmentIsolationGuard`

**Localisation** : `backend/src/auth/guards/department-isolation.guard.ts`

**Logique** :
```typescript
@Injectable()
export class DepartmentIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // JWT user

    // ADMIN et RESPONSABLE ont accès à tout
    if (user.role === 'ADMIN' || user.role === 'RESPONSABLE') {
      return true;
    }

    // Injecter le departmentId dans la requête pour filtrage automatique
    request.departmentFilter = user.departmentId;

    return true;
  }
}
```

#### Décorateur : `@AllowCrossDepartment()`

Pour les endpoints qui doivent bypass l'isolation (ex: Settings, Admin panels) :
```typescript
@AllowCrossDepartment()
@Get('/admin/all-users')
async getAllUsers() { ... }
```

### 3. Backend - Services Modifiés

Tous les services qui retournent des listes d'utilisateurs doivent filtrer par département :

#### UsersService
```typescript
async findAll(filters?: any): Promise<User[]> {
  const departmentFilter = filters?.departmentId;

  return this.prisma.user.findMany({
    where: {
      // Si departmentFilter existe, filtrer par département
      ...(departmentFilter && { departmentId: departmentFilter }),
      // Autres filtres...
    },
  });
}
```

**Services à adapter** :
- ✅ `UsersService` - Filtrer les utilisateurs
- ✅ `ProjectsService` - Filtrer les projets par membres du département
- ✅ `TasksService` - Filtrer les tâches par assignés du département
- ✅ `LeavesService` - Filtrer les congés
- ✅ `SimpleTasksService` - Filtrer les tâches simples
- ✅ `NotificationsService` - Filtrer les notifications
- ✅ `ActivitiesService` - Filtrer les activités
- ✅ `TeleworkService` - Filtrer les profils télétravail

### 4. Frontend - Hook `useDepartmentFilter`

**Localisation** : `orchestra-app/src/hooks/useDepartmentFilter.ts`

```typescript
export const useDepartmentFilter = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const canSeeAllDepartments = useMemo(() => {
    return currentUser?.role === 'ADMIN' || currentUser?.role === 'RESPONSABLE';
  }, [currentUser]);

  const currentDepartmentId = useMemo(() => {
    return canSeeAllDepartments ? null : currentUser?.departmentId;
  }, [canSeeAllDepartments, currentUser]);

  const filterByDepartment = useCallback(<T extends { departmentId?: string }>(
    items: T[]
  ): T[] => {
    if (canSeeAllDepartments) return items;
    return items.filter(item => item.departmentId === currentDepartmentId);
  }, [canSeeAllDepartments, currentDepartmentId]);

  return {
    canSeeAllDepartments,
    currentDepartmentId,
    filterByDepartment,
  };
};
```

### 5. Frontend - Composants à Adapter

#### Calendar (PlanningCalendar.tsx)
```typescript
const { filterByDepartment, canSeeAllDepartments, currentDepartmentId } = useDepartmentFilter();

// Lors du chargement des users
const allUsers = await userService.getUsers();
const departmentUsers = filterByDepartment(allUsers);
setUsers(departmentUsers);
```

**Composants à modifier** :
- ✅ `PlanningCalendar.tsx` - Filtrer les utilisateurs affichés
- ✅ `Projects.tsx` - Filtrer les projets (membres du département)
- ✅ `Dashboard.tsx` - Filtrer les données du tableau de bord
- ✅ `HRAdmin.tsx` - Filtrer les congés et présences
- ✅ `Reports.tsx` - Filtrer les rapports
- ✅ `UserManagement.tsx` - Filtrer les utilisateurs (sauf ADMIN/RESPONSABLE)

---

## 🎯 PLAN D'IMPLÉMENTATION PROGRESSIVE

### Phase 1 : Backend - Fondations (2h)
1. ✅ Modifier `schema.prisma` : Rendre `departmentId` obligatoire
2. ✅ Créer migration : Assigner département par défaut aux users sans département
3. ✅ Créer `DepartmentIsolationGuard`
4. ✅ Créer décorateur `@AllowCrossDepartment()`
5. ✅ Appliquer le Guard globalement dans `app.module.ts`

**Tests** : Vérifier que les requêtes API filtrent par département

### Phase 2 : Backend - Services (3h)
1. ✅ Adapter `UsersService` pour filtrage automatique
2. ✅ Adapter `ProjectsService` (filtrer par département des membres)
3. ✅ Adapter `TasksService` (filtrer par département des assignés)
4. ✅ Adapter `LeavesService`, `SimpleTasksService`, etc.
5. ✅ Ajouter `@AllowCrossDepartment()` aux endpoints admin

**Tests** : Tester chaque service avec différents rôles (CONTRIBUTOR vs ADMIN)

### Phase 3 : Frontend - Hook & Utils (1h)
1. ✅ Créer `useDepartmentFilter` hook
2. ✅ Créer `departmentFilter.utils.ts` pour helpers
3. ✅ Ajouter le département dans Redux state user

**Tests** : Vérifier que le hook retourne les bonnes valeurs

### Phase 4 : Frontend - Composants (4h)
1. ✅ Adapter `PlanningCalendar.tsx`
2. ✅ Adapter `Projects.tsx`
3. ✅ Adapter `Dashboard.tsx`
4. ✅ Adapter `HRAdmin.tsx`
5. ✅ Adapter `Reports.tsx`
6. ✅ Adapter `UserManagement.tsx`

**Tests** : Tester chaque page avec user CONTRIBUTOR et ADMIN

### Phase 5 : Tests & Documentation (1h)
1. ✅ Tests end-to-end de l'isolation
2. ✅ Vérifier les cas limites (changement de département)
3. ✅ Mettre à jour STATUS.md
4. ✅ Documenter dans DEPLOYMENT-GUIDE.md

**Tests** : Scenario complet avec 3 départements et différents rôles

---

## 🔒 RÈGLES D'ISOLATION

### Matrice des Accès

| Rôle | Accès Département | Peut voir autres départements | Peut modifier autres départements |
|------|-------------------|-------------------------------|-----------------------------------|
| **ADMIN** | Tous | ✅ Oui | ✅ Oui |
| **RESPONSABLE** | Tous | ✅ Oui | ✅ Oui |
| **MANAGER** | Le sien | ❌ Non | ❌ Non |
| **TEAM_LEAD** | Le sien | ❌ Non | ❌ Non |
| **CONTRIBUTOR** | Le sien | ❌ Non | ❌ Non |
| **VIEWER** | Le sien | ❌ Non | ❌ Non |

### Exceptions (Cross-Département Autorisé)

**Endpoints toujours accessibles** (peu importe le département) :
- `GET /api/departments` - Liste des départements (dropdown)
- `GET /api/auth/me` - Profil utilisateur connecté
- `GET /api/settings` - Paramètres application
- `POST /api/auth/logout` - Déconnexion

**Endpoints admin uniquement** :
- `GET /api/users/admin/all` - Tous les utilisateurs (ADMIN uniquement)
- `GET /api/departments/:id/users` - Users d'un département (ADMIN/RESPONSABLE)

---

## 📊 IMPACTS SUR LES DONNÉES

### Migration des Données Existantes

**Script de migration** :
```sql
-- Créer un département par défaut "Général"
INSERT INTO departments (id, name, code, description, is_active)
VALUES ('default-dept-001', 'Général', 'GEN', 'Département par défaut', true);

-- Assigner tous les users sans département au département "Général"
UPDATE users
SET department_id = 'default-dept-001'
WHERE department_id IS NULL;

-- Rendre le champ obligatoire
ALTER TABLE users
ALTER COLUMN department_id SET NOT NULL;
```

### Données Partagées Entre Départements

**Certaines données peuvent être cross-département** :
- ✅ **Projets** : Un projet peut avoir des membres de différents départements
  - Règle : Le projet est visible si AU MOINS 1 membre est du département de l'user
- ✅ **Départements** : Tous les users voient la liste des départements (pour les dropdowns)
- ✅ **Services** : Tous les users voient les services (pour assignation)

---

## 🧪 SCÉNARIOS DE TESTS

### Test 1 : Isolation User Simple
**Setup** :
- User A (CONTRIBUTOR, Département RH)
- User B (CONTRIBUTOR, Département IT)
- User C (ADMIN)

**Tests** :
- ✅ User A ne voit que les users du département RH
- ✅ User B ne voit que les users du département IT
- ✅ User C voit TOUS les users

### Test 2 : Projets Cross-Département
**Setup** :
- Projet P1 avec membres : User A (RH), User B (IT)
- User C (CONTRIBUTOR, RH)
- User D (CONTRIBUTOR, IT)

**Tests** :
- ✅ User C voit le projet P1 (car User A du RH est membre)
- ✅ User D voit le projet P1 (car User B de IT est membre)

### Test 3 : Tâches et Congés
**Setup** :
- User A (CONTRIBUTOR, RH) crée une tâche
- User B (CONTRIBUTOR, IT) crée un congé

**Tests** :
- ✅ User A ne voit pas le congé de User B
- ✅ User B ne voit pas la tâche de User A
- ✅ ADMIN voit les deux

---

## 📝 CHECKLIST AVANT DÉPLOIEMENT

### Backend
- [ ] Migration Prisma créée et testée
- [ ] `DepartmentIsolationGuard` créé et testé
- [ ] Tous les services adaptés (8 services minimum)
- [ ] Tests unitaires sur le Guard
- [ ] Tests E2E sur l'isolation

### Frontend
- [ ] Hook `useDepartmentFilter` créé et testé
- [ ] 6 composants principaux adaptés
- [ ] Tests des accès ADMIN vs CONTRIBUTOR
- [ ] Vérification UX (pas de "page vide" si aucune donnée)

### Documentation
- [ ] STATUS.md mis à jour
- [ ] DEPLOYMENT-GUIDE.md complété
- [ ] README-MIGRATION-FINALE.md actualisé

---

## 🎯 ESTIMATION TOTALE

**Temps estimé** : ~11 heures de développement
- Backend : 5h
- Frontend : 5h
- Tests & Doc : 1h

**Complexité** : ⭐⭐⭐⭐☆ (4/5)
**Impact** : 🔥🔥🔥🔥🔥 (Critique - Architecture)
**Risque** : ⚠️ Moyen (Migration de données + changement de comportement)

---

## ✅ VALIDATION

**Ce plan est prêt pour implémentation** si vous validez :
1. ✅ Les ADMIN et RESPONSABLE ont accès cross-département
2. ✅ Les projets cross-département sont visibles si AU MOINS 1 membre est du département
3. ✅ Migration des users existants vers un département "Général" par défaut
4. ✅ Les départements et services restent visibles pour tous (dropdowns)

---

**Prêt à commencer ?** 🚀

Je peux démarrer par :
1. **Phase 1** : Modifier le schéma Prisma + créer la migration
2. **Phase 2** : Créer le Guard d'isolation backend
3. **Phase 3** : Adapter les services backend

**Votre décision ?**
