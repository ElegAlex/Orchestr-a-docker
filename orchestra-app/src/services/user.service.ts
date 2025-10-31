import { usersAPI } from './api';
import type { User, UserRole, Skill } from '../types';

/**
 * UserService - Wrapper autour de usersAPI pour compatibilité avec le code existant
 *
 * Cette classe maintient la même interface que l'ancien service Firebase
 * mais utilise l'API REST backend en interne.
 *
 * Note: Fichier Firebase original sauvegardé dans user.service.ts.firebase-backup
 */

const COLLECTION_NAME = 'users'; // Conservé pour compatibilité avec les logs

export class UserService {
  /**
   * Créer un nouvel utilisateur
   */
  async createUser(user: Partial<User> & { email: string; password?: string }): Promise<User> {
    try {
      const createDto = {
        email: user.email,
        password: user.password || 'TempPass123!', // Password temporaire si non fourni
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
        departmentId: user.departmentId,
      };

      return await usersAPI.createUser(createDto);
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Supprimer un utilisateur (soft delete)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await usersAPI.deleteUser(userId);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Soft delete d'un utilisateur
   */
  async softDeleteUser(userId: string): Promise<void> {
    try {
      await usersAPI.deleteUser(userId);
    } catch (error: any) {
      console.error('Error soft deleting user:', error);
      throw error;
    }
  }

  /**
   * Supprimer définitivement un utilisateur (hard delete)
   * À utiliser avec précaution !
   */
  async hardDeleteUser(userId: string): Promise<void> {
    try {
      await usersAPI.hardDeleteUser(userId);
    } catch (error: any) {
      console.error('Error hard deleting user:', error);
      throw error;
    }
  }

  /**
   * Récupérer les dépendances d'un utilisateur (stats)
   */
  async getUserDependencies(userId: string): Promise<{
    projects: number;
    tasks: number;
    leaves: number;
    contracts: number;
  }> {
    try {
      const stats = await usersAPI.getUserStats(userId);

      return {
        projects: stats.totalProjects,
        tasks: stats.totalTasks,
        leaves: stats.totalLeaves,
        contracts: 0, // Non supporté par le backend actuellement
      };
    } catch (error: any) {
      console.error('Error getting user dependencies:', error);
      return {
        projects: 0,
        tasks: 0,
        leaves: 0,
        contracts: 0,
      };
    }
  }

  /**
   * Récupérer un utilisateur par son ID
   */
  async getUser(id: string): Promise<User | null> {
    try {
      return await usersAPI.getUser(id);
    } catch (error: any) {
      if (error.message?.includes('non trouvé') || error.message?.includes('404')) {
        return null;
      }
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const updateDto = {
        email: updates.email,
        firstName: updates.firstName,
        lastName: updates.lastName,
        role: updates.role,
        departmentId: updates.departmentId,
        isActive: updates.isActive,
      };

      // Filtrer les undefined
      const filteredUpdates = Object.fromEntries(
        Object.entries(updateDto).filter(([_, v]) => v !== undefined)
      );

      return await usersAPI.updateUser(id, filteredUpdates);
    } catch (error: any) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les utilisateurs
   * @param departmentId Filtre optionnel par département (null = tous les départements, string = département spécifique)
   */
  async getAllUsers(departmentId?: string | null): Promise<User[]> {
    try {
      const response = await usersAPI.getUsers({
        limit: 100, // Backend max limit
        departmentId: departmentId ?? undefined, // null devient undefined pour ne pas envoyer le paramètre
      });

      return response.data.sort((a, b) => {
        const nameA = a.displayName || `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Sans nom';
        const nameB = b.displayName || `${b.firstName || ''} ${b.lastName || ''}`.trim() || 'Sans nom';
        return nameA.localeCompare(nameB);
      });
    } catch (error: any) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  /**
   * Récupérer les utilisateurs actifs
   */
  async getActiveUsers(): Promise<User[]> {
    try {
      const response = await usersAPI.getUsers({
        isActive: true,
        limit: 100,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting active users:', error);
      return [];
    }
  }

  /**
   * Récupérer tous les utilisateurs pour la gestion des ressources
   */
  async getAllUsersForResources(): Promise<User[]> {
    return this.getActiveUsers();
  }

  /**
   * Récupérer les utilisateurs par rôle
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      return await usersAPI.getUsersByRole(role);
    } catch (error: any) {
      console.error('Error getting users by role:', error);
      return [];
    }
  }

  /**
   * Récupérer les utilisateurs par département
   */
  async getUsersByDepartment(departmentId: string): Promise<User[]> {
    try {
      return await usersAPI.getUsersByDepartment(departmentId);
    } catch (error: any) {
      console.error('Error getting users by department:', error);
      return [];
    }
  }

  /**
   * Rechercher des utilisateurs
   */
  async searchUsers(
    searchTerm: string,
    filters?: {
      role?: UserRole;
      departmentId?: string;
      isActive?: boolean;
    }
  ): Promise<User[]> {
    try {
      return await usersAPI.searchUsers(searchTerm, 50);
    } catch (error: any) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Mettre à jour le rôle d'un utilisateur
   */
  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    try {
      return await usersAPI.updateUser(userId, { role });
    } catch (error: any) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour la disponibilité d'un utilisateur
   * NOTE: Non supporté par le backend, retourne l'utilisateur inchangé
   */
  async updateUserAvailability(userId: string, availability: number): Promise<User> {
    console.warn('updateUserAvailability: Feature not yet supported by backend API');
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    // TODO: Implémenter quand le backend supportera ce champ
    return user;
  }

  /**
   * Ajouter une compétence à un utilisateur
   * NOTE: Non supporté par le backend, retourne l'utilisateur inchangé
   */
  async addSkill(userId: string, skill: Skill): Promise<User> {
    console.warn('addSkill: Feature not yet supported by backend API');
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    // TODO: Implémenter quand le backend supportera les skills
    return user;
  }

  /**
   * Retirer une compétence d'un utilisateur
   * NOTE: Non supporté par le backend, retourne l'utilisateur inchangé
   */
  async removeSkill(userId: string, skillName: string): Promise<User> {
    console.warn('removeSkill: Feature not yet supported by backend API');
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    // TODO: Implémenter quand le backend supportera les skills
    return user;
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateUserProfile(
    userId: string,
    profileData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      bio?: string;
      avatar?: string;
      skills?: Skill[];
      preferences?: any;
    }
  ): Promise<User> {
    try {
      const updateDto = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
      };

      // Filtrer les undefined
      const filteredUpdates = Object.fromEntries(
        Object.entries(updateDto).filter(([_, v]) => v !== undefined)
      );

      return await usersAPI.updateUser(userId, filteredUpdates);
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Désactiver un utilisateur
   */
  async deactivateUser(userId: string): Promise<User> {
    try {
      return await usersAPI.updateUser(userId, { isActive: false });
    } catch (error: any) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  /**
   * Réactiver un utilisateur
   */
  async reactivateUser(userId: string): Promise<User> {
    try {
      return await usersAPI.updateUser(userId, { isActive: true });
    } catch (error: any) {
      console.error('Error reactivating user:', error);
      throw error;
    }
  }

  /**
   * Récupérer les utilisateurs ayant une compétence spécifique
   * NOTE: Non supporté par le backend, retourne un tableau vide
   */
  async getUsersWithSkill(skillName: string, minLevel?: 1 | 2 | 3): Promise<User[]> {
    console.warn('getUsersWithSkill: Feature not yet supported by backend API');
    // TODO: Implémenter quand le backend supportera les skills
    return [];
  }

  /**
   * Changer le mot de passe d'un utilisateur
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await usersAPI.changePassword(currentPassword, newPassword);
    } catch (error: any) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
}

/**
 * Instance globale du service utilisateur
 */
export const userService = new UserService();
