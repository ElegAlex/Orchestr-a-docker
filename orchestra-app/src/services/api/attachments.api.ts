import api from './client';

// Types
export interface Attachment {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: string; // BigInt as string
  mimeType: string;
  storagePath: string;
  downloadUrl: string | null;
  taskId: string | null;
  projectId: string | null;
  uploadedBy: string;
  description: string | null;
  tags: string[];
  isPublic: boolean;
  version: number;
  previousVersionId: string | null;
  uploadedAt: Date | string;
  updatedAt: Date | string;
}

export interface AttachmentStats {
  totalFiles: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  recentUploads: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  attachment: Attachment;
  success: boolean;
  error?: string;
}

// Helper function to create FormData for file upload
const createUploadFormData = (
  file: File,
  options?: {
    taskId?: string;
    projectId?: string;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
  }
): FormData => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('originalName', file.name);
  formData.append('mimeType', file.type);
  formData.append('fileSize', file.size.toString());

  if (options?.taskId) formData.append('taskId', options.taskId);
  if (options?.projectId) formData.append('projectId', options.projectId);
  if (options?.description) formData.append('description', options.description);
  if (options?.tags) formData.append('tags', JSON.stringify(options.tags));
  if (options?.isPublic !== undefined) formData.append('isPublic', options.isPublic.toString());

  return formData;
};

/**
 * Upload un fichier vers le serveur
 */
export const uploadFile = async (
  file: File,
  options?: {
    taskId?: string;
    projectId?: string;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
    onProgress?: (progress: UploadProgress) => void;
  }
): Promise<Attachment> => {
  const formData = createUploadFormData(file, options);

  const response = await api.post<Attachment>('/attachments/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (options?.onProgress && progressEvent.total) {
        const progress: UploadProgress = {
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          percentage: (progressEvent.loaded / progressEvent.total) * 100,
        };
        options.onProgress(progress);
      }
    },
  });

  return response.data;
};

/**
 * Upload plusieurs fichiers
 */
export const uploadMultipleFiles = async (
  files: File[],
  taskId?: string,
  projectId?: string,
  onFileProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadResult[]> => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  if (taskId) formData.append('taskId', taskId);
  if (projectId) formData.append('projectId', projectId);

  const response = await api.post<UploadResult[]>('/attachments/upload-multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Récupérer toutes les pièces jointes d'une tâche
 */
export const getTaskAttachments = async (taskId: string): Promise<Attachment[]> => {
  const response = await api.get<Attachment[]>(`/attachments/task/${taskId}`);
  return response.data;
};

/**
 * Récupérer toutes les pièces jointes d'un projet
 */
export const getProjectAttachments = async (projectId: string): Promise<Attachment[]> => {
  const response = await api.get<Attachment[]>(`/attachments/project/${projectId}`);
  return response.data;
};

/**
 * Récupérer une pièce jointe par ID
 */
export const getAttachment = async (id: string): Promise<Attachment> => {
  const response = await api.get<Attachment>(`/attachments/${id}`);
  return response.data;
};

/**
 * Générer une URL de téléchargement signée
 */
export const getDownloadUrl = async (id: string): Promise<string> => {
  const response = await api.get<{ url: string }>(`/attachments/${id}/download-url`);
  return response.data.url;
};

/**
 * Télécharger directement un fichier
 */
export const downloadFile = async (id: string): Promise<Blob> => {
  const response = await api.get(`/attachments/${id}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Télécharger et sauvegarder un fichier dans le navigateur
 */
export const downloadAndSave = async (id: string, filename?: string): Promise<void> => {
  const blob = await downloadFile(id);

  // Si pas de nom de fichier fourni, récupérer l'attachment pour avoir le nom original
  let finalFilename = filename;
  if (!finalFilename) {
    const attachment = await getAttachment(id);
    finalFilename = attachment.originalName;
  }

  // Créer un lien temporaire et déclencher le téléchargement
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Mettre à jour les métadonnées d'une pièce jointe
 */
export const updateAttachment = async (
  id: string,
  data: {
    description?: string;
    tags?: string[];
    isPublic?: boolean;
  }
): Promise<Attachment> => {
  const response = await api.patch<Attachment>(`/attachments/${id}`, data);
  return response.data;
};

/**
 * Supprimer une pièce jointe
 */
export const deleteAttachment = async (id: string): Promise<void> => {
  await api.delete(`/attachments/${id}`);
};

/**
 * Obtenir les statistiques des pièces jointes d'une tâche
 */
export const getTaskAttachmentStats = async (taskId: string): Promise<AttachmentStats> => {
  const response = await api.get<AttachmentStats>(`/attachments/stats/task/${taskId}`);
  return response.data;
};

/**
 * Obtenir les statistiques globales
 */
export const getGlobalStats = async (): Promise<AttachmentStats> => {
  const response = await api.get<AttachmentStats>('/attachments/stats/global');
  return response.data;
};

// Export du module
const attachmentsAPI = {
  uploadFile,
  uploadMultipleFiles,
  getTaskAttachments,
  getProjectAttachments,
  getAttachment,
  getDownloadUrl,
  downloadFile,
  downloadAndSave,
  updateAttachment,
  deleteAttachment,
  getTaskAttachmentStats,
  getGlobalStats,
};

export default attachmentsAPI;
