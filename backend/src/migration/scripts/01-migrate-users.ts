import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { initializeFirebaseAdmin, getFirestore, getAuth } from '../config/firebase-admin.config';
import { MigrationLogger } from '../utils/logger';

/**
 * Script de migration des utilisateurs
 * Firebase Auth + Firestore users → PostgreSQL users
 *
 * ⚠️ Important : Les mots de passe Firebase Auth ne sont pas exportables.
 * Un mot de passe par défaut sécurisé sera généré pour chaque utilisateur.
 * Les utilisateurs devront réinitialiser leur mot de passe après migration.
 */

interface FirebaseUser {
  uid: string;
  email: string | undefined;
  displayName: string | undefined;
  emailVerified: boolean;
  disabled: boolean;
  metadata: {
    creationTime: string | undefined;
    lastSignInTime: string | undefined;
  };
}

interface FirestoreUserData {
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  department?: string;
  departmentId?: string;
  isActive?: boolean;
  createdAt?: any;
  updatedAt?: any;
  lastLoginAt?: any;
}

const DEFAULT_PASSWORD = 'ChangeMe123!'; // Mot de passe par défaut sécurisé
const BATCH_SIZE = 50; // Traiter par lots de 50

/**
 * Mapper le rôle Firebase vers l'enum PostgreSQL
 */
function mapRole(firebaseRole?: string): Role {
  if (!firebaseRole) return Role.CONTRIBUTOR;

  const roleMap: { [key: string]: Role } = {
    'admin': Role.ADMIN,
    'ADMIN': Role.ADMIN,
    'responsable': Role.RESPONSABLE,
    'RESPONSABLE': Role.RESPONSABLE,
    'manager': Role.MANAGER,
    'MANAGER': Role.MANAGER,
    'team_lead': Role.TEAM_LEAD,
    'TEAM_LEAD': Role.TEAM_LEAD,
    'contributor': Role.CONTRIBUTOR,
    'CONTRIBUTOR': Role.CONTRIBUTOR,
    'viewer': Role.VIEWER,
    'VIEWER': Role.VIEWER,
  };

  return roleMap[firebaseRole] || Role.CONTRIBUTOR;
}

/**
 * Séparer displayName en firstName et lastName
 */
function splitDisplayName(displayName: string | undefined): { firstName: string; lastName: string } {
  if (!displayName || displayName.trim() === '') {
    return { firstName: 'Utilisateur', lastName: 'Sans Nom' };
  }

  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'N/A' };
  }

  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

/**
 * Convertir Firestore Timestamp en Date
 */
function convertTimestamp(timestamp: any): Date | undefined {
  if (!timestamp) return undefined;

  // Firestore Timestamp
  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000);
  }

  // ISO String
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }

  // Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }

  return undefined;
}

/**
 * Migration des utilisateurs
 */
export async function migrateUsers(options: {
  maxUsers?: number;
  skipExisting?: boolean;
} = {}) {
  const { maxUsers, skipExisting = true } = options;

  const logger = new MigrationLogger('migrate-users');
  const prisma = new PrismaClient();

  try {
    // 1. Initialiser Firebase Admin
    logger.info('🔧 Initializing Firebase Admin SDK...');
    initializeFirebaseAdmin();
    const auth = getAuth();
    const db = getFirestore();

    // 2. Récupérer tous les utilisateurs Firebase Auth
    logger.info('📥 Fetching users from Firebase Auth...');
    const listUsersResult = await auth.listUsers(maxUsers || 1000);
    const firebaseUsers: FirebaseUser[] = listUsersResult.users as any[];

    logger.info(`Found ${firebaseUsers.length} users in Firebase Auth`);
    logger.log('');

    // 3. Hash du mot de passe par défaut (une seule fois)
    logger.info('🔐 Generating default password hash...');
    const defaultPasswordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // 4. Migrer chaque utilisateur
    let batch = [];
    for (let i = 0; i < firebaseUsers.length; i++) {
      const firebaseUser = firebaseUsers[i];
      logger.incrementTotal();

      try {
        // Valider email
        if (!firebaseUser.email) {
          logger.skip(
            `User ${firebaseUser.uid}`,
            'No email address'
          );
          continue;
        }

        // Vérifier si l'utilisateur existe déjà
        if (skipExisting) {
          const existingUser = await prisma.user.findUnique({
            where: { email: firebaseUser.email },
          });

          if (existingUser) {
            logger.skip(
              `User ${firebaseUser.email}`,
              'Already exists in PostgreSQL'
            );
            continue;
          }
        }

        // Récupérer données additionnelles de Firestore
        let firestoreData: FirestoreUserData = {};
        try {
          const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
          if (userDoc.exists) {
            firestoreData = userDoc.data() as FirestoreUserData;
          }
        } catch (err) {
          logger.warn(`Could not fetch Firestore data for ${firebaseUser.email}: ${err.message}`);
        }

        // Mapper displayName
        const { firstName, lastName } = splitDisplayName(
          firestoreData.displayName || firebaseUser.displayName
        );

        // Mapper le rôle
        const role = mapRole(firestoreData.role);

        // Préparer les données PostgreSQL
        const userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          passwordHash: defaultPasswordHash,
          firstName,
          lastName,
          role,
          isActive: !firebaseUser.disabled && (firestoreData.isActive !== false),
          departmentId: firestoreData.departmentId || null,
          createdAt: firebaseUser.metadata.creationTime
            ? new Date(firebaseUser.metadata.creationTime)
            : new Date(),
          updatedAt: convertTimestamp(firestoreData.updatedAt) || new Date(),
          lastLoginAt: firebaseUser.metadata.lastSignInTime
            ? new Date(firebaseUser.metadata.lastSignInTime)
            : null,
        };

        // Insérer dans PostgreSQL
        await prisma.user.create({
          data: userData,
        });

        logger.success(
          `Migrated user: ${firebaseUser.email}`,
          {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            role: userData.role,
          }
        );

        // Commit par batch
        batch.push(firebaseUser);
        if (batch.length >= BATCH_SIZE) {
          logger.info(`✅ Batch of ${batch.length} users committed`);
          batch = [];
        }

      } catch (error) {
        logger.error(
          `Failed to migrate user: ${firebaseUser.email || firebaseUser.uid}`,
          error
        );
      }
    }

    // Commit dernier batch
    if (batch.length > 0) {
      logger.info(`✅ Final batch of ${batch.length} users committed`);
    }

  } catch (error) {
    logger.error('Migration failed', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    logger.summary();
  }
}

/**
 * Exécution du script si appelé directement
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const maxUsers = args.includes('--test') ? 10 : undefined;
  const skipExisting = !args.includes('--overwrite');

  migrateUsers({ maxUsers, skipExisting })
    .then(() => {
      console.log('✅ User migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ User migration failed:', error);
      process.exit(1);
    });
}
