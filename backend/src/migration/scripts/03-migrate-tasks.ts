import { PrismaClient, TaskStatus, Priority } from '@prisma/client';
import { initializeFirebaseAdmin, getFirestore } from '../config/firebase-admin.config';
import { MigrationLogger } from '../utils/logger';

/**
 * Script de migration des tâches
 * Firestore tasks → PostgreSQL tasks
 */

interface FirestoreTask {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  projectId?: string;
  assigneeId?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: any;
  completedAt?: any;
  dependencies?: string[];
  tags?: string[];
  metadata?: any;
  createdAt?: any;
  updatedAt?: any;
}

const BATCH_SIZE = 100;

/**
 * Mapper le statut Firestore vers l'enum PostgreSQL
 */
function mapTaskStatus(status?: string): TaskStatus {
  if (!status) return TaskStatus.TODO;

  const statusMap: { [key: string]: TaskStatus } = {
    'todo': TaskStatus.TODO,
    'TODO': TaskStatus.TODO,
    'to_do': TaskStatus.TODO,
    'TO_DO': TaskStatus.TODO,
    'pending': TaskStatus.TODO,
    'PENDING': TaskStatus.TODO,
    'in_progress': TaskStatus.IN_PROGRESS,
    'IN_PROGRESS': TaskStatus.IN_PROGRESS,
    'in-progress': TaskStatus.IN_PROGRESS,
    'doing': TaskStatus.IN_PROGRESS,
    'DOING': TaskStatus.IN_PROGRESS,
    'review': TaskStatus.REVIEW,
    'REVIEW': TaskStatus.REVIEW,
    'in_review': TaskStatus.REVIEW,
    'IN_REVIEW': TaskStatus.REVIEW,
    'completed': TaskStatus.COMPLETED,
    'COMPLETED': TaskStatus.COMPLETED,
    'done': TaskStatus.COMPLETED,
    'DONE': TaskStatus.COMPLETED,
    'cancelled': TaskStatus.CANCELLED,
    'CANCELLED': TaskStatus.CANCELLED,
    'canceled': TaskStatus.CANCELLED,
    'CANCELED': TaskStatus.CANCELLED,
  };

  return statusMap[status] || TaskStatus.TODO;
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
 * Migration des tâches
 */
export async function migrateTasks(options: {
  maxTasks?: number;
  skipExisting?: boolean;
} = {}) {
  const { maxTasks, skipExisting = true } = options;

  const logger = new MigrationLogger('migrate-tasks');
  const prisma = new PrismaClient();

  try {
    // 1. Initialiser Firebase Admin
    logger.info('🔧 Initializing Firebase Admin SDK...');
    initializeFirebaseAdmin();
    const db = getFirestore();

    // 2. Récupérer toutes les tâches de Firestore
    logger.info('📥 Fetching tasks from Firestore...');
    let tasksQuery = db.collection('tasks');

    if (maxTasks) {
      tasksQuery = tasksQuery.limit(maxTasks) as any;
    }

    const tasksSnapshot = await tasksQuery.get();
    const firestoreTasks = tasksSnapshot.docs;

    logger.info(`Found ${firestoreTasks.length} tasks in Firestore`);
    logger.log('');

    // 3. Migrer chaque tâche
    let batch = [];
    for (let i = 0; i < firestoreTasks.length; i++) {
      const doc = firestoreTasks[i];
      const taskData = doc.data() as FirestoreTask;
      const taskId = doc.id;

      logger.incrementTotal();

      try {
        // Valider les champs requis
        if (!taskData.title) {
          logger.skip(
            `Task ${taskId}`,
            'Missing required field: title'
          );
          continue;
        }

        if (!taskData.projectId) {
          logger.skip(
            `Task ${taskId} (${taskData.title})`,
            'Missing required field: projectId'
          );
          continue;
        }

        // Vérifier si le projet existe dans PostgreSQL
        const project = await prisma.project.findUnique({
          where: { id: taskData.projectId },
        });

        if (!project) {
          logger.skip(
            `Task ${taskId} (${taskData.title})`,
            `Project ${taskData.projectId} not found in PostgreSQL. Migrate projects first.`
          );
          continue;
        }

        // Vérifier si l'assignee existe (si spécifié)
        let assigneeId = taskData.assigneeId || null;
        if (assigneeId) {
          const assignee = await prisma.user.findUnique({
            where: { id: assigneeId },
          });

          if (!assignee) {
            logger.warn(
              `Task ${taskId}: Assignee ${assigneeId} not found. Setting assignee to null.`
            );
            assigneeId = null;
          }
        }

        // Vérifier si la tâche existe déjà
        if (skipExisting) {
          const existingTask = await prisma.task.findUnique({
            where: { id: taskId },
          });

          if (existingTask) {
            logger.skip(
              `Task ${taskData.title}`,
              'Already exists in PostgreSQL'
            );
            continue;
          }
        }

        // Mapper le statut et ajuster completedAt si nécessaire
        const status = mapTaskStatus(taskData.status);
        let completedAt = convertTimestamp(taskData.completedAt) || null;

        // Si status = COMPLETED mais pas de completedAt, utiliser updatedAt
        if (status === TaskStatus.COMPLETED && !completedAt) {
          completedAt = convertTimestamp(taskData.updatedAt) || new Date();
        }

        // Préparer les données PostgreSQL
        const postgresTaskData = {
          id: taskId,
          title: taskData.title,
          description: taskData.description || null,
          status,
          priority: mapPriority(taskData.priority),
          projectId: taskData.projectId,
          assigneeId,
          estimatedHours: taskData.estimatedHours || null,
          actualHours: taskData.actualHours || null,
          dueDate: convertTimestamp(taskData.dueDate) || null,
          completedAt,
          dependencies: taskData.dependencies || [],
          tags: taskData.tags || [],
          metadata: taskData.metadata || null,
          createdAt: convertTimestamp(taskData.createdAt) || new Date(),
          updatedAt: convertTimestamp(taskData.updatedAt) || new Date(),
        };

        // Insérer la tâche dans PostgreSQL
        await prisma.task.create({
          data: postgresTaskData,
        });

        logger.success(
          `Migrated task: ${taskData.title}`,
          {
            id: taskId,
            title: taskData.title,
            status: postgresTaskData.status,
            projectId: taskData.projectId,
            assigneeId: assigneeId || 'unassigned',
          }
        );

        // Commit par batch
        batch.push(taskId);
        if (batch.length >= BATCH_SIZE) {
          logger.info(`✅ Batch of ${batch.length} tasks committed`);
          batch = [];
        }

      } catch (error) {
        logger.error(
          `Failed to migrate task: ${taskData.title || taskId}`,
          error
        );
      }
    }

    // Commit dernier batch
    if (batch.length > 0) {
      logger.info(`✅ Final batch of ${batch.length} tasks committed`);
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
  const maxTasks = args.includes('--test') ? 10 : undefined;
  const skipExisting = !args.includes('--overwrite');

  migrateTasks({ maxTasks, skipExisting })
    .then(() => {
      console.log('✅ Task migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Task migration failed:', error);
      process.exit(1);
    });
}
