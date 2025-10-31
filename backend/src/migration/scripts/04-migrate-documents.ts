import { PrismaClient } from '@prisma/client';
import * as Minio from 'minio';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { initializeFirebaseAdmin, getFirestore, getStorage } from '../config/firebase-admin.config';
import { MigrationLogger } from '../utils/logger';

/**
 * Script de migration des documents
 * Firestore documents + Firebase Storage → PostgreSQL documents + MinIO
 *
 * Ce script :
 * 1. Lit les métadonnées des documents depuis Firestore
 * 2. Télécharge les fichiers depuis Firebase Storage
 * 3. Upload les fichiers vers MinIO
 * 4. Crée les enregistrements dans PostgreSQL
 */

interface FirestoreDocument {
  id?: string;
  name?: string;
  originalName?: string;
  fileName?: string;
  type?: string;
  fileType?: string;
  mimeType?: string;
  size?: number;
  projectId?: string;
  taskId?: string;
  uploadedBy?: string;
  storagePath?: string;
  storageRef?: string;
  url?: string;
  isPublic?: boolean;
  tags?: string[];
  metadata?: any;
  uploadedAt?: any;
  createdAt?: any;
}

const BATCH_SIZE = 20; // Plus petit car upload de fichiers
const TEMP_DIR = path.join(os.tmpdir(), 'orchestr-a-migration');

/**
 * Créer le client MinIO
 */
function createMinioClient(): Minio.Client {
  return new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  });
}

/**
 * Vérifier/créer le bucket MinIO
 */
async function ensureBucket(minioClient: Minio.Client, bucketName: string): Promise<void> {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, 'us-east-1');
    console.log(`✅ MinIO bucket '${bucketName}' created`);
  }
}

/**
 * Créer le répertoire temporaire
 */
