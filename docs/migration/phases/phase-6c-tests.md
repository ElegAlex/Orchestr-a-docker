# Phase 6C - Tests d'Intégration End-to-End

**Date**: 13 octobre 2025
**Statut**: 🧪 EN COURS

## Vue d'ensemble

Plan de tests complet pour valider la migration Firebase → NestJS backend pour les services Users, Projects et Tasks.

## Prérequis

### 1. Backend en Cours d'Exécution

```bash
# Depuis /backend
npm run start:dev

# Vérifier que le backend répond
curl http://localhost:3000/health
# Attendu: {"status":"ok","timestamp":"..."}
```

### 2. Base de Données PostgreSQL

```bash
# Vérifier que PostgreSQL est accessible
cd backend
npx prisma db pull

# Vérifier les données migrées
psql -d orchestr_a -c "SELECT COUNT(*) FROM \"User\";"
psql -d orchestr_a -c "SELECT COUNT(*) FROM \"Project\";"
psql -d orchestr_a -c "SELECT COUNT(*) FROM \"Task\";"
```

### 3. Frontend Compilé

```bash
# Depuis /orchestra-app
npm run build

# Vérifier qu'il n'y a pas d'erreurs TypeScript
npx tsc --noEmit
```

### 4. Token JWT Valide

Pour tester les API calls, vous aurez besoin d'un token JWT. Récupérez-le depuis :
1. Login via le frontend
2. Ouvrir DevTools → Application → Local Storage
3. Copier la valeur de la clé `token`

Ou utilisez le endpoint login :
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"votre_password"}'
```

## Tests Backend (API REST)

### Module Auth

#### 1. Login Email/Password
```bash
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  -s | jq -r '.access_token')

echo "Token: $TOKEN"
```

**Résultat attendu** :
- Status 200
- Retourne un token JWT
- Token non vide

#### 2. Récupérer le Profil
```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq
```

**Résultat attendu** :
- Status 200
- Retourne les infos de l'utilisateur connecté
- `id`, `email`, `firstName`, `lastName`, `role`

### Module Users

#### 1. Lister Tous les Utilisateurs
```bash
curl http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq '.data | length'
```

**Résultat attendu** :
- Status 200
- Retourne un tableau d'utilisateurs
- `data` contient au moins 1 utilisateur

#### 2. Récupérer un Utilisateur par ID
```bash
# Remplacer USER_ID par un ID valide
USER_ID="votre_user_id"
curl http://localhost:3000/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq
```

**Résultat attendu** :
- Status 200
- Retourne l'utilisateur avec l'ID spécifié
- Champs : `id`, `email`, `firstName`, `lastName`, `role`, `departmentId`

#### 3. Créer un Nouvel Utilisateur
```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-integration@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "Integration",
    "role": "employee"
  }' \
  -s | jq
```

**Résultat attendu** :
- Status 201
- Retourne l'utilisateur créé avec un `id`
- `email` = "test-integration@example.com"

#### 4. Mettre à Jour un Utilisateur
```bash
# Utiliser l'ID de l'utilisateur créé ci-dessus
NEW_USER_ID="id_du_user_créé"

curl -X PATCH http://localhost:3000/users/$NEW_USER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "TestModifié"
  }' \
  -s | jq
```

**Résultat attendu** :
- Status 200
- `firstName` = "TestModifié"

#### 5. Supprimer un Utilisateur
```bash
curl -X DELETE http://localhost:3000/users/$NEW_USER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq
```

**Résultat attendu** :
- Status 200
- L'utilisateur est supprimé (soft delete: `isActive` = false)

### Module Projects

#### 1. Lister Tous les Projets
```bash
curl http://localhost:3000/projects \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq '.data | length'
```

**Résultat attendu** :
- Status 200
- Retourne un tableau de projets
- `data` contient au moins 1 projet

#### 2. Récupérer un Projet par ID
```bash
PROJECT_ID="votre_project_id"
curl http://localhost:3000/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq
```

**Résultat attendu** :
- Status 200
- Retourne le projet avec l'ID spécifié
- Champs : `id`, `name`, `description`, `managerId`, `status`, `priority`

#### 3. Créer un Nouveau Projet
```bash
curl -X POST http://localhost:3000/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Projet Test Integration",
    "description": "Projet de test end-to-end",
    "managerId": "'$USER_ID'",
    "status": "ACTIVE",
    "priority": "HIGH",
    "startDate": "2025-10-13T00:00:00.000Z",
    "dueDate": "2025-12-31T00:00:00.000Z",
    "budget": 50000,
    "tags": ["test", "integration"]
  }' \
  -s | jq
