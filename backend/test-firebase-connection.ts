/**
 * Script de test pour vérifier la connexion Firebase
 * et analyser les données disponibles
 */

import { initializeFirebaseAdmin, getFirestore, getAuth } from './src/migration/config/firebase-admin.config';

async function testFirebaseConnection() {
  console.log('🔍 Test de connexion Firebase...\n');

  try {
    // 1. Initialiser Firebase Admin
    console.log('1️⃣ Initialisation Firebase Admin...');
    initializeFirebaseAdmin();
    console.log('✅ Firebase Admin initialisé\n');

    // 2. Tester Firestore
    console.log('2️⃣ Test de connexion à Firestore...');
    const db = getFirestore();

    // Compter les documents dans chaque collection
    const collections = ['users', 'projects', 'tasks', 'comments', 'documents', 'leaves', 'notifications', 'activities'];

    console.log('📊 Analyse des collections Firestore:\n');

    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).get();
        console.log(`  📁 ${collectionName.padEnd(15)} : ${snapshot.size.toString().padStart(4)} documents`);

        // Afficher un exemple du premier document si disponible
        if (snapshot.size > 0) {
          const firstDoc = snapshot.docs[0];
          console.log(`      → Exemple d'ID: ${firstDoc.id}`);
          const data = firstDoc.data();
          const keys = Object.keys(data).slice(0, 5); // 5 premiers champs
          console.log(`      → Champs: ${keys.join(', ')}${Object.keys(data).length > 5 ? '...' : ''}`);
        }
      } catch (err: any) {
        console.log(`  ⚠️  ${collectionName.padEnd(15)} : Collection inaccessible (${err.message})`);
      }
      console.log('');
    }

    // 3. Tester Firebase Auth
    console.log('\n3️⃣ Test de connexion à Firebase Auth...');
    try {
      const auth = getAuth();
      const listUsersResult = await auth.listUsers(5); // 5 premiers users
      console.log(`✅ Firebase Auth accessible`);
      console.log(`👥 Nombre d'utilisateurs (échantillon): ${listUsersResult.users.length}`);

      if (listUsersResult.users.length > 0) {
        const firstUser = listUsersResult.users[0];
        console.log(`   → Exemple: ${firstUser.email} (${firstUser.uid})`);
      }
    } catch (err: any) {
      console.log(`⚠️  Firebase Auth: ${err.message}`);
    }

    console.log('\n\n✅ Test de connexion terminé avec succès!\n');
    console.log('🎯 Prêt pour la migration. Lancer: npm run migrate:test');

  } catch (error: any) {
    console.error('\n❌ Erreur lors du test de connexion:');
    console.error(`   ${error.message}`);
    console.error('\n📋 Vérifications:');
    console.error('   1. Le fichier service-account-key.json est-il présent dans /backend/?');
    console.error('   2. Le service account a-t-il les permissions nécessaires?');
    console.error('   3. Le projet Firebase est-il actif?\n');
    process.exit(1);
  }

  process.exit(0);
}

// Exécuter le test
testFirebaseConnection();
