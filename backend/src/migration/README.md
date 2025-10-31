# 🔄 Migration Firebase → PostgreSQL

Ce répertoire contient tous les scripts nécessaires pour migrer les données de Firebase (Firestore + Firebase Storage) vers le nouveau backend PostgreSQL + MinIO.

## 📁 Structure

```
migration/
├── README.md                    # Ce fichier
├── config/
│   └── firebase-admin.ts        # Configuration Firebase Admin SDK
├── scripts/
│   ├── 01-migrate-users.ts      # Migration des utilisateurs
│   ├── 02-migrate-projects.ts   # Migration des projets
│   ├── 03-migrate-tasks.ts      # Migration des tâches
│   ├── 04-migrate-documents.ts  # Migration des documents (Storage → MinIO)
│   ├── 05-migrate-comments.ts   # Migration des commentaires
│   └── migrate-all.ts           # Script principal de migration complète
├── types/
│   └── firebase-types.ts        # Types TypeScript pour les données Firebase
└── utils/
    ├── logger.ts                # Système de logging pour la migration
    ├── validator.ts             # Validation de l'intégrité des données
    └── mapper.ts                # Mapping Firebase → PostgreSQL
```

## 🚀 Utilisation

### Prérequis

1. **Service Account Firebase**
   - Télécharger la clé de service depuis Firebase Console
   - Placer le fichier dans `/backend/service-account-key.json`
   - ⚠️ Ne JAMAIS commit ce fichier !

2. **Base de données PostgreSQL**
   - Backend NestJS lancé
   - Prisma migrations appliquées
   - Base de données vide et prête

3. **MinIO configuré**
   - Bucket `orchestr-a-documents` créé
   - Credentials configurées dans `.env`

### Étapes de Migration

#### 1. Migration de Test (Recommandé)

Tester sur un sous-ensemble de données :

```bash
cd backend
npm run migrate:test
```

Cette commande :
- Migre 10 utilisateurs maximum
- Migre 5 projets maximum
- Valide l'intégrité
- Génère un rapport

#### 2. Migration Complète

⚠️ **ATTENTION** : Cette opération est irréversible !

```bash
cd backend
npm run migrate:all
```

Cette commande :
- Migre TOUTES les données Firebase
- Peut prendre plusieurs heures selon le volume
- Génère un rapport détaillé

#### 3. Validation Post-Migration

```bash
npm run migrate:validate
```

Vérifie :
- Nombre d'enregistrements (Firebase vs PostgreSQL)
- Intégrité des relations
- Documents uploadés dans MinIO

## 📊 Collections Firestore

### Structure actuelle Firebase

```
Firestore:
├── users/                       # Utilisateurs
│   ├── {userId}/
│   │   ├── email
│   │   ├── displayName
│   │   ├── role
│   │   ├── department
│   │   └── ...
│
├── projects/                    # Projets
│   ├── {projectId}/
│   │   ├── name
│   │   ├── description
│   │   ├── status
│   │   ├── managerId
│   │   ├── budget
│   │   └── ...
│
├── tasks/                       # Tâches
│   ├── {taskId}/
│   │   ├── title
│   │   ├── description
│   │   ├── projectId
│   │   ├── assigneeId
│   │   ├── status
│   │   └── ...
│
├── comments/                    # Commentaires
│   ├── {commentId}/
│   │   ├── taskId
│   │   ├── userId
│   │   ├── content
│   │   ├── createdAt
│   │   └── ...
│
└── documents/                   # Métadonnées des documents
    ├── {documentId}/
    │   ├── name
    │   ├── projectId
    │   ├── taskId
    │   ├── uploadedBy
    │   ├── storageRef         # Référence Firebase Storage
    │   └── ...

Firebase Storage:
└── documents/                   # Fichiers réels
    ├── {path}/{filename}
    └── ...
```

## 🔀 Mapping Firebase → PostgreSQL

### Utilisateurs