```

**Résultat attendu** :
- Status 201
- Retourne le projet créé avec un `id`
- `name` = "Projet Test Integration"

#### 4. Mettre à Jour un Projet
```bash
NEW_PROJECT_ID="id_du_projet_créé"

curl -X PATCH http://localhost:3000/projects/$NEW_PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PROGRESS",
    "priority": "MEDIUM"
  }' \
  -s | jq
```

**Résultat attendu** :
- Status 200
- `status` = "IN_PROGRESS"
- `priority` = "MEDIUM"

#### 5. Ajouter un Membre à l'Équipe
```bash
MEMBER_USER_ID="un_autre_user_id"

curl -X POST http://localhost:3000/projects/$NEW_PROJECT_ID/members \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$MEMBER_USER_ID'",
    "role": "member"
  }' \
  -s | jq
```

**Résultat attendu** :
- Status 201
- Le membre est ajouté au projet

#### 6. Récupérer les Statistiques d'un Projet
```bash
curl http://localhost:3000/projects/$NEW_PROJECT_ID/stats \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq
```

**Résultat attendu** :
- Status 200
- Retourne des stats : `totalTasks`, `completedTasks`, `progress`, etc.

#### 7. Supprimer un Projet
```bash
curl -X DELETE http://localhost:3000/projects/$NEW_PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq
```

**Résultat attendu** :
- Status 200
- Le projet est supprimé

### Module Tasks

#### 1. Lister Toutes les Tâches
```bash
curl http://localhost:3000/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq '.data | length'
```

**Résultat attendu** :
- Status 200
- Retourne un tableau de tâches
- `data` contient au moins 1 tâche

#### 2. Récupérer une Tâche par ID
```bash
TASK_ID="votre_task_id"
curl http://localhost:3000/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq
```

**Résultat attendu** :
- Status 200
- Retourne la tâche avec l'ID spécifié
- Champs : `id`, `title`, `description`, `projectId`, `assigneeId`, `status`

#### 3. Créer une Nouvelle Tâche
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tâche Test Integration",
    "description": "Tâche de test end-to-end",
    "projectId": "'$PROJECT_ID'",
    "assigneeId": "'$USER_ID'",
    "status": "TODO",
    "priority": "HIGH",
    "dueDate": "2025-10-20T00:00:00.000Z",
    "estimatedHours": 8,
    "tags": ["test"]
  }' \
  -s | jq
```

**Résultat attendu** :
- Status 201
- Retourne la tâche créée avec un `id`
- `title` = "Tâche Test Integration"

#### 4. Mettre à Jour une Tâche
```bash
NEW_TASK_ID="id_de_la_tâche_créée"

curl -X PATCH http://localhost:3000/tasks/$NEW_TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PROGRESS",
    "priority": "MEDIUM"
  }' \
  -s | jq
```

**Résultat attendu** :
- Status 200
- `status` = "IN_PROGRESS"
- `priority` = "MEDIUM"

#### 5. Changer le Statut d'une Tâche
```bash
curl -X PATCH http://localhost:3000/tasks/$NEW_TASK_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DONE"
  }' \
  -s | jq
```

**Résultat attendu** :
- Status 200
- `status` = "DONE"
- `completedAt` est défini

#### 6. Assigner une Tâche
```bash
curl -X PATCH http://localhost:3000/tasks/$NEW_TASK_ID/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assigneeId": "'$MEMBER_USER_ID'"
  }' \
  -s | jq
```

