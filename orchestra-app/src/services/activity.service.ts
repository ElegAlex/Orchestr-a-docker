/**
 * Service Activity - Gestion des logs d'activité système
 *
 * Migré vers REST API - 16 octobre 2025
 * Backend: NestJS /activities endpoints
 */

import {
  activitiesAPI,
  Activity,
  CreateActivityDto,
  ActivitiesQueryParams,
  ActivityStats
} from './api/activities.api';

/**
 * Service pour gérer les activités (logs système)
 */
class ActivityService {
  /**
   * Récupérer toutes les activités avec filtres
   */
  async getAll(params?: ActivitiesQueryParams): Promise<Activity[]> {
    const response = await activitiesAPI.getAll(params);
    return response.data || response as any; // Handle both paginated and array responses
  }

  /**
   * Récupérer une activité par ID
   */
  async getById(id: string): Promise<Activity> {
    return await activitiesAPI.getById(id);
  }

  /**
   * Créer une nouvelle activité (log)
   */
  async create(data: CreateActivityDto): Promise<Activity> {
    return await activitiesAPI.create(data);
  }

  /**
   * Récupérer les statistiques globales
   */
  async getStats(): Promise<ActivityStats> {
    return await activitiesAPI.getStats();
  }

  /**
   * Supprimer une activité
   */
  async delete(id: string): Promise<void> {
    await activitiesAPI.delete(id);
  }

  /**
   * Supprimer toutes les activités (admin only)
   */
  async deleteAll(): Promise<void> {
    await activitiesAPI.deleteAll();
  }

  /**
   * Récupérer les activités d'un utilisateur
   */
  async getUserActivities(userId: string, page: number = 1, limit: number = 50): Promise<Activity[]> {
    const response = await activitiesAPI.getByUser(userId, { page, limit });
    return response.data || response as any;
  }

  /**
   * Récupérer les activités d'un projet
   */
  async getProjectActivities(projectId: string, page: number = 1, limit: number = 50): Promise<Activity[]> {
    const response = await activitiesAPI.getByProject(projectId, { page, limit });
    return response.data || response as any;
  }

  /**
   * Récupérer les activités d'une tâche
   */
  async getTaskActivities(taskId: string, page: number = 1, limit: number = 50): Promise<Activity[]> {
    const response = await activitiesAPI.getByTask(taskId, { page, limit });
    return response.data || response as any;
  }

  /**
   * Récupérer les activités par type d'action
   */
  async getByAction(action: string, page: number = 1, limit: number = 50): Promise<Activity[]> {
    const response = await activitiesAPI.getByAction(action, { page, limit });
    return response.data || response as any;
  }

  /**
   * Récupérer uniquement les activités échouées
   */
  async getErrors(page: number = 1, limit: number = 50): Promise<Activity[]> {
    const response = await activitiesAPI.getErrors({ page, limit });
    return response.data || response as any;
  }

  /**
   * Récupérer uniquement les activités réussies
   */
  async getSuccessful(page: number = 1, limit: number = 50): Promise<Activity[]> {
    const response = await activitiesAPI.getSuccessful({ page, limit });
    return response.data || response as any;
  }

  /**
   * Logger une action système (helper)
   */
  async logAction(params: {
    action: string;
    resource?: string;
    resourceId?: string;
    projectId?: string;
    taskId?: string;
    userId?: string;
    metadata?: any;
  }): Promise<Activity> {
    return await this.create({
      ...params,
      status: 'success',
    });
  }

  /**
   * Logger une erreur système (helper)
   */
  async logError(params: {
    action: string;
    error: string;
    resource?: string;
    resourceId?: string;
    projectId?: string;
    taskId?: string;
    userId?: string;
    metadata?: any;
  }): Promise<Activity> {
    return await this.create({
      ...params,
      status: 'error',
    });
  }

  /**
   * Récupérer les activités récentes (dernières 24h)
   */
  async getRecent(limit: number = 20): Promise<Activity[]> {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const response = await activitiesAPI.getAll({
      startDate,
      endDate,
      limit,
      page: 1
    });

    return response.data || response as any;
  }
}

// Instance singleton
export const activityService = new ActivityService();
export default activityService;
