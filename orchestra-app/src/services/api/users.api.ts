import { apiClient, PaginatedResponse } from './client';
import { User, UserRole } from '../../types';

/**
 * DTO pour créer un utilisateur
 */
export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  departmentId?: string;
}

/**
 * DTO pour mettre à jour un utilisateur
 */
export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  departmentId?: string;
  isActive?: boolean;
}

/**
 * Paramètres de requête pour filtrer les utilisateurs
 */
export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  departmentId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Statistiques utilisateur
 */
export interface UserStats {
  totalTasks: number;
  completedTasks: number;
  totalProjects: number;
  managedProjects: number;
  totalLeaves: number;
}

/**
 * Service API pour la gestion des utilisateurs
 *
 * Routes backend correspondantes:
 * - GET /users
 * - GET /users/:id
 * - GET /users/:id/stats
 * - POST /users
 * - PATCH /users/:id
 * - DELETE /users/:id
 * - POST /users/change-password
 */
export class UsersAPI {
  /**
   * Récupérer la liste des utilisateurs (paginée)
   */
  async getUsers(params?: UsersQueryParams): Promise<PaginatedResponse<User>> {
    try {
      return await apiClient.get<PaginatedResponse<User>>('/users', { params });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer un utilisateur par son ID
   */
  async getUser(id: string): Promise<User> {
    try {
      return await apiClient.get<User>(`/users/${id}`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les statistiques d'un utilisateur
   */
  async getUserStats(id: string): Promise<UserStats> {
    try {
      return await apiClient.get<UserStats>(`/users/${id}/stats`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Créer un nouvel utilisateur (ADMIN uniquement)
   */
  async createUser(data: CreateUserDto): Promise<User> {
    try {
      return await apiClient.post<User>('/users', data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    try {
      return await apiClient.patch<User>(`/users/${id}`, data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Supprimer un utilisateur (soft delete)
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Supprimer définitivement un utilisateur (hard delete)
   * À utiliser avec précaution !
   */
  async hardDeleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}/permanent`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Changer le mot de passe de l'utilisateur connecté
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/users/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur (Admin uniquement)
   * Permet à un admin de changer le password sans connaître l'ancien
   */
  async adminResetPassword(userId: string, newPassword: string): Promise<{ message: string; userId: string; email: string }> {
    try {
      // apiClient.post() retourne DÉJÀ response.data (voir client.ts ligne 204-207)
      const result = await apiClient.post('/users/admin-reset-password', {
        userId,
        newPassword,
      });
      return result;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Rechercher des utilisateurs par nom/email
   */
  async searchUsers(query: string, limit = 10): Promise<User[]> {
    try {
      const response = await this.getUsers({
        search: query,
        limit,
        isActive: true,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les utilisateurs d'un département
   */
  async getUsersByDepartment(departmentId: string): Promise<User[]> {
    try {
      const response = await this.getUsers({
        departmentId,
        isActive: true,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les utilisateurs par rôle
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const response = await this.getUsers({
        role,
        isActive: true,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Gérer les erreurs de manière standardisée
   */
  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || error.response.statusText;
      const statusCode = error.response.status;

      switch (statusCode) {
        case 400:
          return new Error(`Données invalides: ${message}`);
        case 401:
          return new Error('Non authentifié');
        case 403:
          return new Error('Accès refusé: permissions insuffisantes');
        case 404:
          return new Error('Utilisateur non trouvé');
        case 409:
          return new Error('Cet email est déjà utilisé');
        default:
          return new Error(message || 'Une erreur est survenue');
      }
    }
    return new Error('Erreur réseau. Vérifiez votre connexion.');
  }
}

/**
 * Instance globale de l'API Users
 */
export const usersAPI = new UsersAPI();
