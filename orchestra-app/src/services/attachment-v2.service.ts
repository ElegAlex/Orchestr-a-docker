/**
 * Service Attachments v2 - Migration REST API
 * Service 33: Gestion des Pièces Jointes
 * Migration: Firebase → NestJS + PostgreSQL + MinIO
 * Date: 17 octobre 2025
 */

import attachmentsAPI, { Attachment, AttachmentStats, UploadProgress } from './api/attachments.api';

// Types utilitaires
export interface UploadResult {
  attachment: Attachment;
  success: boolean;
  error?: string;
}

class AttachmentServiceV2 {
  /**
   * Récupérer toutes les pièces jointes d'une tâche
   */
  async getTaskAttachments(taskId: string): Promise<Attachment[]> {
    try {
      return await attachmentsAPI.getTaskAttachments(taskId);
    } catch (error) {
      console.error('Erreur lors de la récupération des pièces jointes:', error);
      return [];
    }
  }

  /**
   * Récupérer toutes les pièces jointes d'un projet
   */
  async getProjectAttachments(projectId: string): Promise<Attachment[]> {
    try {
      return await attachmentsAPI.getProjectAttachments(projectId);
    } catch (error) {
      console.error('Erreur lors de la récupération des pièces jointes du projet:', error);
      return [];
    }
  }

  /**
   * Upload d'un fichier avec progress callback
   */
  async uploadFile(
    file: File,
    taskId?: string,
    projectId?: string,
    description?: string,
    tags?: string[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Validation du fichier
      const validationError = this.validateFile(file);
      if (validationError) {
        return { attachment: {} as Attachment, success: false, error: validationError };
      }

      const attachment = await attachmentsAPI.uploadFile(file, {
        taskId,
        projectId,
        description,
        tags,
        onProgress,
      });

      return { attachment, success: true };
    } catch (error: any) {
      console.error('Erreur lors de l\'upload:', error);
      return {
        attachment: {} as Attachment,
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur générale',
      };
    }
  }

  /**
   * Upload de plusieurs fichiers
   */
  async uploadMultipleFiles(
    files: File[],
    taskId?: string,
    projectId?: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void,
    onFileComplete?: (fileIndex: number, result: UploadResult) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const result = await this.uploadFile(
        file,
        taskId,
        projectId,
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
   * Mettre à jour les métadonnées d'une pièce jointe
   */
  async updateAttachment(
    attachmentId: string,
    updates: { description?: string; tags?: string[]; isPublic?: boolean }
  ): Promise<void> {
    try {
      await attachmentsAPI.updateAttachment(attachmentId, updates);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la pièce jointe:', error);
      throw error;
    }
  }

  /**
   * Supprimer une pièce jointe
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      await attachmentsAPI.deleteAttachment(attachmentId);
    } catch (error) {
      console.error('Erreur lors de la suppression de la pièce jointe:', error);
      throw error;
    }
  }

  /**
   * Télécharger et sauvegarder un fichier
   */
  async downloadAttachment(attachmentId: string, filename?: string): Promise<void> {
    try {
      await attachmentsAPI.downloadAndSave(attachmentId, filename);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw error;
    }
  }

  /**
   * Validation de fichier
   */
  private validateFile(file: File): string | null {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Texte
      'text/plain',
      'text/csv',
      'text/markdown',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      // Code
      'application/json',
      'application/javascript',
      'text/html',
      'text/css',
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
   * Obtenir les statistiques des pièces jointes d'une tâche
   */
  async getAttachmentStats(taskId: string): Promise<AttachmentStats> {
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

  /**
   * Obtenir les statistiques globales
   */
  async getGlobalStats(): Promise<AttachmentStats> {
    try {
      return await attachmentsAPI.getGlobalStats();
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques globales:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {},
        recentUploads: 0,
      };
    }
  }

  /**
   * Générer une URL de prévisualisation pour les images
   */
  async generateThumbnail(attachment: Attachment): Promise<string | null> {
    try {
      if (!attachment.mimeType.startsWith('image/')) {
        return null;
      }

      // Récupérer l'URL de téléchargement signée
      return await attachmentsAPI.getDownloadUrl(attachment.id);
    } catch (error) {
      console.error('Erreur lors de la génération de miniature:', error);
      return null;
    }
  }

  /**
   * Créer une nouvelle version d'un fichier
   */
  async createFileVersion(
    originalAttachmentId: string,
    newFile: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Récupérer l'attachment original
      const originalAttachment = await attachmentsAPI.getAttachment(originalAttachmentId);

      // Upload de la nouvelle version
      const result = await this.uploadFile(
        newFile,
        originalAttachment.taskId || undefined,
        originalAttachment.projectId || undefined,
        originalAttachment.description || undefined,
        originalAttachment.tags,
        onProgress
      );

      if (result.success && result.attachment) {
        // Note: Le versioning complet nécessiterait un endpoint spécifique backend
        // Pour l'instant, on upload simplement un nouveau fichier
      }

      return result;
    } catch (error: any) {
      console.error('Erreur lors de la création de version:', error);
      return {
        attachment: {} as Attachment,
        success: false,
        error: 'Erreur de création de version',
      };
    }
  }

  /**
   * Formater la taille de fichier
   */
  formatFileSize(bytes: number | string): string {
    const bytesNum = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytesNum;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Obtenir l'icône appropriée pour un type de fichier
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

  /**
   * Compatibilité: subscribeToTaskAttachments (polling au lieu de temps réel)
   * Note: Le temps réel Firebase est remplacé par du polling
   */
  subscribeToTaskAttachments(
    taskId: string,
    callback: (attachments: Attachment[]) => void,
    intervalMs: number = 5000
  ): () => void {
    // Premier appel immédiat
    this.getTaskAttachments(taskId).then(callback);

    // Polling toutes les 5 secondes par défaut
    const intervalId = setInterval(() => {
      this.getTaskAttachments(taskId).then(callback);
    }, intervalMs);

    // Retourner fonction d'unsubscribe
    return () => clearInterval(intervalId);
  }
}

export const attachmentServiceV2 = new AttachmentServiceV2();
