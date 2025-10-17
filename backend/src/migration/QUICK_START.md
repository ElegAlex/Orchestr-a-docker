# 🚀 Quick Start - Migration Firebase

## Configuration Rapide (5 minutes)

### 1. Obtenir la clé de service Firebase

```bash
# 1. Aller sur Firebase Console: https://console.firebase.google.com
# 2. Sélectionner votre projet (orchestr-a-3b48e)
# 3. Project Settings (⚙️) → Service Accounts
# 4. Generate New Private Key → Download JSON
# 5. Renommer le fichier en "service-account-key.json"
# 6. Le placer dans /backend/service-account-key.json
```

### 2. Installer les dépendances

```bash
cd backend
npm install firebase-admin
```

### 3. Test de connexion Firebase

```bash
# Créer un petit script de test
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log('✅ Firebase Admin initialisé avec succès!');
console.log('📁 Projet:', serviceAccount.project_id);

const db = admin.firestore();
db.collection('users').limit(1).get()
  .then(snap => {
    console.log('✅ Firestore accessible!');
    console.log('👥 Nombre d\'utilisateurs (échantillon):', snap.size);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  });
"
```

## 📝 Structure des Scripts

La migration est divisée en modules indépendants :

```
scripts/
├── 01-migrate-users.ts      # Users: Firebase Auth + Firestore → PostgreSQL
├── 02-migrate-projects.ts   # Projects: Firestore → PostgreSQL
├── 03-migrate-tasks.ts      # Tasks: Firestore → PostgreSQL
├── 04-migrate-documents.ts  # Documents: Storage → MinIO
└── migrate-all.ts           # Orchestration complète
```

## 🎯 Migration Par Étapes

### Option A: Migration Manuelle (Recommandé pour commencer)

```typescript
// backend/test-migration.ts

import { initializeFirebaseAdmin, getFirestore } from './src/migration/config/firebase-admin.config';
import { PrismaClient } from '@prisma/client';

async function testMigration() {
  // 1. Init Firebase
  initializeFirebaseAdmin();
  const db = getFirestore();

  // 2. Init Prisma
  const prisma = new PrismaClient();

  // 3. Lire 5 utilisateurs de Firestore
  const usersSnapshot = await db.collection('users').limit(5).get();

  console.log(`Found ${usersSnapshot.size} users in Firestore`);

  for (const doc of usersSnapshot.docs) {
    const firebaseUser = doc.data();
    console.log('User:', firebaseUser.email);

    // TODO: Mapper et insérer dans PostgreSQL
  }

  await prisma.$disconnect();
}

testMigration().catch(console.error);
```

### Option B: Utiliser les Scripts Fournis

```bash
# Test avec 10 enregistrements max
npm run migrate:test

# Migration complète
npm run migrate:all
```

## 🔍 Vérification des Données

Avant de migrer, analyser la structure Firebase :

```typescript
// backend/analyze-firebase.ts

import { initializeFirebaseAdmin, getFirestore } from './src/migration/config/firebase-admin.config';

async function analyzefirebase() {
  initializeFirebaseAdmin();
  const db = getFirestore();

  // Compter les documents dans chaque collection
  const collections = ['users', 'projects', 'tasks', 'comments', 'documents'];

  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).count().get();
    console.log(`${collectionName}: ${snapshot.data().count} documents`);
  }

  // Afficher un exemple de chaque collection
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).limit(1).get();
    if (snapshot.size > 0) {
      console.log(`\n📄 Example ${collectionName}:`);
      console.log(JSON.stringify(snapshot.docs[0].data(), null, 2));
    }
  }
}

analyzeFirebase().catch(console.error);
```

## ⚠️ Points d'Attention

### 1. Backup Firebase

```bash
# Export Firestore complet
firebase firestore:delete --all-collections --project orchestr-a-3b48e

# Ou via gcloud
gcloud firestore export gs://orchestr-a-3b48e-backup/backup-$(date +%Y%m%d)
```

### 2. Base PostgreSQL Propre

```bash
# Reset complet de la base
cd backend
npx prisma migrate reset --force

# Réappliquer les migrations
npx prisma migrate deploy
```

### 3. MinIO Prêt

```bash
# Vérifier MinIO
podman ps | grep minio

# Tester l'accès
curl http://localhost:9000/minio/health/live
```

## 🧪 Test de Migration (Sans Impact)

Script de test qui lit Firebase SANS écrire dans PostgreSQL :

```typescript
// backend/dry-run-migration.ts

import { initializeFirebaseAdmin, getFirestore } from './src/migration/config/firebase-admin.config';

async function dryRun() {
  initializeFirebaseAdmin();
  const db = getFirestore();

  console.log('🔍 DRY RUN - Lecture seule\n');

  // Users
  const users = await db.collection('users').get();
  console.log(`👥 Users: ${users.size}`);

  // Projects
  const projects = await db.collection('projects').get();
  console.log(`📁 Projects: ${projects.size}`);

  // Tasks
  const tasks = await db.collection('tasks').get();
  console.log(`✅ Tasks: ${tasks.size}`);

  // Comments
  const comments = await db.collection('comments').get();
  console.log(`💬 Comments: ${comments.size}`);

  // Documents
  const documents = await db.collection('documents').get();
  console.log(`📄 Documents: ${documents.size}`);

  console.log('\n✅ Dry run completed - No data was migrated');
}

dryRun().catch(console.error);
```

Exécuter :
```bash
npx ts-node backend/dry-run-migration.ts
```

## 📊 Estimation du Temps

Basé sur des tests :

| Volume | Temps Estimé | Recommandation |
|--------|--------------|----------------|
| < 100 records | 1-2 min | Migration directe OK |
| 100-1000 | 5-15 min | Migration par batch recommandée |
| 1000-10000 | 30-60 min | Migration par batch + monitoring |
| > 10000 | 1-3 heures | Migration progressive sur plusieurs jours |

## 🆘 En Cas de Problème

### Erreur: "Service account key not found"

Le fichier n'est pas au bon endroit.

```bash
# Vérifier l'emplacement
ls -la backend/service-account-key.json

# Si absent, télécharger depuis Firebase Console
```

### Erreur: "Permission denied" sur Firestore

Le service account n'a pas les droits.

```bash
# Dans Firebase Console:
# IAM & Admin → Add Member
# Email: {votre-service-account}@{project-id}.iam.gserviceaccount.com
# Role: Cloud Datastore User
```

### Erreur: Duplicate key en PostgreSQL

Des données existent déjà.

```bash
# Option 1: Reset complet
npx prisma migrate reset --force

# Option 2: Skip les duplicates
npm run migrate:all -- --skip-existing
```

---

**🎯 Prêt à migrer ?**

1. ✅ Service account key téléchargé et placé
2. ✅ `npm install firebase-admin` exécuté
3. ✅ Test de connexion Firebase réussi
4. ✅ PostgreSQL vide et prêt
5. ✅ Backup Firebase effectué

→ Lancer : `npm run migrate:test` pour tester sur 10 records !
