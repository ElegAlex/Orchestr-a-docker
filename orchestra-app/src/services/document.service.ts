/**
 * DocumentService - Wrapper autour de documentsAPI pour compatibilité avec le code existant
 *
 * Cette classe maintient la même interface que l'ancien service Firebase
 * mais utilise l'API REST backend en interne.
 *
 * Note: Fichier Firebase original sauvegardé dans document.service.ts.firebase-backup
 */

import { documentsAPI } from './api/documents.api';
import type { Document } from '../types';

export class DocumentService {
  /**
   * Récupère les documents d'un projet
   */
  async getDocumentsByProject(projectId: string): Promise<Document[]> {
    try {
      const documents = await documentsAPI.getDocumentsByProject(projectId);

      // Trier par date de création (plus récent en premier)
      return documents.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error: any) {
      console.error('Error fetching project documents:', error);
      return [];
    }
  }

  /**
   * Récupère les documents d'une tâche
   */
  async getDocumentsByTask(taskId: string): Promise<Document[]> {
    try {
      const documents = await documentsAPI.getDocumentsByTask(taskId);

      // Trier par date de création (plus récent en premier)
      return documents.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error: any) {
      console.error('Error fetching task documents:', error);
      return [];
    }
  }

  /**
   * Upload un document pour un projet
   */
  async uploadDocument(
    projectId: string,
    file: File,
    metadata?: { description?: string; category?: string }
  ): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);

      if (metadata?.description) {
        formData.append('description', metadata.description);
      }

      if (metadata?.category) {
        formData.append('category', metadata.category);
      }

      return await documentsAPI.uploadDocument(formData);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Upload un document pour une tâche
   */
  async uploadTaskDocument(
    taskId: string,
    file: File,
    metadata?: { description?: string; category?: string }
  ): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', taskId);

      if (metadata?.description) {
        formData.append('description', metadata.description);
      }

      if (metadata?.category) {
        formData.append('category', metadata.category);
      }

      return await documentsAPI.uploadDocument(formData);
    } catch (error: any) {
      console.error('Error uploading task document:', error);
      throw error;
    }
  }

  /**
   * Met à jour les métadonnées d'un document
   */
  async updateDocument(documentId: string, updates: Partial<Document>): Promise<Document> {
    try {
      return await documentsAPI.updateDocument(documentId, updates);
    } catch (error: any) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * Supprime un document
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await documentsAPI.deleteDocument(documentId);
    } catch (error: any) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Télécharge un document
   */
  async downloadDocument(documentId: string, fileName: string): Promise<void> {
    try {
      const blob = await documentsAPI.downloadDocument(documentId);

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }

  /**
   * Récupère l'URL de prévisualisation d'un document
   */
  getDocumentPreviewUrl(documentId: string): string {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
    return `${API_URL}/documents/${documentId}/preview`;
  }

  /**
   * Récupère l'URL de téléchargement d'un document
   */
  getDocumentDownloadUrl(documentId: string): string {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
    return `${API_URL}/documents/${documentId}/download`;
  }
}

export const documentService = new DocumentService();
export default documentService;
