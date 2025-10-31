# 🧪 TEST - Correction Calendar Services (18 octobre 2025)

## 🎯 Objectif
Corriger les problèmes d'affichage dans la feature Calendar :
1. **Vue Semaine** : Users non assignés aux services
2. **Vue Mois** : Vue complètement vide

## 🔍 Problème Identifié

### Cause Racine
Le composant `PlanningCalendar.tsx` ne chargeait pas les assignations service-utilisateur via l'API REST `userServiceAssignmentsApi`. Résultat :
- `user.serviceIds` était vide
- Le groupement `workloadDaysByService` plaçait tous les users dans "Sans service"
- La vue mois (`MonthView`) n'affichait rien car le groupement était incorrect

## ✅ Corrections Appliquées

### 1. Import API Assignations Services
```typescript
import { userServiceAssignmentsApi } from '../../services/api/user-service-assignments.api';
```

### 2. Chargement des Assignations
```typescript
const [allUsers, allProjects, allDepartments, allServices, allAssignments] = await Promise.all([
  userService.getAllUsers(),
  projectService.getAllProjects(),
  departmentService.getAllDepartments(),
  serviceService.getAllServices(),
  userServiceAssignmentsApi.getAll().catch(() => []), // ✅ NOUVEAU
]);
```

### 3. Mapping serviceIds aux Users
```typescript
const usersWithServices = allUsers.map(user => {
  // Récupérer les serviceIds depuis les assignations actives
  const userAssignments = allAssignments.filter(
    assignment => assignment.userId === user.id && assignment.isActive
  );
  const serviceIds = userAssignments.map(a => a.serviceId);

  // Fallback sur legacy user.serviceId si nécessaire
  if (serviceIds.length === 0 && user.serviceId) {
    serviceIds.push(user.serviceId);
  }

  return {
    ...user,
    serviceIds: serviceIds.length > 0 ? serviceIds : undefined,
  };
});
```

### 4. Logs de Debug
```typescript
console.log('📊 [Calendar] Assignations chargées:', allAssignments.length);
console.log('👥 [Calendar] Users avec services mappés:', usersWithServices.filter(u => u.serviceIds && u.serviceIds.length > 0).length, '/', usersWithServices.length);
console.log('🗂️ [Calendar] Groupement par service:', Array.from(grouped.keys()).map(key => `${key} (${grouped.get(key)?.length} users)`));
```

## 🧪 Plan de Test

### Prérequis
- Frontend running : `http://localhost:3001`
- Backend running : `http://localhost:4000`
- User connecté avec rôle Manager/Admin

### Test 1 : Vue Semaine - Groupement par Service

1. **Accéder au Calendar**
   ```
   http://localhost:3001/calendar
   ```

2. **Vérifier Vue Semaine (par défaut)**
   - Sélectionner "Vue : Semaine" (si pas déjà sélectionné)
   - Ouvrir Console Développeur (F12)

3. **Vérifier Logs Console**
   ```
   📊 [Calendar] Assignations chargées: X
   👥 [Calendar] Users avec services mappés: Y / Z
   🗂️ [Calendar] Groupement par service: [...]
   ```

4. **Vérifier Affichage**
   - [ ] Les services s'affichent (ex: "Encadrement", "Service A", "Service B")
   - [ ] Chaque service contient les bons utilisateurs
   - [ ] Les utilisateurs ont bien leurs tâches affichées
   - [ ] Aucun ou peu d'utilisateurs dans "Sans service"

### Test 2 : Vue Mois - Affichage Complet

1. **Basculer sur Vue Mois**
   - Cliquer sur le sélecteur "Mois"

2. **Vérifier Affichage**
   - [ ] Le calendrier mois s'affiche (grille avec tous les jours du mois)
   - [ ] Les services s'affichent (sections dépliables)
   - [ ] Les utilisateurs s'affichent sous chaque service
   - [ ] Les tâches sont visibles sur la timeline de chaque utilisateur
   - [ ] Les congés (bandeaux verts) s'affichent correctement
   - [ ] Le télétravail (indicateurs orange) est visible

### Test 3 : Filtre Services

1. **Tester Filtre Services**
   - Sélectionner "Services" > "Encadrement"
   - [ ] Seuls les users de l'Encadrement s'affichent

2. **Réinitialiser Filtre**
   - Cliquer "Réinitialiser"
   - [ ] Tous les services reviennent

### Test 4 : Vérification Données

1. **Vérifier Console Logs**
   ```
   📊 [Calendar] Assignations chargées: <nombre>
   ```
   - Si = 0 : Problème backend (pas d'assignations en DB)
   - Si > 0 : ✅ OK

2. **Vérifier Groupement**
   ```
   🗂️ [Calendar] Groupement par service: ["encadrement (2 users)", "service-id-1 (3 users)", ...]
   ```
   - Si seul "no-service" apparaît : Problème mapping
   - Si services corrects : ✅ OK

## ✅ Résultats Attendus

### Vue Semaine
```
┌─ Encadrement (2 ressources) ──────────────┐
│  👤 Manager A    [Tâches...]              │
│  👤 Manager B    [Tâches...]              │
└────────────────────────────────────────────┘

┌─ Service Commercial (3 ressources) ───────┐
│  👤 User C       [Tâches...]              │
│  👤 User D       [Tâches...]              │
│  👤 User E       [Tâches...]              │
└────────────────────────────────────────────┘
```

### Vue Mois
```
        1  2  3  4  5  6  7  8  9  10 11 12 ...
┌─ Encadrement ─────────────────────────────┐
│ Manager A  [████─────█████────────────]   │
│ Manager B  [─────████─────█████───────]   │
└────────────────────────────────────────────┘

┌─ Service Commercial ──────────────────────┐
│ User C     [████████─────────────█████]   │
│ User D     [─────████████─────────────]   │
└────────────────────────────────────────────┘
```

## 🐛 Troubleshooting

### Problème : "Assignations chargées: 0"
**Cause** : Pas d'assignations en base de données
**Solution** :
1. Vérifier backend : `GET /api/user-service-assignments`
2. Créer assignations via Settings > Administration > Services

### Problème : "Users avec services mappés: 0 / 10"
**Cause** : Assignations existent mais ne matchent pas les userIds
**Solution** :
1. Vérifier console logs détaillés
2. Vérifier que `assignment.userId` === `user.id`
3. Vérifier que `assignment.isActive === true`

### Problème : Tous les users dans "no-service"
**Cause** : Mapping ne fonctionne pas
**Solution** :
1. Vérifier fallback `user.serviceId` (legacy)
2. Vérifier structure des assignations API

## 📝 Fichiers Modifiés

```
orchestra-app/src/components/calendar/PlanningCalendar.tsx
  - Ligne 80 : Import userServiceAssignmentsApi
  - Ligne 1268-1275 : Chargement allAssignments
  - Ligne 1277-1296 : Mapping serviceIds aux users
  - Ligne 1237 : Log groupement par service
```

## 🎯 Status

- [x] Problème identifié
- [x] Correction appliquée
- [x] Logs debug ajoutés
- [ ] Tests utilisateur (à faire)
- [ ] Validation finale
- [ ] Nettoyage logs debug (après validation)

---

**Date** : 18 octobre 2025
**Ingénieur** : Claude (Session debugging Calendar)
**Impact** : Critique - Feature Calendar inutilisable sans cette correction
