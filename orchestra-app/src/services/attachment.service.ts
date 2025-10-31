import attachmentsAPI from './api/attachments.api';
import { TaskAttachment } from '../types';

/**
 * Service de gestion des pièces jointes
 * Migration complète vers API REST backend + MinIO (17 oct 2025)
 *
 * Fonctionnalités:
 * - Upload fichiers (single/multiple) avec suivi de progression
 * - Gestion métadonnées (description, tags, visibilité)
 * - Suppression fichiers
 * - Statistiques pièces jointes
 * - Utilitaires (validation, formatage, icônes)
 */

// Types utilitaires
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  attachment: TaskAttachment;
  success: boolean;
  error?: string;
}

class AttachmentService {
  // ========================================
  // CRUD OPERATIONS - API REST
  // ========================================

  /**
   * Récupère toutes les pièces jointes d'une tâche
   */
  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    try {
      const attachments = await attachmentsAPI.getTaskAttachments(taskId);

      // Mapper les attachments de l'API vers TaskAttachment
      return attachments.map(att => ({
        id: att.id,
        taskId: att.taskId || undefined,
        projectId: att.projectId || undefined,
        fileName: att.fileName,
        originalName: att.originalName,
        fileSize: parseInt(att.fileSize as string), // BigInt → number
        mimeType: att.mimeType,
        uploadedBy: att.uploadedBy,
        uploadedAt: typeof att.uploadedAt === 'string' ? new Date(att.uploadedAt) : att.uploadedAt,
        downloadUrl: att.downloadUrl || '',
        description: att.description || '',
        tags: att.tags || [],
        isPublic: att.isPublic || false,
        version: att.version || 1,
        previousVersionId: att.previousVersionId || undefined,
      } as TaskAttachment));
    } catch (error) {
      console.error('Erreur lors de la récupération des pièces jointes:', error);
      return [];
    }
  }

  /**
   * Écoute les pièces jointes en temps réel (simulation par polling)
   * Note: L'API REST ne supporte pas les subscriptions temps réel.
   * Cette méthode est conservée pour compatibilité mais utilise le polling.
   */
  subscribeToTaskAttachments(
    taskId: string,
    callback: (attachments: TaskAttachment[]) => void
  ): () => void {
    console.warn('subscribeToTaskAttachments: Real-time subscriptions not available with REST API. Using polling instead.');

    // Polling toutes les 5 secondes
    const intervalId = setInterval(async () => {
      const attachments = await this.getTaskAttachments(taskId);
      callback(attachments);
    }, 5000);

    // Première exécution immédiate
    this.getTaskAttachments(taskId).then(callback);

    // Fonction de désabonnement
    return () => clearInterval(intervalId);
  }

  /**
   * Upload un fichier avec suivi de progression
   */
  async uploadFile(
    file: File,
    taskId: string,
    userId: string, // userId non utilisé (JWT token dans API client)
    description?: string,
    tags?: string[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Validation du fichier
      const validationError = this.validateFile(file);
      if (validationError) {
        return { attachment: {} as TaskAttachment, success: false, error: validationError };
      }

      // Upload via API REST
      const attachment = await attachmentsAPI.uploadFile(file, {
        taskId,
        description,
        tags,
        isPublic: false,
        onProgress,
      });

      // Mapper vers TaskAttachment
      const mappedAttachment: TaskAttachment = {
        id: attachment.id,
        taskId: attachment.taskId || undefined,
        projectId: attachment.projectId || undefined,
        fileName: attachment.fileName,
        originalName: attachment.originalName,
        fileSize: parseInt(attachment.fileSize as string),
        mimeType: attachment.mimeType,
        uploadedBy: attachment.uploadedBy,
        uploadedAt: typeof attachment.uploadedAt === 'string' ? new Date(attachment.uploadedAt) : attachment.uploadedAt,
        downloadUrl: attachment.downloadUrl || '',
        description: attachment.description || '',
        tags: attachment.tags || [],
        isPublic: attachment.isPublic || false,
        version: attachment.version || 1,
        previousVersionId: attachment.previousVersionId || undefined,
      };

      return { attachment: mappedAttachment, success: true };
    } catch (error: any) {
      console.error('Erreur lors de l\'upload:', error);
      return {
        attachment: {} as TaskAttachment,
        success: false,
        error: error.message || 'Erreur lors de l\'upload'
      };
    }
  }

  /**
   * Upload de plusieurs fichiers
   */
  async uploadMultipleFiles(
    files: File[],
    taskId: string,
    userId: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void,
    onFileComplete?: (fileIndex: number, result: UploadResult) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const result = await this.uploadFile(
        file,
        taskId,
        userId,
        undefined,
        undefined,
        (progress) => onProgress?.(i, progress)
      );

      results.push(result);
      onFileComplete?.(i, result);
    }

    return results;
  }

  /**
   * Met à jour les métadonnées d'une pièce jointe
   */
  async updateAttachment(
    attachmentId: string,
    updates: Partial<Pick<TaskAttachment, 'description' | 'tags' | 'isPublic'>>
  ): Promise<void> {
    try {
      await attachmentsAPI.updateAttachment(attachmentId, updates);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la pièce jointe:', error);
      throw error;
    }
  }

  /**
   * Supprime une pièce jointe (fichier + métadonnées)
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      await attachmentsAPI.deleteAttachment(attachmentId);
    } catch (error) {
      console.error('Erreur lors de la suppression de la pièce jointe:', error);
      throw error;
    }
  }

  // ========================================
  // STATISTIQUES
  // ========================================

  /**
   * Obtient les statistiques des pièces jointes d'une tâche
   */
  async getAttachmentStats(taskId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
    recentUploads: number;
  }> {
    try {
      return await attachmentsAPI.getTaskAttachmentStats(taskId);
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {},
        recentUploads: 0,
      };
    }
  }

  // ========================================
  // UTILITAIRES
  // ========================================

  /**
   * Génère une URL de prévisualisation pour les images
   */
  async generateThumbnail(attachment: TaskAttachment): Promise<string | null> {
    try {
      if (!attachment.mimeType.startsWith('image/')) {
        return null;
      }

      // Pour les images, on utilise l'URL de téléchargement
      return attachment.downloadUrl;
    } catch (error) {
      console.error('Erreur lors de la génération de miniature:', error);
      return null;
    }
  }

  /**
   * Crée une nouvelle version d'un fichier
   * Note: La gestion de version est simplifiée avec l'API REST
   */
  async createFileVersion(
    originalAttachmentId: string,
    newFile: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Récupérer l'attachment original
      const originalAttachment = await attachmentsAPI.getAttachment(originalAttachmentId);

      // Upload de la nouvelle version
      const result = await this.uploadFile(
        newFile,
        originalAttachment.taskId!,
        userId,
        originalAttachment.description || undefined,
        originalAttachment.tags,
        onProgress
      );

      if (result.success && result.attachment.id) {
        // Mettre à jour avec les infos de versioning si nécessaire
        await this.updateAttachment(result.attachment.id, {
          description: `Version ${originalAttachment.version + 1} de ${originalAttachment.originalName}`,
        });
      }

      return result;
    } catch (error: any) {
      console.error('Erreur lors de la création de version:', error);
      return {
        attachment: {} as TaskAttachment,
        success: false,
        error: error.message || 'Erreur de création de version'
      };
    }
  }

  /**
   * Validation de fichier
   */
  private validateFile(file: File): string | null {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Documents
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Texte
      'text/plain', 'text/csv', 'text/markdown',
      // Archives
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
      // Code
      'application/json', 'application/javascript', 'text/html', 'text/css',
    ];

    if (file.size > maxSize) {
      return `Le fichier est trop volumineux (max: 50MB)`;
    }

    if (!allowedTypes.includes(file.type)) {
      return `Type de fichier non autorisé: ${file.type}`;
    }

    return null;
  }

  /**
   * Formate la taille de fichier pour affichage
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Obtient l'icône appropriée pour un type de fichier
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦';
    if (mimeType.includes('text')) return '📃';
    return '📎';
  }
}

export const attachmentService = new AttachmentService();
