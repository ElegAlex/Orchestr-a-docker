import api from './client';

export interface Document {
  id: string;
  name: string;
  originalName: string;
  type: string;
  size: string;
  storagePath: string;
  projectId?: string;
  taskId?: string;
  uploadedBy: string;
  isPublic: boolean;
  metadata?: any;
  tags: string[];
  uploadedAt: string;
  uploader?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
  };
  project?: {
    id: string;
    name: string;
    status?: string;
  };
  task?: {
    id: string;
    title: string;
    status?: string;
  };
}

export interface UploadDocumentRequest {
  name: string;
  projectId?: string;
  taskId?: string;
  isPublic?: boolean;
  tags?: string[];
  metadata?: any;
}

export interface UpdateDocumentRequest {
  name?: string;
  tags?: string[];
  isPublic?: boolean;
  metadata?: any;
}

export interface GetDocumentsParams {
  projectId?: string;
  taskId?: string;
  uploadedBy?: string;
  isPublic?: boolean;
  page?: number;
  limit?: number;
}

export interface DocumentStats {
  project: {
    id: string;
    name: string;
    status: string;
  };
  totalDocuments: number;
  documentsByType: Array<{
    _count: number;
    type: string;
  }>;
  totalSize: string;
  publicCount: number;
  privateCount: number;
}

export interface DownloadUrlResponse {
  url: string;
  expiresIn: number;
  document: {
    id: string;
    name: string;
    originalName: string;
    type: string;
    size: string;
  };
}

export const documentsAPI = {
  /**
   * Récupère tous les documents avec filtrage optionnel
   */
  async getAll(params?: GetDocumentsParams): Promise<Document[]> {
    const response = await api.get('/documents', { params });
    return response.data || [];
  },

  /**
   * Récupère les documents d'un projet
   */
  async getDocumentsByProject(projectId: string): Promise<Document[]> {
    return this.getAll({ projectId });
  },

  /**
   * Récupère les documents d'une tâche
   */
  async getDocumentsByTask(taskId: string): Promise<Document[]> {
    return this.getAll({ taskId });
  },

  /**
   * Récupère un document par ID
   */
  async getById(id: string): Promise<Document> {
    return await api.get(`/documents/${id}`);
  },

  /**
   * Upload un document avec FormData
   */
  async uploadDocument(file: File, metadata: UploadDocumentRequest): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', metadata.name);

    if (metadata.projectId) {
      formData.append('projectId', metadata.projectId);
    }
    if (metadata.taskId) {
      formData.append('taskId', metadata.taskId);
    }
    if (metadata.isPublic !== undefined) {
      formData.append('isPublic', String(metadata.isPublic));
    }
    if (metadata.tags && metadata.tags.length > 0) {
      formData.append('tags', JSON.stringify(metadata.tags));
    }
    if (metadata.metadata) {
      formData.append('metadata', JSON.stringify(metadata.metadata));
    }

    return await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Génère une URL de téléchargement pré-signée (24h)
   */
  async getDownloadUrl(documentId: string): Promise<DownloadUrlResponse> {
    return await api.get(`/documents/${documentId}/download-url`);
  },

  /**
   * Télécharge un document (blob)
   */
  async downloadDocument(documentId: string): Promise<Blob> {
    return await api.get(`/documents/${documentId}/download`, {
      responseType: 'blob',
    });
  },

  /**
   * Met à jour les métadonnées d'un document
   */
  async updateDocument(
    documentId: string,
    data: UpdateDocumentRequest,
  ): Promise<Document> {
    return await api.patch(`/documents/${documentId}`, data);
  },

  /**
   * Supprime un document (fichier + métadonnées)
   */
  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/documents/${documentId}`);
  },

  /**
   * Récupère les statistiques des documents d'un projet
   */
  async getProjectStats(projectId: string): Promise<DocumentStats> {
    return await api.get(`/documents/project/${projectId}/stats`);
  },
};