```typescript
Firebase (Auth + Firestore)  →  PostgreSQL (users)
─────────────────────────────────────────────────
uid                          →  id
email                        →  email
displayName                  →  firstName + lastName (split)
photoURL                     →  avatar
emailVerified               →  emailVerified
role                        →  role (enum)
department                  →  departmentId (FK)
createdTime                 →  createdAt
```

### Projets

```typescript
Firebase (Firestore)         →  PostgreSQL (projects)
─────────────────────────────────────────────────
id                          →  id
name                        →  name
description                 →  description
status                      →  status (enum)
managerId                   →  managerId (FK → users)
budget                      →  budget
startDate                   →  startDate
dueDate                     →  dueDate
tags                        →  tags (JSON)
createdAt                   →  createdAt
```

### Tâches

```typescript
Firebase (Firestore)         →  PostgreSQL (tasks)
─────────────────────────────────────────────────
id                          →  id
title                       →  title
description                 →  description
projectId                   →  projectId (FK → projects)
assigneeId                  →  assigneeId (FK → users)
status                      →  status (enum)
priority                    →  priority (enum)
dueDate                     →  dueDate
estimatedHours              →  estimatedHours
tags                        →  tags (JSON)
createdAt                   →  createdAt
```

### Documents

```typescript
Firebase (Storage + Firestore) → PostgreSQL (documents) + MinIO
──────────────────────────────────────────────────────────────
id                          →  id
name                        →  name
fileType                    →  fileType
size                        →  size
projectId                   →  projectId (FK → projects)
taskId                      →  taskId (FK → tasks)
uploadedBy                  →  uploadedBy (FK → users)
storageRef (Firebase)       →  objectName (MinIO)
FILE DATA (Storage)         →  FILE DATA (MinIO bucket)
tags                        →  tags (JSON)
createdAt                   →  createdAt
```

## 📝 Logs de Migration

Les logs sont sauvegardés dans :
```
/backend/migration-logs/
├── migration-{timestamp}.log        # Log général
├── users-{timestamp}.log            # Log utilisateurs
├── projects-{timestamp}.log         # Log projets
├── tasks-{timestamp}.log            # Log tâches
├── documents-{timestamp}.log        # Log documents
└── validation-{timestamp}.log       # Log validation
```

## 🔍 Résolution de Problèmes

### Erreur: "Service account key not found"

**Solution :**
```bash
# Télécharger la clé depuis Firebase Console :
# Project Settings → Service Accounts → Generate New Private Key
# Sauvegarder dans /backend/service-account-key.json
```

### Erreur: "Duplicate key violation"

**Cause :** Tentative de re-migrer des données déjà migrées.

**Solution :**
```bash
# Option 1: Nettoyer PostgreSQL
npm run db:reset

# Option 2: Continuer la migration (skip duplicates)
npm run migrate:all -- --skip-existing
```

### Erreur: "MinIO connection failed"

**Solution :**
```bash
# Vérifier que MinIO est actif
podman ps | grep minio

# Redémarrer MinIO si nécessaire
podman start orchestr-a-minio-dev

# Vérifier les credentials dans .env
cat backend/.env | grep MINIO
```

## ⚠️ Avertissements

1. **Backup Firebase :** Faire un export Firestore complet avant migration
2. **Tests :** TOUJOURS tester sur données de test d'abord
3. **Temps :** La migration peut prendre plusieurs heures (volume dépendant)
4. **Réseau :** Connexion stable requise (Firebase + PostgreSQL + MinIO)
5. **Rollback :** Aucun rollback automatique - prévoir backup PostgreSQL

## 📞 Support

En cas de problème, consulter :
- `/backend/migration-logs/` pour les logs détaillés
- `STATUS.md` pour l'état du projet
- Firebase Console pour vérifier les données source

---

**Dernière mise à jour :** 2025-10-12
**Version :** 1.0.0
**Phase :** 3 - Migration