**Résultat attendu** :
- Status 200
- `assigneeId` = ID du nouveau assignee

#### 7. Récupérer les Tâches d'un Projet
```bash
curl http://localhost:3000/tasks/project/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq
```

**Résultat attendu** :
- Status 200
- Retourne toutes les tâches du projet

#### 8. Supprimer une Tâche
```bash
curl -X DELETE http://localhost:3000/tasks/$NEW_TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq
```

**Résultat attendu** :
- Status 200
- La tâche est supprimée

## Tests Frontend (Services + UI)

### Démarrage Frontend

```bash
cd orchestra-app
npm start
```

Ouvrir http://localhost:3000

### 1. Test Authentification

#### Login
1. Ouvrir la page de login
2. Entrer email + password
3. Cliquer "Se connecter"

**Résultat attendu** :
- ✅ Redirection vers le dashboard
- ✅ Token JWT stocké dans localStorage
- ✅ Nom de l'utilisateur affiché dans la navbar
- ✅ Pas d'erreur console

#### Profil Utilisateur
1. Cliquer sur l'icône utilisateur
2. Cliquer "Profil"
3. Vérifier les informations affichées

**Résultat attendu** :
- ✅ Email, nom, prénom affichés correctement
- ✅ Rôle affiché
- ✅ Avatar ou initiales

### 2. Test Module Users

#### Lister les Utilisateurs
1. Aller dans "Administration" → "Utilisateurs"
2. Vérifier que la liste s'affiche

**Résultat attendu** :
- ✅ Liste des utilisateurs chargée
- ✅ Pas d'erreur console
- ✅ Champs affichés : nom, email, rôle, département

#### Créer un Utilisateur
1. Cliquer "Nouvel utilisateur"
2. Remplir le formulaire :
   - Email: `test-ui@example.com`
   - Prénom: `TestUI`
   - Nom: `Integration`
   - Rôle: `employee`
3. Cliquer "Créer"

**Résultat attendu** :
- ✅ Utilisateur créé avec succès
- ✅ Toast de confirmation
- ✅ Utilisateur apparaît dans la liste
- ✅ Pas d'erreur console

#### Modifier un Utilisateur
1. Cliquer sur un utilisateur dans la liste
2. Cliquer "Modifier"
3. Changer le prénom
4. Cliquer "Enregistrer"

**Résultat attendu** :
- ✅ Utilisateur mis à jour
- ✅ Toast de confirmation
- ✅ Changement visible dans la liste
- ✅ Pas d'erreur console

#### Désactiver un Utilisateur
1. Cliquer sur un utilisateur
2. Cliquer "Désactiver"
3. Confirmer

**Résultat attendu** :
- ✅ Utilisateur désactivé (`isActive` = false)
- ✅ Toast de confirmation
- ✅ Badge "Inactif" affiché
- ✅ Pas d'erreur console

### 3. Test Module Projects

#### Lister les Projets
1. Aller dans "Projets"
2. Vérifier que la liste s'affiche

**Résultat attendu** :
- ✅ Liste des projets chargée
- ✅ Pas d'erreur console
- ✅ Champs affichés : nom, statut, priorité, progression

#### Créer un Projet
1. Cliquer "Nouveau projet"
2. Remplir le formulaire :
   - Nom: `Projet Test UI`
   - Description: `Test d'intégration frontend`
   - Manager: Sélectionner un utilisateur
   - Statut: `ACTIVE`
   - Priorité: `HIGH`
   - Date début: Aujourd'hui
   - Date fin: +1 mois
   - Budget: `50000`
3. Cliquer "Créer"

**Résultat attendu** :
- ✅ Projet créé avec succès
- ✅ Toast de confirmation
- ✅ Projet apparaît dans la liste
- ✅ Pas d'erreur console

#### Modifier un Projet
1. Cliquer sur un projet dans la liste
2. Cliquer "Modifier"
3. Changer la priorité à `MEDIUM`
4. Cliquer "Enregistrer"

