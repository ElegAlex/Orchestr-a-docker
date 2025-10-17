import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

/**
 * Configuration de l'API Client
 */
interface APIClientConfig {
  baseURL?: string;
  timeout?: number;
}

/**
 * Client API centralisé pour toutes les requêtes HTTP vers le backend NestJS
 *
 * Features:
 * - Gestion automatique des tokens JWT (access + refresh)
 * - Interception des requêtes pour ajouter Authorization header
 * - Interception des réponses pour gérer le refresh token automatique
 * - Gestion des erreurs standardisée
 */
export class APIClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(config?: APIClientConfig) {
    this.client = axios.create({
      baseURL: config?.baseURL || process.env.REACT_APP_API_URL || 'http://localhost:3000',
      timeout: config?.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Configuration des intercepteurs Axios
   */
  private setupInterceptors(): void {
    // Request Interceptor: Ajouter le token JWT à chaque requête
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response Interceptor: Gérer les erreurs et le refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Si erreur 401 (Unauthorized) et pas déjà en retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Un refresh est déjà en cours, attendre qu'il se termine
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Essayer de rafraîchir le token
            const newAccessToken = await this.refreshAccessToken();

            // Notifier tous les subscribers en attente
            this.refreshSubscribers.forEach((callback) => callback(newAccessToken));
            this.refreshSubscribers = [];

            // Réessayer la requête originale avec le nouveau token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Échec du refresh, déconnecter l'utilisateur
            this.handleAuthError();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Rafraîchir le access token en utilisant le refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        `${this.client.defaults.baseURL}/auth/refresh`,
        { refreshToken }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Stocker les nouveaux tokens
      this.setAccessToken(accessToken);
      if (newRefreshToken) {
        this.setRefreshToken(newRefreshToken);
      }

      return accessToken;
    } catch (error) {
      // Supprimer les tokens invalides
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Gérer les erreurs d'authentification (déconnexion)
   */
  private handleAuthError(): void {
    this.clearTokens();

    // Rediriger vers la page de login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  /**
   * Token Management
   */
  public getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  public setAccessToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  public setRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  }

  public clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  /**
   * HTTP Methods
   */
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * Méthode pour uploader des fichiers (multipart/form-data)
   */
  public async uploadFile<T = any>(
    url: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Obtenir l'instance Axios brute si nécessaire
   */
  public getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

/**
 * Instance globale du client API
 */
export const apiClient = new APIClient();

/**
 * Export par défaut pour faciliter les imports
 */
export default apiClient;

/**
 * Types pour les réponses paginées
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Types pour les erreurs API
 */
export interface APIError {
  message: string;
  statusCode: number;
  error?: string;
}
