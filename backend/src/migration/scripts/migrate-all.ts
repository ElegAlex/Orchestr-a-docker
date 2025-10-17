import { migrateUsers } from './01-migrate-users';
import { migrateProjects } from './02-migrate-projects';
import { migrateTasks } from './03-migrate-tasks';
import { migrateDocuments } from './04-migrate-documents';
import { closeFirebaseAdmin } from '../config/firebase-admin.config';

/**
 * Script d'orchestration de la migration complète
 * Firebase (Firestore + Storage) → PostgreSQL + MinIO
 *
 * Ordre d'exécution (important pour les foreign keys) :
 * 1. Users (pas de dépendances)
 * 2. Projects (dépend de Users pour managerId)
 * 3. Tasks (dépend de Projects et Users)
 * 4. Documents (dépend de Users, Projects, Tasks)
 */

interface MigrationOptions {
  test?: boolean;         // Mode test (limité à quelques enregistrements)
  skipExisting?: boolean; // Skip les enregistrements existants
  skipUsers?: boolean;    // Skip la migration users
  skipProjects?: boolean; // Skip la migration projects
  skipTasks?: boolean;    // Skip la migration tasks
  skipDocuments?: boolean; // Skip la migration documents
}

interface MigrationResult {
  step: string;
  duration: number;
  success: boolean;
  error?: string;
}

/**
 * Migration complète avec gestion d'erreurs
 */
