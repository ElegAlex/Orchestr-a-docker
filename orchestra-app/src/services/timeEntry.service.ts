import { timeEntriesAPI } from './api';
import type {
  TimeEntry,
  TimeEntryType,
  CreateTimeEntryRequest,
  UpdateTimeEntryRequest,
  TimeEntryStats,
  ProjectTimeEntryStats,
} from './api';

/**
 * Service Time Entries (REST API)
 * Gestion des saisies de temps
 */
class TimeEntryService {
  /**
   * Créer une nouvelle saisie de temps
   */
  async create(data: CreateTimeEntryRequest): Promise<TimeEntry> {
    return await timeEntriesAPI.create(data);
  }

  /**
   * Récupérer toutes les time entries avec filtres
   */
  async getAll(params?: {
    projectId?: string;
    taskId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    return await timeEntriesAPI.getAll(params);
  }

  /**
   * Récupérer une time entry par ID
   */
  async getById(id: string): Promise<TimeEntry> {
    return await timeEntriesAPI.getById(id);
  }

  /**
   * Récupérer les time entries d'un projet
   */
  async getByProject(projectId: string, startDate?: string, endDate?: string) {
    return await timeEntriesAPI.getAll({ projectId, startDate, endDate });
  }

  /**
   * Récupérer les time entries d'une tâche
   */
  async getByTask(taskId: string) {
    return await timeEntriesAPI.getAll({ taskId });
  }

  /**
   * Récupérer les time entries de l'utilisateur connecté
   */
  async getUserEntries(startDate?: string, endDate?: string) {
    return await timeEntriesAPI.getAll({ startDate, endDate });
  }

  /**
   * Récupérer les statistiques de l'utilisateur
   */
  async getStats(startDate?: string, endDate?: string): Promise<TimeEntryStats> {
    return await timeEntriesAPI.getStats(startDate, endDate);
  }

  /**
   * Récupérer les statistiques d'un projet
   */
  async getProjectStats(
    projectId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ProjectTimeEntryStats> {
    return await timeEntriesAPI.getProjectStats(projectId, startDate, endDate);
  }

  /**
   * Mettre à jour une time entry
   */
  async update(id: string, data: UpdateTimeEntryRequest): Promise<TimeEntry> {
    return await timeEntriesAPI.update(id, data);
  }

  /**
   * Supprimer une time entry
   */
  async delete(id: string): Promise<void> {
    return await timeEntriesAPI.delete(id);
  }

  /**
   * Créer une saisie de temps rapide pour une tâche
   */
  async quickCreate(params: {
    taskId: string;
    duration: number; // minutes
    date?: string; // ISO date, défaut = aujourd'hui
    description?: string;
  }): Promise<TimeEntry> {
    const data: CreateTimeEntryRequest = {
      taskId: params.taskId,
      duration: params.duration,
      date: params.date || new Date().toISOString().split('T')[0],
      description: params.description,
      type: 'TASK',
      isBillable: true,
    };

    return await this.create(data);
  }

  /**
   * Formater la durée (minutes → heures:minutes)
   */
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
  }
}

export const timeEntryService = new TimeEntryService();
export type { TimeEntry, TimeEntryType, TimeEntryStats, ProjectTimeEntryStats };
