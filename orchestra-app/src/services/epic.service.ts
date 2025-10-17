import { epicsAPI } from './api';
import type {
  Epic,
  EpicStatus,
  Priority,
  RiskLevel,
  CreateEpicRequest,
  UpdateEpicRequest,
} from './api';

/**
 * Service Epics (REST API Version)
 * Migré depuis Firebase vers backend REST
 */
class EpicService {
  /**
   * Créer un nouvel Epic
   */
  async createEpic(data: Omit<CreateEpicRequest, 'id'>): Promise<string> {
    const epic = await epicsAPI.create(data as CreateEpicRequest);
    return epic.id;
  }

  /**
   * Récupérer tous les epics (avec pagination)
   */
  async getAllEpics(page: number = 1, limit: number = 50) {
    return await epicsAPI.getAll({ page, limit });
  }

  /**
   * Récupérer les epics d'un projet
   */
  async getProjectEpics(projectId: string): Promise<Epic[]> {
    return await epicsAPI.getByProject(projectId);
  }

  /**
   * Récupérer un epic par ID
   */
  async getEpicById(epicId: string): Promise<Epic> {
    return await epicsAPI.getById(epicId);
  }

  /**
   * Récupérer les tâches d'un epic
   */
  async getEpicTasks(epicId: string): Promise<any[]> {
    return await epicsAPI.getTasks(epicId);
  }

  /**
   * Mettre à jour un epic
   */
  async updateEpic(epicId: string, data: UpdateEpicRequest): Promise<Epic> {
    return await epicsAPI.update(epicId, data);
  }

  /**
   * Mettre à jour le statut d'un epic
   */
  async updateEpicStatus(epicId: string, status: EpicStatus): Promise<Epic> {
    return await epicsAPI.updateStatus(epicId, status);
  }

  /**
   * Mettre à jour la progression d'un epic
   */
  async updateEpicProgress(epicId: string, progress: number): Promise<Epic> {
    return await epicsAPI.updateProgress(epicId, progress);
  }

  /**
   * Supprimer un epic
   */
  async deleteEpic(epicId: string): Promise<void> {
    return await epicsAPI.delete(epicId);
  }

  /**
   * Ajouter une tâche à un epic
   */
  async addTaskToEpic(epicId: string, taskId: string): Promise<Epic> {
    const epic = await this.getEpicById(epicId);
    const taskIds = [...(epic.taskIds || []), taskId];
    return await this.updateEpic(epicId, { taskIds });
  }

  /**
   * Retirer une tâche d'un epic
   */
  async removeTaskFromEpic(epicId: string, taskId: string): Promise<Epic> {
    const epic = await this.getEpicById(epicId);
    const taskIds = (epic.taskIds || []).filter(id => id !== taskId);
    return await this.updateEpic(epicId, { taskIds });
  }
}

export const epicService = new EpicService();
export type { Epic, EpicStatus, Priority, RiskLevel };