export async function migrateAll(options: MigrationOptions = {}): Promise<void> {
  const {
    test = false,
    skipExisting = true,
    skipUsers = false,
    skipProjects = false,
    skipTasks = false,
    skipDocuments = false,
  } = options;

  const results: MigrationResult[] = [];
  const startTime = Date.now();

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 MIGRATION ORCHESTR\'A - Firebase → PostgreSQL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`Mode: ${test ? '🧪 TEST (limited records)' : '🔥 PRODUCTION (all records)'}`);
  console.log(`Skip existing: ${skipExisting ? '✅ Yes' : '❌ No (will overwrite)'}`);
  console.log('');

  // Confirmation pour production
  if (!test && !process.env.MIGRATION_CONFIRMED) {
    console.log('⚠️  WARNING: This will migrate ALL data from Firebase to PostgreSQL!');
    console.log('');
    console.log('To confirm, set environment variable:');
    console.log('  export MIGRATION_CONFIRMED=true');
    console.log('');
    console.log('Or run in test mode:');
    console.log('  npm run migrate:test');
    console.log('');
    process.exit(1);
  }

  const maxLimits = test
    ? { users: 10, projects: 5, tasks: 10, documents: 5 }
    : { users: undefined, projects: undefined, tasks: undefined, documents: undefined };

  // ========================================
  // ÉTAPE 1: Migration des utilisateurs
  // ========================================
  if (!skipUsers) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 STEP 1/4: Migrating Users');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    const stepStart = Date.now();
    try {
      await migrateUsers({
        maxUsers: maxLimits.users,
        skipExisting,
      });

      results.push({
        step: 'Users',
        duration: Date.now() - stepStart,
        success: true,
      });

      console.log('');
      console.log('✅ Users migration completed successfully');
    } catch (error) {
      results.push({
        step: 'Users',
        duration: Date.now() - stepStart,
        success: false,
        error: error.message,
      });

      console.error('❌ Users migration failed:', error.message);
      console.log('');
      console.log('⚠️  Stopping migration. Fix errors and retry.');
      await closeFirebaseAdmin();
      process.exit(1);
    }
  } else {
    console.log('⏭️  Skipping users migration (as requested)');
  }

  // ========================================
  // ÉTAPE 2: Migration des projets
  // ========================================
  if (!skipProjects) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 STEP 2/4: Migrating Projects');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    const stepStart = Date.now();
    try {
      await migrateProjects({
        maxProjects: maxLimits.projects,
        skipExisting,
      });

      results.push({
        step: 'Projects',
        duration: Date.now() - stepStart,
        success: true,
      });

      console.log('');
      console.log('✅ Projects migration completed successfully');
    } catch (error) {
      results.push({
        step: 'Projects',
        duration: Date.now() - stepStart,
        success: false,
        error: error.message,
      });

      console.error('❌ Projects migration failed:', error.message);
      console.log('');
      console.log('⚠️  Stopping migration. Fix errors and retry.');
      await closeFirebaseAdmin();
      process.exit(1);
    }
  } else {
    console.log('⏭️  Skipping projects migration (as requested)');
  }

  // ========================================
  // ÉTAPE 3: Migration des tâches
  // ========================================
  if (!skipTasks) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 STEP 3/4: Migrating Tasks');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    const stepStart = Date.now();
    try {
      await migrateTasks({
        maxTasks: maxLimits.tasks,
        skipExisting,
      });

      results.push({
        step: 'Tasks',
        duration: Date.now() - stepStart,
        success: true,
      });

      console.log('');
      console.log('✅ Tasks migration completed successfully');
    } catch (error) {
      results.push({
        step: 'Tasks',
        duration: Date.now() - stepStart,
        success: false,
        error: error.message,
      });

      console.error('❌ Tasks migration failed:', error.message);
      console.log('');
      console.log('⚠️  Stopping migration. Fix errors and retry.');
      await closeFirebaseAdmin();
      process.exit(1);
    }
  } else {
    console.log('⏭️  Skipping tasks migration (as requested)');
  }

  // ========================================
  // ÉTAPE 4: Migration des documents
  // ========================================
  if (!skipDocuments) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 STEP 4/4: Migrating Documents');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    const stepStart = Date.now();
    try {
      await migrateDocuments({
        maxDocuments: maxLimits.documents,
        skipExisting,
      });

      results.push({
        step: 'Documents',
        duration: Date.now() - stepStart,
        success: true,
      });

      console.log('');
      console.log('✅ Documents migration completed successfully');
    } catch (error) {
      results.push({
        step: 'Documents',
        duration: Date.now() - stepStart,
        success: false,
        error: error.message,
      });

      console.error('❌ Documents migration failed:', error.message);
      console.log('');
      console.log('⚠️  Migration completed with errors. Check logs.');
    }
  } else {
    console.log('⏭️  Skipping documents migration (as requested)');
  }

  // ========================================
  // RÉSUMÉ FINAL
  // ========================================
  const totalDuration = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 MIGRATION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const durationSec = (result.duration / 1000).toFixed(2);
    console.log(`${icon} ${result.step.padEnd(15)} ${durationSec}s`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('');
  console.log(`Total steps:    ${results.length}`);
  console.log(`✅ Success:     ${successCount}`);
  console.log(`❌ Errors:      ${errorCount}`);
  console.log(`⏱️  Total time:  ${(totalDuration / 1000).toFixed(2)}s`);
  console.log('');

  if (errorCount === 0) {
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Verify data integrity: npm run migrate:validate');
    console.log('  2. Check migration logs in: /backend/migration-logs/');
    console.log('  3. Test the API endpoints');
  } else {
    console.log('⚠️  Migration completed with errors!');
    console.log('');
    console.log('Check logs in: /backend/migration-logs/');
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Fermer Firebase Admin
  await closeFirebaseAdmin();

  // Exit avec le code approprié
  process.exit(errorCount > 0 ? 1 : 0);
}

/**
 * Exécution du script si appelé directement
 */
if (require.main === module) {
  const args = process.argv.slice(2);

  const options: MigrationOptions = {
    test: args.includes('--test'),
    skipExisting: !args.includes('--overwrite'),
    skipUsers: args.includes('--skip-users'),
    skipProjects: args.includes('--skip-projects'),
    skipTasks: args.includes('--skip-tasks'),
    skipDocuments: args.includes('--skip-documents'),
  };

  migrateAll(options).catch((error) => {
    console.error('');
    console.error('❌ Migration failed with unexpected error:');
    console.error(error);
    console.error('');
    process.exit(1);
  });
}
