import api from './client';

// Types
export interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  avatarUrl?: string;
  phoneNumber?: string;
  jobTitle?: string;
  bio?: string;
  preferences?: UserPreferences;
  departmentId?: string;
  department?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastActivityAt?: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    desktop?: boolean;
  };
  timezone?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  jobTitle?: string;
  bio?: string;
  preferences?: UserPreferences;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileStats {
  activeProjects: number;
  completedProjects: number;
  completedTasks: number;
  totalTasks: number;
  totalTimeSpent: number;
  totalTimeSpentHours: number;
  averageTaskCompletion: number;
  recentTasks: number;
  recentCompletedTasks: number;
  recentCompletionRate: number;
}

/**
 * Profile API Client
 * Gestion du profil utilisateur
 */
class ProfileAPI {
  /**
   * Récupère le profil de l'utilisateur connecté
   */
  async getMyProfile(): Promise<ProfileData> {
    const response = await api.get('/profile');
    return response.data;
  }

  /**
   * Met à jour le profil de l'utilisateur connecté
   */
  async updateProfile(data: UpdateProfileRequest): Promise<ProfileData> {
    const response = await api.put('/profile', data);
    return response.data;
  }

  /**
   * Change le mot de passe de l'utilisateur
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await api.post('/profile/password', data);
    return response.data;
  }

  /**
   * Upload un avatar
   */
  async uploadAvatar(file: File): Promise<ProfileData> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Supprime l'avatar de l'utilisateur
   */
  async deleteAvatar(): Promise<ProfileData> {
    const response = await api.delete('/profile/avatar');
    return response.data;
  }

  /**
   * Récupère les statistiques du profil utilisateur
   */
  async getProfileStats(): Promise<ProfileStats> {
    const response = await api.get('/profile/stats');
    return response.data;
  }
}

export const profileAPI = new ProfileAPI();
