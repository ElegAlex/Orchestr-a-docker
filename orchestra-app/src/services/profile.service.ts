import { profileAPI, ProfileData, UpdateProfileRequest, ChangePasswordRequest, ProfileStats } from './api/profile.api';

/**
 * Profile Service
 * Service métier pour la gestion du profil utilisateur
 * Migration: Firebase Firestore → REST API
 */
class ProfileService {
  /**
   * Récupère le profil de l'utilisateur connecté
   */
  async getMyProfile(): Promise<ProfileData> {
    return await profileAPI.getMyProfile();
  }

  /**
   * Met à jour les informations du profil utilisateur
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<ProfileData> {
    return await profileAPI.updateProfile(profileData);
  }

  /**
   * Change le mot de passe de l'utilisateur
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<{ message: string }> {
    return await profileAPI.changePassword(passwordData);
  }

  /**
   * Upload un avatar personnalisé
   */
  async uploadAvatar(file: File): Promise<string> {
    // Valider le fichier avant upload
    const validation = this.validateAvatarFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Redimensionner l'image avant upload (optionnel)
    const resizedFile = await this.resizeImage(file);

    // Upload via l'API
    const updatedProfile = await profileAPI.uploadAvatar(resizedFile);

    return updatedProfile.avatarUrl || '';
  }

  /**
   * Supprime l'avatar actuel
   */
  async deleteAvatar(): Promise<void> {
    await profileAPI.deleteAvatar();
  }

  /**
   * Met à jour les préférences utilisateur
   */
  async updatePreferences(preferences: UpdateProfileRequest['preferences']): Promise<ProfileData> {
    return await profileAPI.updateProfile({ preferences });
  }

  /**
   * Récupère les statistiques du profil utilisateur
   */
  async getProfileStats(): Promise<ProfileStats> {
    return await profileAPI.getProfileStats();
  }

  /**
   * Valide un fichier d'avatar
   */
  validateAvatarFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Format non supporté. Utilisez JPG, PNG ou WebP.',
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "L'image ne doit pas dépasser 5MB.",
      };
    }

    return { isValid: true };
  }

  /**
   * Redimensionne une image avant upload
   */
  async resizeImage(file: File, maxWidth: number = 400, maxHeight: number = 400): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculer les nouvelles dimensions
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Redimensionner sur le canvas
        canvas.width = width;
        canvas.height = height;
        ctx!.drawImage(img, 0, 0, width, height);

        // Convertir en blob puis en File
        canvas.toBlob(
          (blob) => {
            const resizedFile = new File([blob!], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          },
          file.type,
          0.9,
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

export const profileService = new ProfileService();
export type { ProfileData, UpdateProfileRequest, ChangePasswordRequest, ProfileStats };
