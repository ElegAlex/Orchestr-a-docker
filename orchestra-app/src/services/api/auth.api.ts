import { apiClient } from './client';
import { User, UserRole } from '../../types';

/**
 * DTO pour l'inscription
 */
export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

/**
 * DTO pour la connexion
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Réponse d'authentification (login/register)
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * DTO pour le changement de mot de passe
 */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/**
 * Service API pour l'authentification JWT (remplace Firebase Auth)
 *
 * Routes backend correspondantes:
 * - POST /auth/register
 * - POST /auth/login
 * - POST /auth/logout
 * - POST /auth/refresh
 * - GET /auth/me
 * - POST /auth/forgot-password
 * - POST /auth/reset-password
 */
export class AuthAPI {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);

      // Stocker les tokens
      apiClient.setAccessToken(response.accessToken);
      apiClient.setRefreshToken(response.refreshToken);

      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Connexion avec email et mot de passe
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      // Stocker les tokens
      apiClient.setAccessToken(response.accessToken);
      apiClient.setRefreshToken(response.refreshToken);

      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  async getProfile(): Promise<User> {
    try {
      const user = await apiClient.get<User>('/auth/me');
      return user;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continuer même en cas d'erreur (token déjà expiré, etc.)
      console.warn('Logout error (non-blocking):', error);
    } finally {
      // Toujours supprimer les tokens localement
      apiClient.clearTokens();
    }
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response = await apiClient.post<{ accessToken: string; refreshToken: string }>(
        '/auth/refresh',
        { refreshToken }
      );

      // Mettre à jour les tokens
      apiClient.setAccessToken(response.accessToken);
      if (response.refreshToken) {
        apiClient.setRefreshToken(response.refreshToken);
      }

      return response;
    } catch (error: any) {
      // En cas d'échec, supprimer les tokens
      apiClient.clearTokens();
      throw this.handleError(error);
    }
  }

  /**
   * Demander un email de réinitialisation de mot de passe
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Réinitialiser le mot de passe avec un token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword,
      });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    const token = apiClient.getAccessToken();
    if (!token) {
      return false;
    }

    // Optionnel: vérifier si le token n'est pas expiré
    try {
      const payload = this.decodeJWT(token);
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  /**
   * Décoder un JWT (sans vérifier la signature)
   */
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }

  /**
   * Gérer les erreurs de manière standardisée
   */
  private handleError(error: any): Error {
    if (error.response) {
      // Erreur HTTP du backend
      const message = error.response.data?.message || error.response.statusText;
      const statusCode = error.response.status;

      switch (statusCode) {
        case 400:
          return new Error(`Données invalides: ${message}`);
        case 401:
          return new Error('Email ou mot de passe incorrect');
        case 403:
          return new Error('Accès refusé');
        case 404:
          return new Error('Utilisateur non trouvé');
        case 409:
          return new Error('Cet email est déjà utilisé');
        case 500:
          return new Error('Erreur serveur. Veuillez réessayer plus tard.');
        default:
          return new Error(message || 'Une erreur est survenue');
      }
    } else if (error.request) {
      // Pas de réponse du serveur
      return new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } else {
      // Autre erreur
      return new Error(error.message || 'Une erreur est survenue');
    }
  }
}

/**
 * Instance globale de l'API Auth
 */
export const authAPI = new AuthAPI();