function ensureTempDir(): void {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/**
 * Nettoyer le répertoire temporaire
 */
function cleanupTempDir(): void {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
}

/**
 * Générer un nom de fichier unique pour MinIO
 */
function generateMinioPath(originalName: string, documentId: string): string {
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  const basename = path.basename(originalName, ext);
  const sanitized = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `documents/${timestamp}-${documentId}-${sanitized}${ext}`;
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
 * Migration des documents
 */
export async function migrateDocuments(options: {
  maxDocuments?: number;
  skipExisting?: boolean;
} = {}) {
  const { maxDocuments, skipExisting = true } = options;

  const logger = new MigrationLogger('migrate-documents');
  const prisma = new PrismaClient();
  let minioClient: Minio.Client | null = null;

  try {
    // 1. Initialiser Firebase Admin
    logger.info('🔧 Initializing Firebase Admin SDK...');
    initializeFirebaseAdmin();
    const db = getFirestore();
    const storage = getStorage();
    const bucket = storage.bucket();

    // 2. Initialiser MinIO
    logger.info('🔧 Initializing MinIO client...');
    minioClient = createMinioClient();
    const minioBucket = process.env.MINIO_BUCKET_NAME || 'orchestr-a-documents';
    await ensureBucket(minioClient, minioBucket);

    // 3. Préparer le répertoire temporaire
    ensureTempDir();
    logger.info(`📁 Temp directory: ${TEMP_DIR}`);

    // 4. Récupérer tous les documents de Firestore
    logger.info('📥 Fetching documents from Firestore...');
    let documentsQuery = db.collection('documents');

    if (maxDocuments) {
      documentsQuery = documentsQuery.limit(maxDocuments) as any;
    }

    const documentsSnapshot = await documentsQuery.get();
    const firestoreDocuments = documentsSnapshot.docs;

    logger.info(`Found ${firestoreDocuments.length} documents in Firestore`);
    logger.log('');

    // 5. Migrer chaque document
    let batch = [];
    for (let i = 0; i < firestoreDocuments.length; i++) {
      const doc = firestoreDocuments[i];
      const documentData = doc.data() as FirestoreDocument;
      const documentId = doc.id;

      logger.incrementTotal();

      try {
        // Valider les champs requis
        const originalName = documentData.originalName || documentData.name || documentData.fileName;
        if (!originalName) {
          logger.skip(
            `Document ${documentId}`,
            'Missing required field: name/originalName'
          );
          continue;
        }

        if (!documentData.uploadedBy) {
          logger.skip(
            `Document ${documentId} (${originalName})`,
            'Missing required field: uploadedBy'
          );
          continue;
        }

        // Vérifier si l'uploader existe
        const uploader = await prisma.user.findUnique({
          where: { id: documentData.uploadedBy },
        });

        if (!uploader) {
          logger.skip(
            `Document ${documentId} (${originalName})`,
            `Uploader ${documentData.uploadedBy} not found in PostgreSQL. Migrate users first.`
          );
          continue;
        }

        // Vérifier si le projet existe (si spécifié)
        if (documentData.projectId) {
          const project = await prisma.project.findUnique({
            where: { id: documentData.projectId },
          });

          if (!project) {
            logger.warn(
              `Document ${documentId}: Project ${documentData.projectId} not found. Setting projectId to null.`
            );
            documentData.projectId = undefined;
          }
        }

        // Vérifier si la tâche existe (si spécifié)
        if (documentData.taskId) {
          const task = await prisma.task.findUnique({
            where: { id: documentData.taskId },
          });

          if (!task) {
            logger.warn(
              `Document ${documentId}: Task ${documentData.taskId} not found. Setting taskId to null.`
            );
            documentData.taskId = undefined;
          }
        }

        // Vérifier si le document existe déjà
        if (skipExisting) {
          const existingDocument = await prisma.document.findUnique({
            where: { id: documentId },
          });

          if (existingDocument) {
            logger.skip(
              `Document ${originalName}`,
              'Already exists in PostgreSQL'
            );
            continue;
          }
        }

        // Déterminer le chemin Firebase Storage
        const storagePath = documentData.storagePath || documentData.storageRef;
        if (!storagePath) {
          logger.skip(
            `Document ${documentId} (${originalName})`,
            'Missing Firebase Storage path'
          );
          continue;
        }

        // Télécharger le fichier depuis Firebase Storage
        const tempFilePath = path.join(TEMP_DIR, `${documentId}-${originalName}`);
        logger.info(`  📥 Downloading from Firebase Storage: ${storagePath}`);

        try {
          const file = bucket.file(storagePath);
          await file.download({ destination: tempFilePath });

          // Vérifier que le fichier existe
          if (!fs.existsSync(tempFilePath)) {
            throw new Error('File not downloaded successfully');
          }

          const stats = fs.statSync(tempFilePath);
          const fileSize = stats.size;

          logger.info(`  ✅ Downloaded ${fileSize} bytes`);

          // Générer le chemin MinIO
          const minioPath = generateMinioPath(originalName, documentId);

          // Upload vers MinIO
          logger.info(`  📤 Uploading to MinIO: ${minioPath}`);
          await minioClient.fPutObject(
            minioBucket,
            minioPath,
            tempFilePath,
            {
              'Content-Type': documentData.type || documentData.fileType || documentData.mimeType || 'application/octet-stream',
            }
          );

          logger.info(`  ✅ Uploaded to MinIO`);

          // Créer l'enregistrement PostgreSQL
          const postgresDocumentData = {
            id: documentId,
            name: originalName,
            originalName,
            type: documentData.type || documentData.fileType || documentData.mimeType || 'application/octet-stream',
            size: BigInt(documentData.size || fileSize),
            storagePath: minioPath,
            projectId: documentData.projectId || null,
            taskId: documentData.taskId || null,
            uploadedBy: documentData.uploadedBy,
            isPublic: documentData.isPublic || false,
            tags: documentData.tags || [],
            metadata: documentData.metadata || null,
            uploadedAt: convertTimestamp(documentData.uploadedAt || documentData.createdAt) || new Date(),
          };

          await prisma.document.create({
            data: postgresDocumentData,
          });

          logger.success(
            `Migrated document: ${originalName}`,
            {
              id: documentId,
              name: originalName,
              size: `${fileSize} bytes`,
              minioPath,
            }
          );

          // Nettoyer le fichier temporaire
          fs.unlinkSync(tempFilePath);

          // Commit par batch
          batch.push(documentId);
          if (batch.length >= BATCH_SIZE) {
            logger.info(`✅ Batch of ${batch.length} documents committed`);
            batch = [];
          }

        } catch (storageError) {
          logger.error(
            `Failed to transfer file ${originalName}`,
            storageError
          );

          // Nettoyer le fichier temporaire si existe
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        }

      } catch (error) {
        logger.error(
          `Failed to migrate document: ${documentData.name || documentId}`,
          error
        );
      }
    }

    // Commit dernier batch
    if (batch.length > 0) {
      logger.info(`✅ Final batch of ${batch.length} documents committed`);
    }

  } catch (error) {
    logger.error('Migration failed', error);
    throw error;
  } finally {
    // Nettoyer
    cleanupTempDir();
    await prisma.$disconnect();
    logger.summary();
  }
}

/**
 * Exécution du script si appelé directement
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const maxDocuments = args.includes('--test') ? 5 : undefined;
  const skipExisting = !args.includes('--overwrite');

  migrateDocuments({ maxDocuments, skipExisting })
    .then(() => {
      console.log('✅ Document migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Document migration failed:', error);
      process.exit(1);
    });
}
