import { PrismaClient, ProjectStatus, Priority } from '@prisma/client';
import { initializeFirebaseAdmin, getFirestore } from '../config/firebase-admin.config';
import { MigrationLogger } from '../utils/logger';

/**
 * Script de migration des projets
 * Firestore projects → PostgreSQL projects + project_members
 */

interface FirestoreProject {
  id?: string;
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  budget?: number;
  startDate?: any;
  dueDate?: any;
  managerId?: string; // Legacy - probablement pas utilisé
  projectManager?: string; // Nom du chef de projet (ex: "Alexandre BERGE")
  sponsor?: string; // Nom du sponsor
  tags?: string[];
  metadata?: any;
  members?: any[]; // Peut être un array ou une sous-collection
  teamMembers?: any[]; // Array de membres avec userId
  createdAt?: any;
  updatedAt?: any;
}

const BATCH_SIZE = 50;

/**
 * Mapping displayName → userId (généré depuis Firebase)
 * Pour résoudre les noms de projectManager vers des userIds
 */
const NAME_TO_USERID: Record<string, string> = {
  'Mallorie Courteaux': '6IINk1f8qdQ5e6MqkTmkXynaOOg2',
  'Aurélien Frycz': 'BF77pdYNAkSYRzpGiKbhJsIBNCI3',
  'Bertrand Laruelle': 'BWRFmjfNcCNTkSfHyiHnzKDg14D2',
  'Olivier Atangana': 'CJq34AnfMXMuxlk85sIaJP8UHN82',
  'Gérard Petit': 'EfcS7tvoQjVFkDJDrfIgi1D6V123',
  'Alexandre BERGE': 'GhH3JGV0ZCbXLyOfKwI8iGkkkL33',
  'Filipe Granja': 'H3MFxI6LInQBXA00akzRlofcVSu1',
  'Seyba Dembele': 'ISBsQ1uSQTYiGixgzwlVds4xvTr2',
  'Chamsia Imani': 'LVZMNABdZkcEcrTwkM1Y5POSLg32',
  'Alexandre Lefebvre': 'P36ASxXmLlU0HRz8lrqOz8eeNG83',
  'Delphine Simon': 'PB5baRF63PYcfcxE4Q1xtdHAIEs2',
  'observateur observateur': 'YrE4CqSBFIeT3wec7iuuUbiKY9k2',
  'Nicolas Poggi-Casanova': 'cSQqljCVVjdb7b4GeYcfaGpAVaz2',
  'Amira Mejri': 'fGFSsYDbdedQmL9vhYSvBcoV5TB2',
  'Valérie Ducros': 'gnTnosBa6IQb044MThJBwcg31RK2',
  'Eleg Alex': 'jBITfcu0bFNKqJDduXYDl6RfrOw1',
  'Lahbib Chahlal': 'jOtgkbDdFfYdY4ytb0rAg3PKASW2',
  'Jérome Defendini': 'k24kV5kfMgfMxGOuDi2Bxv00wmA3',
  'Admin admin': 'mX9ycCV1mta4g6DQ2D7KjsjejAe2',
  'Vincent Guillin': 'mrdKm9IXhAR7YkQ08fkj2ZiTz9a2',
  'David Alfandari': 'n3lQJ4Xj85UkVuBCO4ZI0J7DJkN2',
  'Rayan Nissoum': 'oXGs0187yXZShH8pP9qrFfvlkVH2',
  'Nassim Karroum': 'ovsJdHSXvcc8zCPfiBAn2i3Mfoj2',
  'Karim Petruszka': 'qvzoTH0WsOh2CgqZ0Ab2SRK2lhx2',
  'Momar Mbengue': 'sAcZ1atJoDS3F4mquYEduaITz9s2',
  'Sophie Palis': 'vRAHpou4XaPJqbvVF1WA7BLLHsq1',
};

/**
 * Résoudre le nom du projectManager vers un userId
 * Recherche insensible à la casse
 */
function resolveManagerId(projectManager: string | undefined, defaultManagerId: string): string {
  if (!projectManager) return defaultManagerId;

  // Recherche exacte d'abord
  if (NAME_TO_USERID[projectManager]) {
    return NAME_TO_USERID[projectManager];
  }

  // Recherche insensible à la casse
  const projectManagerLower = projectManager.toLowerCase();
  for (const [name, userId] of Object.entries(NAME_TO_USERID)) {
    if (name.toLowerCase() === projectManagerLower) {
      return userId;
    }
  }

  // Pas trouvé, utiliser le manager par défaut
  return defaultManagerId;
}

