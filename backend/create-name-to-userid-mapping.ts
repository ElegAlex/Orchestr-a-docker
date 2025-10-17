/**
 * Créer un mapping Nom → userId pour les projets Firebase
 */

import { initializeFirebaseAdmin, getFirestore } from './src/migration/config/firebase-admin.config';

async function createNameMapping() {
  console.log('🔍 Création du mapping Nom → userId...\n');

  try {
    initializeFirebaseAdmin();
    const db = getFirestore();

    // 1. Récupérer tous les utilisateurs Firestore
    const usersSnapshot = await db.collection('users').get();

    console.log(`👥 ${usersSnapshot.size} utilisateurs trouvés dans Firestore\n`);

    // Créer le mapping displayName → userId
    const nameToUserId = new Map<string, string>();
    const usersList: Array<{id: string, displayName: string, email: string}> = [];

    usersSnapshot.forEach(doc => {
      const user = doc.data();
      const displayName = user.displayName || '';
      const email = user.email || '';

      if (displayName) {
        nameToUserId.set(displayName, doc.id);
        usersList.push({ id: doc.id, displayName, email });
      }
    });

    console.log('📋 Mapping créé:\n');
    usersList.forEach(user => {
      console.log(`   ${user.displayName.padEnd(30)} → ${user.id} (${user.email})`);
    });

    // 2. Récupérer tous les projets
    console.log('\n\n📁 Analyse des projectManagers dans les projets:\n');

    const projectsSnapshot = await db.collection('projects').get();
    const managersFound = new Set<string>();
    const managersNotFound = new Set<string>();

    projectsSnapshot.forEach(doc => {
      const project = doc.data();
      const projectManager = project.projectManager;

      if (projectManager) {
        const userId = nameToUserId.get(projectManager);

        if (userId) {
          managersFound.add(projectManager);
          console.log(`   ✅ ${project.name?.padEnd(40) || '(sans nom)'.padEnd(40)} → Manager: ${projectManager} (ID: ${userId})`);
        } else {
          managersNotFound.add(projectManager);
          console.log(`   ⚠️  ${project.name?.padEnd(40) || '(sans nom)'.padEnd(40)} → Manager: ${projectManager} (❌ NON TROUVÉ)`);
        }
      } else {
        console.log(`   ⚠️  ${project.name?.padEnd(40) || '(sans nom)'.padEnd(40)} → Manager: (MANQUANT)`);
      }
    });

    // 3. Résumé
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RÉSUMÉ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`✅ Managers trouvés dans les utilisateurs:`);
    managersFound.forEach(name => {
      const userId = nameToUserId.get(name)!;
      const user = usersList.find(u => u.id === userId);
      console.log(`   • ${name} → ${user?.email}`);
    });

    if (managersNotFound.size > 0) {
      console.log(`\n⚠️  Managers NON trouvés (besoin d'un mapping manuel):`);
      managersNotFound.forEach(name => {
        console.log(`   • ${name} → BESOIN D'UN COMPTE UTILISATEUR`);
      });
    }

    // 4. Générer le code de mapping pour le script de migration
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 CODE DE MAPPING À AJOUTER AU SCRIPT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('// Mapping displayName → userId');
    console.log('const NAME_TO_USERID: Record<string, string> = {');
    usersList.forEach(user => {
      console.log(`  '${user.displayName}': '${user.id}', // ${user.email}`);
    });
    console.log('};\n');

    console.log('// Fonction de résolution du managerId');
    console.log('function resolveManagerId(projectManager: string | undefined, defaultManagerId: string): string {');
    console.log('  if (!projectManager) return defaultManagerId;');
    console.log('  return NAME_TO_USERID[projectManager] || defaultManagerId;');
    console.log('}\n');

    console.log('\n✅ Analyse terminée!');

  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

createNameMapping();
