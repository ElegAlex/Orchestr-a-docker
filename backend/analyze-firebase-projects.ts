/**
 * Script d'analyse de la structure des projets Firebase
 * Pour comprendre comment sont stockés sponsor et chef de projet
 */

import { initializeFirebaseAdmin, getFirestore } from './src/migration/config/firebase-admin.config';

async function analyzeFirebaseProjects() {
  console.log('🔍 Analyse de la structure des projets Firebase...\n');

  try {
    // Initialiser Firebase Admin
    initializeFirebaseAdmin();
    const db = getFirestore();

    // Récupérer tous les projets
    const projectsSnapshot = await db.collection('projects').get();

    console.log(`📁 Nombre de projets trouvés: ${projectsSnapshot.size}\n`);

    // Analyser chaque projet
    let index = 0;
    projectsSnapshot.forEach((doc) => {
      index++;
      const project = doc.data();

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📄 Projet ${index}/${projectsSnapshot.size}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`ID: ${doc.id}`);
      console.log(`Nom: ${project.name || 'N/A'}`);
      console.log(`\n🔑 Champs disponibles:`);

      // Lister TOUS les champs du projet
      const allKeys = Object.keys(project).sort();
      allKeys.forEach(key => {
        const value = project[key];
        const type = typeof value;

        // Afficher la valeur de manière lisible
        let displayValue = value;
        if (type === 'object' && value !== null) {
          if (value.toDate) {
            displayValue = `Date(${value.toDate().toISOString()})`;
          } else if (Array.isArray(value)) {
            displayValue = `Array[${value.length}]`;
          } else {
            displayValue = `Object{${Object.keys(value).join(', ')}}`;
          }
        } else if (type === 'string' && value.length > 50) {
          displayValue = value.substring(0, 50) + '...';
        }

        console.log(`  • ${key.padEnd(25)}: ${displayValue} (${type})`);
      });

      // Chercher spécifiquement les champs liés au management
      console.log(`\n👥 Champs liés au management:`);
      const managementFields = allKeys.filter(key =>
        key.toLowerCase().includes('manager') ||
        key.toLowerCase().includes('sponsor') ||
        key.toLowerCase().includes('chef') ||
        key.toLowerCase().includes('responsable') ||
        key.toLowerCase().includes('lead') ||
        key.toLowerCase().includes('owner')
      );

      if (managementFields.length > 0) {
        managementFields.forEach(key => {
          console.log(`  ✅ ${key}: ${project[key]}`);
        });
      } else {
        console.log(`  ⚠️  Aucun champ de management trouvé`);
      }

      // Chercher les membres/team
      console.log(`\n👥 Champs liés aux membres:`);
      const teamFields = allKeys.filter(key =>
        key.toLowerCase().includes('member') ||
        key.toLowerCase().includes('team') ||
        key.toLowerCase().includes('equipe') ||
        key.toLowerCase().includes('collaborat')
      );

      if (teamFields.length > 0) {
        teamFields.forEach(key => {
          const value = project[key];
          if (Array.isArray(value)) {
            console.log(`  ✅ ${key}: [${value.length} membres]`);
            value.slice(0, 3).forEach((member: any) => {
              console.log(`     - ${JSON.stringify(member)}`);
            });
            if (value.length > 3) {
              console.log(`     ... et ${value.length - 3} autres`);
            }
          } else {
            console.log(`  ✅ ${key}: ${value}`);
          }
        });
      } else {
        console.log(`  ⚠️  Aucun champ de membres trouvé`);
      }
    });

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RÉSUMÉ DE L\'ANALYSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Collecter tous les champs uniques
    const allFields = new Set<string>();
    projectsSnapshot.forEach(doc => {
      Object.keys(doc.data()).forEach(key => allFields.add(key));
    });

    console.log(`📋 Tous les champs trouvés dans les projets (${allFields.size} au total):\n`);
    Array.from(allFields).sort().forEach(field => {
      console.log(`   • ${field}`);
    });

    console.log('\n✅ Analyse terminée!\n');

  } catch (error: any) {
    console.error('\n❌ Erreur lors de l\'analyse:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }

  process.exit(0);
}

// Exécuter l'analyse
analyzeFirebaseProjects();
