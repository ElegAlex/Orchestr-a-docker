import api from './client';

/**
 * API client pour la gestion des avatars
 * Utilise le service Profile pour l'upload/delete
 */

export interface UploadAvatarResponse {
  message: string;
  attachmentId: string;
  avatarUrl: string;
  user: any;
}

/**
 * Upload un avatar vers MinIO
 */
export const uploadAvatar = async (file: File, onProgress?: (progress: number) => void): Promise<UploadAvatarResponse> => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await api.post<UploadAvatarResponse>('/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentage = (progressEvent.loaded / progressEvent.total) * 100;
        onProgress(percentage);
      }
    },
  });

  return response.data;
};

/**
 * Supprime l'avatar de l'utilisateur
 */
export const deleteAvatar = async (): Promise<void> => {
  await api.delete('/profile/avatar');
};

// Export du module
const avatarAPI = {
  uploadAvatar,
  deleteAvatar,
};

export default avatarAPI;
