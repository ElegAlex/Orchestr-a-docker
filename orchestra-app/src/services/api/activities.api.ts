import { apiClient, PaginatedResponse } from './client';

/**
 * Interface pour une activité (log système)
 */
export interface Activity {
  id: string;
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  projectId?: string;
  taskId?: string;
  status: 'success' | 'error';
  error?: string;
  duration?: number;
  metadata?: any;
  createdAt: string;

  // Relations
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * DTO pour créer une activité
 */
export interface CreateActivityDto {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  projectId?: string;
  taskId?: string;
  status: 'success' | 'error';
  error?: string;
  duration?: number;
  metadata?: any;
}

/**
 * Paramètres de requête pour filtrer les activités
 */
export interface ActivitiesQueryParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  projectId?: string;
  taskId?: string;
  status?: 'success' | 'error';
  startDate?: string;
  endDate?: string;
}

/**
 * Statistiques globales d'activité
 */
export interface ActivityStats {
  totalActivities: number;
  successCount: number;
  errorCount: number;
  activityByAction: Record<string, number>;
  activityByResource: Record<string, number>;
  activityByUser: Array<{
    userId: string;
    userName: string;
    count: number;
  }>;
  averageDuration?: number;
}

/**
 * Client API pour gérer les activités (logs système)
 */
class ActivitiesAPI {
  /**
   * Récupérer toutes les activités avec filtres et pagination
   */
  async getAll(params?: ActivitiesQueryParams): Promise<PaginatedResponse<Activity>> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `/activities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<PaginatedResponse<Activity>>(url);
    return response.data;
  }

  /**
   * Récupérer une activité par ID
   */
  async getById(id: string): Promise<Activity> {
    const response = await apiClient.get<Activity>(`/activities/${id}`);
    return response.data;
  }

  /**
   * Créer une nouvelle activité (log)
   */
  async create(data: CreateActivityDto): Promise<Activity> {
    const response = await apiClient.post<Activity>('/activities', data);
    return response.data;
  }

  /**
   * Récupérer les statistiques globales d'activité
   */
  async getStats(): Promise<ActivityStats> {
    const response = await apiClient.get<ActivityStats>('/activities/stats');
    return response.data;
  }

  /**
   * Supprimer une activité par ID
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/activities/${id}`);
  }

  /**
   * Supprimer toutes les activités (action destructive - admin only)
   */
  async deleteAll(): Promise<void> {
    await apiClient.delete('/activities');
  }

  /**
   * Récupérer les activités d'un utilisateur spécifique
   */
  async getByUser(userId: string, params?: Omit<ActivitiesQueryParams, 'userId'>): Promise<PaginatedResponse<Activity>> {
    return this.getAll({ ...params, userId });
  }

  /**
   * Récupérer les activités d'un projet spécifique
   */
  async getByProject(projectId: string, params?: Omit<ActivitiesQueryParams, 'projectId'>): Promise<PaginatedResponse<Activity>> {
    return this.getAll({ ...params, projectId });
  }

  /**
   * Récupérer les activités d'une tâche spécifique
   */
  async getByTask(taskId: string, params?: Omit<ActivitiesQueryParams, 'taskId'>): Promise<PaginatedResponse<Activity>> {
    return this.getAll({ ...params, taskId });
  }

  /**
   * Récupérer les activités par action
   */
  async getByAction(action: string, params?: Omit<ActivitiesQueryParams, 'action'>): Promise<PaginatedResponse<Activity>> {
    return this.getAll({ ...params, action });
  }

  /**
   * Récupérer les activités échouées uniquement
   */
  async getErrors(params?: Omit<ActivitiesQueryParams, 'status'>): Promise<PaginatedResponse<Activity>> {
    return this.getAll({ ...params, status: 'error' });
  }

  /**
   * Récupérer les activités réussies uniquement
   */
  async getSuccessful(params?: Omit<ActivitiesQueryParams, 'status'>): Promise<PaginatedResponse<Activity>> {
    return this.getAll({ ...params, status: 'success' });
  }
}

// Instance singleton
export const activitiesAPI = new ActivitiesAPI();
