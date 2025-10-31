import { User, UserRole } from '../types';
import { usersAPI } from './api';

export interface CreateUserRequest {
  login: string;  // Login unique (nom_prenom)
  password: string; // Mot de passe
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  service?: string;
  displayName?: string;
}

/**
 * AdminUserCreationService - Migré de Firebase vers API REST
 *
 * Ce service gère la création d'utilisateurs par les admins
 * avec login/password personnalisés.
 */
export class AdminUserCreationService {

  /**
   * Vérifie si un login est disponible
   */
  async isLoginAvailable(login: string): Promise<boolean> {
    try {
      // Appeler l'API backend pour vérifier la disponibilité
      // Pour l'instant, retourner true (le backend fera la validation)
      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification du login:', error);
      return false;
    }
  }

  /**
   * Crée un nouvel utilisateur avec login/password
   * Seuls les admins peuvent utiliser cette méthode
   */
  async createUserWithLogin(request: CreateUserRequest, createdByAdminId: string, adminPassword?: string): Promise<User> {
    // Validation du login (format nom_prenom)
    if (!this.validateLoginFormat(request.login)) {
      throw new Error('Le login doit être au format "nom_prenom" (lettres, chiffres et underscore uniquement).');
    }

    try {
      // Créer l'utilisateur via l'API REST
      const createDto: any = {
        email: `${request.login}@temp.local`, // Email temporaire basé sur le login
        password: request.password,
        firstName: request.firstName,
        lastName: request.lastName,
        role: request.role,
      };

      // Ajouter departmentId seulement s'il est fourni et valide (non vide)
      if (request.department && request.department.trim().length > 0) {
        createDto.departmentId = request.department;
      }

      const newUser = await usersAPI.createUser(createDto);

      return newUser;

    } catch (error: any) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);

      // Gérer les erreurs spécifiques
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('already exists')) {
          throw new Error(`Le login "${request.login}" est déjà utilisé.`);
        }
        throw new Error(error.response.data.message);
      }

      throw new Error(error.message || 'Erreur lors de la création de l\'utilisateur');
    }
  }

  /**
   * Valide le format du login (nom_prenom)
   */
  private validateLoginFormat(login: string): boolean {
    // Format: lettres, chiffres et underscore uniquement
    const loginRegex = /^[a-zA-Z0-9_]+$/;
    return loginRegex.test(login) && login.length >= 3;
  }

  /**
   * Valide que l'admin connecté a les permissions nécessaires
   * Note: La validation des permissions est maintenant faite côté backend
   */
  private async validateAdminPermissions(adminId: string): Promise<void> {
    // La validation est maintenant faite côté backend via les guards
    // On ne fait rien ici, juste pour compatibilité
    return Promise.resolve();
  }

  /**
   * Liste tous les utilisateurs (pour les admins)
   */
  async listAllUsers(): Promise<User[]> {
    try {
      return await usersAPI.getAllUsers();
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return [];
    }
  }
}

// Export une instance singleton
export const adminUserCreationService = new AdminUserCreationService();
