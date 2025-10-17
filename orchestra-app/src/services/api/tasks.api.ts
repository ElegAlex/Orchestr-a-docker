import { apiClient, PaginatedResponse } from './client';

/**
 * Types pour les tâches (alignés avec le backend)
 */
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  creatorId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  dependencies?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO pour créer une tâche
 */
export interface CreateTaskDto {
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string; // ISO 8601 date string
  estimatedHours?: number;
  tags?: string[];
  dependencies?: string[];
}

/**
 * DTO pour mettre à jour une tâche
 */
export interface UpdateTaskDto {
  title?: string;
  description?: string;
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  dependencies?: string[];
}

/**
 * Paramètres de requête pour filtrer les tâches
 */
export interface TasksQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  projectId?: string;
  assigneeId?: string;
  creatorId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Commentaire sur une tâche
 */
export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service API pour la gestion des tâches
 *
 * Routes backend correspondantes:
 * - GET /tasks
 * - GET /tasks/:id
 * - POST /tasks
 * - PATCH /tasks/:id
 * - DELETE /tasks/:id
 * - PATCH /tasks/:id/status
 * - PATCH /tasks/:id/assign
 * - GET /tasks/:id/comments (si implémenté)
 * - POST /tasks/:id/comments (si implémenté)
 */
export class TasksAPI {
  /**
   * Récupérer la liste des tâches (paginée)
   */
  async getTasks(params?: TasksQueryParams): Promise<PaginatedResponse<Task>> {
    try {
      return await apiClient.get<PaginatedResponse<Task>>('/tasks', { params });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer une tâche par son ID
   */
  async getTask(id: string): Promise<Task> {
    try {
      return await apiClient.get<Task>(`/tasks/${id}`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Créer une nouvelle tâche
   */
  async createTask(data: CreateTaskDto): Promise<Task> {
    try {
      return await apiClient.post<Task>('/tasks', data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Mettre à jour une tâche
   */
  async updateTask(id: string, data: UpdateTaskDto): Promise<Task> {
    try {
      return await apiClient.patch<Task>(`/tasks/${id}`, data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Supprimer une tâche
   */
  async deleteTask(id: string): Promise<void> {
    try {
      await apiClient.delete(`/tasks/${id}`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Changer le statut d'une tâche
   */
  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    try {
      return await apiClient.patch<Task>(`/tasks/${id}/status`, { status });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Assigner une tâche à un utilisateur
   */
  async assignTask(id: string, assigneeId: string): Promise<Task> {
    try {
      return await apiClient.patch<Task>(`/tasks/${id}/assign`, { assigneeId });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Désassigner une tâche
   */
  async unassignTask(id: string): Promise<Task> {
    try {
      return await apiClient.patch<Task>(`/tasks/${id}/assign`, { assigneeId: null });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les tâches d'un projet
   */
  async getProjectTasks(projectId: string): Promise<Task[]> {
    try {
      const response = await this.getTasks({
        projectId,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les tâches assignées à un utilisateur
   */
  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      const response = await this.getTasks({
        assigneeId: userId,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les tâches par statut
   */
  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    try {
      const response = await this.getTasks({
        status,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les tâches en retard (dueDate dépassée, status !== DONE)
   */
  async getOverdueTasks(userId?: string): Promise<Task[]> {
    try {
      const params: TasksQueryParams = {
        sortBy: 'dueDate',
        sortOrder: 'asc',
      };

      if (userId) {
        params.assigneeId = userId;
      }

      const response = await this.getTasks(params);

      // Filtrer côté client les tâches en retard
      const now = new Date();
      return response.data.filter(
        (task) =>
          task.dueDate &&
          new Date(task.dueDate) < now &&
          task.status !== 'DONE'
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Rechercher des tâches par titre
   */
  async searchTasks(query: string, limit = 10): Promise<Task[]> {
    try {
      const response = await this.getTasks({
        search: query,
        limit,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les tâches avec une priorité donnée
   */
  async getTasksByPriority(priority: TaskPriority): Promise<Task[]> {
    try {
      const response = await this.getTasks({
        priority,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Marquer une tâche comme terminée
   */
  async completeTask(id: string): Promise<Task> {
    try {
      return await this.updateTaskStatus(id, 'DONE');
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Débloquer une tâche
   */
  async unblockTask(id: string): Promise<Task> {
    try {
      return await this.updateTaskStatus(id, 'TODO');
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les commentaires d'une tâche (si implémenté)
   */
  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    try {
      return await apiClient.get<TaskComment[]>(`/tasks/${taskId}/comments`);
    } catch (error: any) {
      // Si la route n'existe pas encore, retourner un tableau vide
      if (error.response?.status === 404) {
        return [];
      }
      throw this.handleError(error);
    }
  }

  /**
   * Ajouter un commentaire à une tâche (si implémenté)
   */
  async addTaskComment(taskId: string, content: string): Promise<TaskComment> {
    try {
      return await apiClient.post<TaskComment>(`/tasks/${taskId}/comments`, {
        content,
      });
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
          return new Error('Tâche non trouvée');
        case 409:
          return new Error('Conflit: ' + message);
        default:
          return new Error(message || 'Une erreur est survenue');
      }
    }
    return new Error('Erreur réseau. Vérifiez votre connexion.');
  }
}

/**
 * Instance globale de l'API Tasks
 */
export const tasksAPI = new TasksAPI();