/**
 * Mapper le statut Firestore vers l'enum PostgreSQL
 */
function mapProjectStatus(status?: string): ProjectStatus {
  if (!status) return ProjectStatus.DRAFT;

  const statusMap: { [key: string]: ProjectStatus } = {
    'draft': ProjectStatus.DRAFT,
    'DRAFT': ProjectStatus.DRAFT,
    'active': ProjectStatus.ACTIVE,
    'ACTIVE': ProjectStatus.ACTIVE,
    'in_progress': ProjectStatus.ACTIVE,
    'IN_PROGRESS': ProjectStatus.ACTIVE,
    'suspended': ProjectStatus.SUSPENDED,
    'SUSPENDED': ProjectStatus.SUSPENDED,
    'completed': ProjectStatus.COMPLETED,
    'COMPLETED': ProjectStatus.COMPLETED,
    'done': ProjectStatus.COMPLETED,
    'DONE': ProjectStatus.COMPLETED,
    'cancelled': ProjectStatus.CANCELLED,
    'CANCELLED': ProjectStatus.CANCELLED,
    'canceled': ProjectStatus.CANCELLED,
    'CANCELED': ProjectStatus.CANCELLED,
  };

  return statusMap[status] || ProjectStatus.DRAFT;
}

/**
 * Mapper la priorité Firestore vers l'enum PostgreSQL
 */