**Résultat attendu** :
- ✅ Projet mis à jour
- ✅ Toast de confirmation
- ✅ Changement visible dans la liste
- ✅ Pas d'erreur console

#### Ajouter un Membre à l'Équipe
1. Ouvrir un projet
2. Aller dans l'onglet "Équipe"
3. Cliquer "Ajouter membre"
4. Sélectionner un utilisateur
5. Choisir le rôle `member`
6. Cliquer "Ajouter"

**Résultat attendu** :
- ✅ Membre ajouté avec succès
- ✅ Toast de confirmation
- ✅ Membre apparaît dans la liste de l'équipe
- ✅ Pas d'erreur console

#### Voir les Statistiques d'un Projet
1. Ouvrir un projet
2. Vérifier les stats affichées

**Résultat attendu** :
- ✅ Nombre de tâches affiché
- ✅ Tâches complétées affichées
- ✅ Progression affichée (%)
- ✅ Pas d'erreur console

### 4. Test Module Tasks

#### Lister les Tâches d'un Projet
1. Ouvrir un projet
2. Aller dans l'onglet "Tâches"
3. Vérifier que la liste s'affiche

**Résultat attendu** :
- ✅ Liste des tâches chargée
- ✅ Pas d'erreur console
- ✅ Champs affichés : titre, assigné, statut, priorité

#### Créer une Tâche
1. Cliquer "Nouvelle tâche"
2. Remplir le formulaire :
   - Titre: `Tâche Test UI`
   - Description: `Test d'intégration frontend`
   - Assigné: Sélectionner un utilisateur
   - Statut: `TODO`
   - Priorité: `HIGH`
   - Date limite: +1 semaine
   - Estimation: `8` heures
3. Cliquer "Créer"

**Résultat attendu** :
- ✅ Tâche créée avec succès
- ✅ Toast de confirmation
- ✅ Tâche apparaît dans la liste
- ✅ Pas d'erreur console

#### Modifier une Tâche
1. Cliquer sur une tâche dans la liste
2. Cliquer "Modifier"
3. Changer le statut à `IN_PROGRESS`
4. Cliquer "Enregistrer"

**Résultat attendu** :
- ✅ Tâche mise à jour
- ✅ Toast de confirmation
- ✅ Changement visible dans la liste
- ✅ Pas d'erreur console

#### Kanban Board
1. Aller dans un projet
2. Afficher le Kanban
3. Vérifier que les colonnes sont affichées

**Résultat attendu** :
- ✅ Colonnes : TODO, IN_PROGRESS, REVIEW, DONE, BLOCKED
- ✅ Tâches dans les bonnes colonnes
- ✅ Drag & drop fonctionne (déplacer une tâche)
- ✅ Pas d'erreur console

#### Assigner une Tâche
1. Cliquer sur une tâche
2. Cliquer "Assigner"
3. Sélectionner un utilisateur
4. Cliquer "Enregistrer"

**Résultat attendu** :
- ✅ Tâche assignée avec succès
- ✅ Toast de confirmation
- ✅ Nom de l'assigné affiché
- ✅ Pas d'erreur console

#### Changer le Statut d'une Tâche
1. Cliquer sur une tâche
2. Changer le statut via le dropdown
3. Confirmer

**Résultat attendu** :
- ✅ Statut mis à jour
- ✅ Toast de confirmation
- ✅ Tâche déplacée dans la bonne colonne (Kanban)
- ✅ Pas d'erreur console

#### Supprimer une Tâche
1. Cliquer sur une tâche
2. Cliquer "Supprimer"
3. Confirmer la suppression

**Résultat attendu** :
- ✅ Tâche supprimée
- ✅ Toast de confirmation
- ✅ Tâche disparaît de la liste
- ✅ Pas d'erreur console

## Tests de Performance

### 1. Temps de Chargement

#### Page Utilisateurs
```bash
# Mesurer avec curl
time curl http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN" \
  -s > /dev/null
```

**Résultat attendu** :
- < 500ms pour 100 utilisateurs
- < 1s pour 1000 utilisateurs