function mapPriority(priority?: string): Priority {
  if (!priority) return Priority.MEDIUM;

  const priorityMap: { [key: string]: Priority } = {
    'low': Priority.LOW,
    'LOW': Priority.LOW,
    'medium': Priority.MEDIUM,
    'MEDIUM': Priority.MEDIUM,
    'high': Priority.HIGH,
    'HIGH': Priority.HIGH,
    'critical': Priority.CRITICAL,
    'CRITICAL': Priority.CRITICAL,
    'urgent': Priority.CRITICAL,
    'URGENT': Priority.CRITICAL,
  };

  return priorityMap[priority] || Priority.MEDIUM;
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
 * Migration des projets
 */
export async function migrateProjects(options: {
  maxProjects?: number;
  skipExisting?: boolean;
} = {}) {
  const { maxProjects, skipExisting = true } = options;

  const logger = new MigrationLogger('migrate-projects');
  const prisma = new PrismaClient();

  try {
    // 1. Initialiser Firebase Admin
    logger.info('🔧 Initializing Firebase Admin SDK...');
    initializeFirebaseAdmin();
    const db = getFirestore();

    // 2. Récupérer tous les projets de Firestore
    logger.info('📥 Fetching projects from Firestore...');
    let projectsQuery = db.collection('projects');

    if (maxProjects) {
      projectsQuery = projectsQuery.limit(maxProjects) as any;
    }

    const projectsSnapshot = await projectsQuery.get();
    const firestoreProjects = projectsSnapshot.docs;

    logger.info(`Found ${firestoreProjects.length} projects in Firestore`);
    logger.log('');

    // 3. Migrer chaque projet
    let batch = [];
    for (let i = 0; i < firestoreProjects.length; i++) {
      const doc = firestoreProjects[i];
      const projectData = doc.data() as FirestoreProject;
      const projectId = doc.id;

      logger.incrementTotal();

      try {
        // Valider les champs requis
        if (!projectData.name) {
          logger.skip(
            `Project ${projectId}`,
            'Missing required field: name'
          );
          continue;
        }

        // Résoudre le managerId depuis projectManager (nom) vers userId
        // Utiliser le premier ADMIN, sinon MANAGER, sinon n'importe quel user comme fallback
        let defaultManager = await prisma.user.findFirst({
          where: { role: 'ADMIN' },
          orderBy: { createdAt: 'asc' },
        });

        if (!defaultManager) {
          defaultManager = await prisma.user.findFirst({
            where: { role: 'MANAGER' },
            orderBy: { createdAt: 'asc' },
          });
        }

        if (!defaultManager) {
          defaultManager = await prisma.user.findFirst({
            orderBy: { createdAt: 'asc' },
          });
        }

        if (!defaultManager) {
          logger.skip(
            `Project ${projectId} (${projectData.name})`,
            'No users found in PostgreSQL. Migrate users first.'
          );
          continue;
        }

        // Résoudre le managerId depuis le nom du projectManager
        const resolvedManagerId = resolveManagerId(projectData.projectManager, defaultManager.id);

        // Vérifier si le manager existe dans PostgreSQL
        const manager = await prisma.user.findUnique({
          where: { id: resolvedManagerId },
        });

        if (!manager) {
          logger.skip(
            `Project ${projectId} (${projectData.name})`,
            `Manager ${resolvedManagerId} not found in PostgreSQL. Using default ADMIN.`
          );
          // Continue avec le premier ADMIN
        }

        // Vérifier si le projet existe déjà
        if (skipExisting) {
          const existingProject = await prisma.project.findUnique({
            where: { id: projectId },
          });

          if (existingProject) {
            logger.skip(
              `Project ${projectData.name}`,
              'Already exists in PostgreSQL'
            );
            continue;
          }
        }

        // Mapper les dates
        const startDate = convertTimestamp(projectData.startDate) || new Date();
        const dueDate = convertTimestamp(projectData.dueDate) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 jours par défaut

        // Préparer les données PostgreSQL
        const postgresProjectData = {
          id: projectId,
          name: projectData.name,
          description: projectData.description || null,
          status: mapProjectStatus(projectData.status),
          priority: mapPriority(projectData.priority),
          budget: projectData.budget ? projectData.budget.toString() : null,
          startDate,
          dueDate,
          managerId: resolvedManagerId, // Résolu depuis projectManager
          tags: projectData.tags || [],
          metadata: projectData.metadata || null,
          createdAt: convertTimestamp(projectData.createdAt) || new Date(),
          updatedAt: convertTimestamp(projectData.updatedAt) || new Date(),
        };

        // Insérer le projet dans PostgreSQL
        await prisma.project.create({
          data: postgresProjectData,
        });

        logger.success(
          `Migrated project: ${projectData.name}`,
          {
            id: projectId,
            name: projectData.name,
            status: postgresProjectData.status,
            projectManager: projectData.projectManager,
            managerId: resolvedManagerId,
          }
        );

        // Migrer les membres du projet (si présents)
        try {
          // Option 1: Membres dans projectData.members ou projectData.teamMembers
          const membersArray = projectData.teamMembers || projectData.members;
          if (membersArray && Array.isArray(membersArray)) {
            for (const member of membersArray) {
              if (member.userId) {
                // Vérifier que l'utilisateur existe
                const user = await prisma.user.findUnique({
                  where: { id: member.userId },
                });

                if (user) {
                  await prisma.projectMember.create({
                    data: {
                      projectId,
                      userId: member.userId,
                      role: member.role || 'member',
                      joinedAt: convertTimestamp(member.startDate || member.joinedAt) || new Date(),
                    },
                  });
                  logger.info(`  └─ Added member: ${user.email} (${member.role || 'member'})`);
                }
              }
            }
          }

          // Option 2: Membres dans une sous-collection
          const membersSnapshot = await db
            .collection('projects')
            .doc(projectId)
            .collection('members')
            .get();

          if (membersSnapshot.size > 0) {
            for (const memberDoc of membersSnapshot.docs) {
              const memberData = memberDoc.data();
              if (memberData.userId) {
                const user = await prisma.user.findUnique({
                  where: { id: memberData.userId },
                });

                if (user) {
                  await prisma.projectMember.upsert({
                    where: {
                      projectId_userId: {
                        projectId,
                        userId: memberData.userId,
                      },
                    },
                    create: {
                      projectId,
                      userId: memberData.userId,
                      role: memberData.role || 'member',
                      joinedAt: convertTimestamp(memberData.joinedAt) || new Date(),
                    },
                    update: {},
                  });
                  logger.info(`  └─ Added member: ${user.email} (${memberData.role || 'member'})`);
                }
              }
            }
          }
        } catch (memberError) {
          logger.warn(`Could not migrate members for project ${projectData.name}: ${memberError.message}`);
        }

        // Commit par batch
        batch.push(projectId);
        if (batch.length >= BATCH_SIZE) {
          logger.info(`✅ Batch of ${batch.length} projects committed`);
          batch = [];
        }

      } catch (error) {
        logger.error(
          `Failed to migrate project: ${projectData.name || projectId}`,
          error
        );
      }
    }

    // Commit dernier batch
    if (batch.length > 0) {
      logger.info(`✅ Final batch of ${batch.length} projects committed`);
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
  const maxProjects = args.includes('--test') ? 5 : undefined;
  const skipExisting = !args.includes('--overwrite');

  migrateProjects({ maxProjects, skipExisting })
    .then(() => {
      console.log('✅ Project migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Project migration failed:', error);
      process.exit(1);
    });
}