#### Page Projets
```bash
time curl http://localhost:3000/projects \
  -H "Authorization: Bearer $TOKEN" \
  -s > /dev/null
```

**Résultat attendu** :
- < 500ms pour 50 projets
- < 1s pour 500 projets

#### Page Tâches
```bash
time curl http://localhost:3000/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -s > /dev/null
```

**Résultat attendu** :
- < 500ms pour 200 tâches
- < 1s pour 2000 tâches

### 2. Tests de Charge

Utiliser Apache Bench ou Artillery pour tester :

```bash
# Installer Artillery
npm install -g artillery

# Test de charge
artillery quick --count 10 --num 100 http://localhost:3000/users
```

**Résultat attendu** :
- > 95% de requêtes réussies
- Temps de réponse médian < 200ms
- Pas de crash du serveur

## Tests d'Erreurs

### 1. Authentification Invalide

```bash
curl http://localhost:3000/users \
  -H "Authorization: Bearer invalid_token" \
  -s | jq
```

**Résultat attendu** :
- Status 401 Unauthorized
- Message d'erreur clair

### 2. Données Invalides

```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "123"
  }' \
  -s | jq
```

**Résultat attendu** :
- Status 400 Bad Request
- Erreurs de validation détaillées

### 3. Ressource Non Trouvée

```bash
curl http://localhost:3000/users/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq
```

**Résultat attendu** :
- Status 404 Not Found
- Message d'erreur clair

## Checklist de Validation

### Backend API
- [ ] Auth login fonctionne
- [ ] Auth profile fonctionne
- [ ] Users CRUD complet
- [ ] Projects CRUD complet
- [ ] Tasks CRUD complet
- [ ] Gestion des membres d'équipe
- [ ] Statistiques des projets
- [ ] Filtres et recherche
- [ ] Pagination
- [ ] Gestion des erreurs

### Frontend Services
- [ ] user.service.ts sans Firebase
- [ ] project.service.ts sans Firebase
- [ ] task.service.ts sans Firebase
- [ ] Auth avec JWT tokens
- [ ] Pas d'erreurs console
- [ ] Pas de warnings TypeScript

### Frontend UI
- [ ] Login/Logout
- [ ] Liste utilisateurs
- [ ] CRUD utilisateurs
- [ ] Liste projets
- [ ] CRUD projets
- [ ] Liste tâches
- [ ] CRUD tâches
- [ ] Kanban board
- [ ] Gestion équipe projet
- [ ] Statistiques projet
- [ ] Toast notifications
- [ ] Loading states
- [ ] Error handling

### Performance
- [ ] < 500ms chargement listes
- [ ] < 200ms opérations CRUD
- [ ] Pas de memory leaks
- [ ] Scroll fluide

### Sécurité
- [ ] JWT tokens requis
- [ ] Tokens expirés rejetés
- [ ] Validation des inputs
- [ ] CORS configuré
- [ ] Rate limiting

## Rapport de Tests

À remplir après exécution des tests :

```markdown
## Résultats Tests - [Date]

### Backend API
- ✅ Auth: XX/XX tests passés
- ✅ Users: XX/XX tests passés
- ✅ Projects: XX/XX tests passés
- ✅ Tasks: XX/XX tests passés

### Frontend Services
- ✅ user.service.ts: Fonctionnel
- ✅ project.service.ts: Fonctionnel
- ✅ task.service.ts: Fonctionnel

### Frontend UI
- ✅ XX/XX fonctionnalités testées

### Performance
- Temps moyen API: XXXms
- Temps chargement page: XXXms

### Bugs Trouvés
1. [Description bug]
2. [Description bug]

### Actions Requises
- [ ] Fixer bug #1
- [ ] Optimiser performance endpoint X
```

## Conclusion

Une fois tous les tests passés avec succès :
- ✅ Phase 6C terminée
- ➡️ Passer à Phase 6D - Documentation finale

---

**Auteur**: Claude Code
**Date**: 13 octobre 2025
