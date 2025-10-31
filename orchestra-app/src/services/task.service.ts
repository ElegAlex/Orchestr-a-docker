import { tasksAPI } from './api';
import type { TaskStatus as APITaskStatus, TaskPriority as APITaskPriority, Task as APITask } from './api/tasks.api';

// Types élargis pour compatibilité avec l'ancien code Firebase
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskType = 'EPIC' | 'STORY' | 'TASK' | 'BUG' | 'SPIKE';

export interface TaskDependency {
  taskId: string;
  type: 'FS' | 'FF' | 'SF' | 'SS';
  lag?: number;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Interfaces pour compatibilité avec le code existant
export interface Task extends Omit<APITask, 'status' | 'priority' | 'dependencies' | 'creatorId' | 'description'> {
  // Override status pour accepter BACKLOG en plus des status API
  status: TaskStatus;
  // Override priority pour accepter P0-P3 en plus des priorités API
  priority: TaskPriority;
  // Override dependencies pour accepter TaskDependency[] ou string[]
  dependencies?: TaskDependency[] | string[];
  // Override description pour la rendre requise (compatibilité)
  description: string;

  // Champs requis de l'ancien Task type
  type?: TaskType;
  labels?: string[];
  attachments?: Attachment[];
  comments?: Comment[];
  createdBy?: string;

  // Champs additionnels du frontend (compatibilité complète)
  code?: string;
  parentId?: string;
  parentTaskId?: string;
  epicId?: string;
  milestoneId?: string;
  blocked?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
  blockedReason?: string;
  progress?: number;
  subtaskCount?: number;
  completedSubtaskCount?: number;

  // Dates additionnelles
  startDate?: Date;
  dueDate?: Date;
  completedDate?: Date;

  // Créneaux horaires
  startTime?: string;
  endTime?: string;

  // Planning & Estimation
  storyPoints?: number;
  estimatedHours?: number;
  remainingHours?: number;
  loggedHours?: number;

  // RACI (compatibilité ancienne version)
  responsible?: string[];
  accountable?: string[];
  consulted?: string[];
  informed?: string[];

  // Index signature pour compatibilité totale avec types/index.ts
  [key: string]: any;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  date: Date;
  hours: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TaskService - Wrapper autour de tasksAPI pour compatibilité avec le code existant
 *
 * Cette classe maintient la même interface que l'ancien service Firebase
 * mais utilise l'API REST backend en interne.
 *
 * Note: Fichier Firebase original sauvegardé dans task.service.ts.firebase-backup
 */

const COLLECTION_NAME = 'tasks'; // Conservé pour compatibilité avec les logs

export class TaskService {
  /**
   * Créer une nouvelle tâche
   */
  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    try {
      const createDto = {
        title: taskData.title,
        description: taskData.description,
        projectId: taskData.projectId,
        assigneeId: taskData.assigneeId,
        status: taskData.status || ('TODO' as TaskStatus),
        priority: taskData.priority || ('MEDIUM' as TaskPriority),
        dueDate: taskData.dueDate?.toISOString?.() || (taskData.dueDate ? new Date(taskData.dueDate).toISOString() : undefined),
        estimatedHours: taskData.estimatedHours,
        tags: taskData.tags || [],
        dependencies: taskData.dependencies || [],
      };

      return await tasksAPI.createTask(createDto);
    } catch (error: any) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Récupérer une tâche par son ID
   */
  async getTask(id: string): Promise<Task | null> {
    try {
      return await tasksAPI.getTask(id);
    } catch (error: any) {
      if (error.message?.includes('non trouvé') || error.message?.includes('404')) {
        return null;
      }
      console.error('Error getting task:', error);
      throw error;
    }
  }

  /**
   * Récupérer toutes les tâches
   */
  async getTasks(): Promise<Task[]> {
    try {
      const response = await tasksAPI.getTasks({
        limit: 100,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  /**
   * Générer un code de tâche unique
   * NOTE: Non supporté par le backend, génère localement
   */
  async generateTaskCode(projectId?: string): Promise<string> {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `TASK-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Générer un code de tâche simple
   * NOTE: Non supporté par le backend, génère localement
   */
  async generateSimpleTaskCode(): Promise<string> {
    return this.generateTaskCode();
  }

  /**
   * Mettre à jour une tâche
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const updateDto: any = {};

      if (updates.title !== undefined) updateDto.title = updates.title;
      if (updates.description !== undefined) updateDto.description = updates.description;
      if (updates.projectId !== undefined) updateDto.projectId = updates.projectId;
      if (updates.assigneeId !== undefined) updateDto.assigneeId = updates.assigneeId;
      if (updates.status !== undefined) updateDto.status = updates.status;
      if (updates.priority !== undefined) updateDto.priority = updates.priority;
      if (updates.estimatedHours !== undefined) updateDto.estimatedHours = updates.estimatedHours;
      if (updates.actualHours !== undefined) updateDto.actualHours = updates.actualHours;
      if (updates.tags !== undefined) updateDto.tags = updates.tags;
      if (updates.dependencies !== undefined) updateDto.dependencies = updates.dependencies;

      // Gérer les dates
      if (updates.dueDate !== undefined) {
        updateDto.dueDate = updates.dueDate?.toISOString?.() || new Date(updates.dueDate).toISOString();
      }
      if (updates.completedAt !== undefined) {
        updateDto.completedAt = updates.completedAt?.toISOString?.() || new Date(updates.completedAt).toISOString();
      }

      return await tasksAPI.updateTask(id, updateDto);
    } catch (error: any) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  /**
   * Supprimer une tâche
   */
  async deleteTask(id: string): Promise<void> {
    try {
      await tasksAPI.deleteTask(id);
    } catch (error: any) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Récupérer les tâches d'un projet
   */
  async getTasksByProject(projectId: string): Promise<Task[]> {
    try {
      return await tasksAPI.getProjectTasks(projectId);
    } catch (error: any) {
      console.error('Error getting tasks by project:', error);
      return [];
    }
  }

  /**
   * Récupérer les tâches assignées à un utilisateur
   */
  async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    try {
      return await tasksAPI.getUserTasks(assigneeId);
    } catch (error: any) {
      console.error('Error getting tasks by assignee:', error);
      return [];
    }
  }

  /**
   * Récupérer les tâches où l'utilisateur est Responsible (RACI)
   * Filtre pour ne garder que les tâches non terminées
   */
  async getMyResponsibleTasks(userId: string): Promise<Task[]> {
    try {
      const allTasks = await this.getTasksByAssignee(userId);
      return allTasks.filter(task => task.status !== 'DONE');
    } catch (error: any) {
      console.error('Error getting responsible tasks:', error);
      return [];
    }
  }

  /**
   * Récupérer les sous-tâches d'une tâche parent
   */
  async getTasksByParentId(parentId: string): Promise<Task[]> {
    try {
      // TODO: Le backend n'a pas de route pour ça, on filtre côté client
      const allTasks = await this.getTasks();
      return allTasks.filter(task =>
        task.parentId === parentId || task.parentTaskId === parentId
      );
    } catch (error: any) {
      console.error('Error getting tasks by parent:', error);
      return [];
    }
  }

  /**
   * Récupérer les tâches dans une plage de dates
   */
  async getTasksByDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    try {
      // TODO: Le backend n'a pas de route spécifique pour ça
      // On récupère toutes les tâches et on filtre côté client
      const allTasks = await this.getTasks();

      return allTasks.filter((task) => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate >= startDate && taskDate <= endDate;
      });
    } catch (error: any) {
      console.error('Error getting tasks by date range:', error);
      return [];
    }
  }

  /**
   * Récupérer les tâches par statut
   */
  async getTasksByStatus(status: TaskStatus, projectId?: string): Promise<Task[]> {
    try {
      const response = await tasksAPI.getTasks({
        status,
        projectId,
        limit: 100,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting tasks by status:', error);
      return [];
    }
  }

  /**
   * Mettre à jour le statut d'une tâche
   */
  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    try {
      return await tasksAPI.updateTaskStatus(id, status);
    } catch (error: any) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  /**
   * Ajouter du temps passé sur une tâche
   */
  async addTimeSpent(id: string, timeInHours: number): Promise<Task> {
    try {
      const task = await this.getTask(id);
      if (!task) {
        throw new Error('Task not found');
      }

      const actualHours = (task.actualHours || 0) + timeInHours;

      return await tasksAPI.updateTask(id, { actualHours });
    } catch (error: any) {
      console.error('Error adding time spent:', error);
      throw error;
    }
  }

  /**
   * Ajouter un commentaire à une tâche
   * NOTE: Non supporté par le backend actuellement
   */
  async addComment(
    taskId: string,
    comment: {
      userId: string;
      content: string;
    }
  ): Promise<Task> {
    console.warn('addComment: Feature not yet supported by backend API');
    // TODO: Implémenter quand le backend supportera les commentaires
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    return task;
  }

  /**
   * Ajouter une pièce jointe à une tâche
   * NOTE: Non supporté par le backend actuellement
   */
  async addAttachment(
    taskId: string,
    attachment: {
      name: string;
      url: string;
      type: string;
      size: number;
      uploadedBy: string;
    }
  ): Promise<Task> {
    console.warn('addAttachment: Feature not yet supported by backend API');
    // TODO: Implémenter quand le backend supportera les attachments
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    return task;
  }

  /**
   * Ajouter une dépendance entre tâches
   */
  async addDependency(
    taskId: string,
    dependency: {
      dependentTaskId: string;
      type: 'blocks' | 'relates_to';
    }
  ): Promise<Task> {
    try {
      const task = await this.getTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const dependencies = task.dependencies || [];
      if (!dependencies.includes(dependency.dependentTaskId)) {
        dependencies.push(dependency.dependentTaskId);
      }

      return await tasksAPI.updateTask(taskId, { dependencies });
    } catch (error: any) {
      console.error('Error adding dependency:', error);
      throw error;
    }
  }

  /**
   * Retirer une dépendance entre tâches
   */
  async removeDependency(taskId: string, dependentTaskId: string): Promise<Task> {
    try {
      const task = await this.getTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const dependencies = (task.dependencies || []).filter((id) => id !== dependentTaskId);

      return await tasksAPI.updateTask(taskId, { dependencies });
    } catch (error: any) {
      console.error('Error removing dependency:', error);
      throw error;
    }
  }

  /**
   * Récupérer les sous-tâches d'une tâche
   * NOTE: Non supporté par le backend actuellement
   */
  async getSubtasks(parentId: string): Promise<Task[]> {
    console.warn('getSubtasks: Feature not yet supported by backend API');
    // TODO: Implémenter quand le backend supportera les subtasks
    return [];
  }

  /**
   * Rechercher des tâches
   */
  async searchTasks(
    searchTerm: string,
    filters?: {
      projectId?: string;
      assigneeId?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
    }
  ): Promise<Task[]> {
    try {
      return await tasksAPI.searchTasks(searchTerm, 50);
    } catch (error: any) {
      console.error('Error searching tasks:', error);
      return [];
    }
  }

  /**
   * Dupliquer une tâche
   */
  async duplicateTask(taskId: string, newTitle?: string): Promise<Task> {
    try {
      const originalTask = await this.getTask(taskId);
      if (!originalTask) {
        throw new Error('Task not found');
      }

      const duplicatedTask = await this.createTask({
        ...originalTask,
        title: newTitle || `${originalTask.title} (copie)`,
        status: 'TODO' as TaskStatus,
        // Réinitialiser certains champs
        completedAt: undefined,
        actualHours: 0,
      });

      return duplicatedTask;
    } catch (error: any) {
      console.error('Error duplicating task:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut de plusieurs tâches en masse
   */
  async bulkUpdateStatus(taskIds: string[], status: TaskStatus): Promise<void> {
    try {
      // Le backend n'a pas de route bulk update
      // On fait les updates en parallèle
      await Promise.all(taskIds.map((id) => this.updateTaskStatus(id, status)));
    } catch (error: any) {
      console.error('Error bulk updating status:', error);
      throw error;
    }
  }

  /**
   * Récupérer les tâches pour un tableau Kanban
   */
  async getTasksForKanban(projectId: string): Promise<{ [key in TaskStatus]: Task[] }> {
    try {
      const tasks = await this.getTasksByProject(projectId);

      const kanban: { [key in TaskStatus]: Task[] } = {
        TODO: [],
        IN_PROGRESS: [],
        REVIEW: [],
        DONE: [],
        BLOCKED: [],
      };

      tasks.forEach((task) => {
        kanban[task.status].push(task);
      });

      return kanban;
    } catch (error: any) {
      console.error('Error getting tasks for kanban:', error);
      return {
        TODO: [],
        IN_PROGRESS: [],
        REVIEW: [],
        DONE: [],
        BLOCKED: [],
      };
    }
  }

  /**
   * Enregistrer du temps sur une tâche
   * NOTE: Non supporté par le backend actuellement
   */
  async logTime(
    taskId: string,
    timeEntry: Omit<TimeEntry, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>
  ): Promise<TimeEntry> {
    console.warn('logTime: Feature not yet supported by backend API');
    // TODO: Implémenter quand le backend supportera le time tracking
    throw new Error('Time tracking not yet supported');
  }

  /**
   * Récupérer les entrées de temps d'une tâche
   * NOTE: Non supporté par le backend actuellement
   */
  async getTimeEntries(taskId: string): Promise<TimeEntry[]> {
    console.warn('getTimeEntries: Feature not yet supported by backend API');
    // TODO: Implémenter quand le backend supportera le time tracking
    return [];
  }

  /**
   * Bloquer une tâche
   */
  async blockTask(taskId: string, reason: string): Promise<Task> {
    try {
      return await tasksAPI.updateTaskStatus(taskId, 'BLOCKED');
    } catch (error: any) {
      console.error('Error blocking task:', error);
      throw error;
    }
  }

  /**
   * Débloquer une tâche
   */
  async unblockTask(taskId: string): Promise<Task> {
    try {
      return await tasksAPI.unblockTask(taskId);
    } catch (error: any) {
      console.error('Error unblocking task:', error);
      throw error;
    }
  }

  /**
   * Définir l'epic d'une tâche
   * NOTE: Non supporté par le backend actuellement
   */
  async setEpic(taskId: string, epicId: string): Promise<Task> {
    console.warn('setEpic: Feature not yet supported by backend API');
    // TODO: Implémenter quand le backend supportera les epics
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    return task;
  }

  /**
   * Récupérer les tâches d'un epic
   * NOTE: Non supporté par le backend actuellement
   */
  async getEpicTasks(epicId: string): Promise<Task[]> {
    console.warn('getEpicTasks: Feature not yet supported by backend API');
    // TODO: Implémenter quand le backend supportera les epics
    return [];
  }

  /**
   * Définir le milestone d'une tâche
   * NOTE: Non supporté par le backend actuellement
   */
  async setMilestone(taskId: string, milestoneId: string): Promise<Task> {
    console.warn('setMilestone: Feature not yet supported by backend API');
    // TODO: Implémenter quand le backend supportera les milestones
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    return task;
  }

  /**
   * Récupérer les tâches d'un milestone
   * NOTE: Non supporté par le backend actuellement
   */
  async getMilestoneTasks(milestoneId: string): Promise<Task[]> {
    console.warn('getMilestoneTasks: Feature not yet supported by backend API');
    // TODO: Implémenter quand le backend supportera les milestones
    return [];
  }

  /**
   * Récupérer les tâches en retard
   */
  async getOverdueTasks(userId?: string): Promise<Task[]> {
    try {
      return await tasksAPI.getOverdueTasks(userId);
    } catch (error: any) {
      console.error('Error getting overdue tasks:', error);
      return [];
    }
  }

  /**
   * Marquer une tâche comme terminée
   */
  async completeTask(id: string): Promise<Task> {
    try {
      return await tasksAPI.completeTask(id);
    } catch (error: any) {
      console.error('Error completing task:', error);
      throw error;
    }
  }

  /**
   * Assigner une tâche à un utilisateur
   */
  async assignTask(taskId: string, assigneeId: string): Promise<Task> {
    try {
      return await tasksAPI.assignTask(taskId, assigneeId);
    } catch (error: any) {
      console.error('Error assigning task:', error);
      throw error;
    }
  }

  /**
   * Désassigner une tâche
   */
  async unassignTask(taskId: string): Promise<Task> {
    try {
      return await tasksAPI.unassignTask(taskId);
    } catch (error: any) {
      console.error('Error unassigning task:', error);
      throw error;
    }
  }

  /**
   * Récupérer les tâches par priorité
   */
  async getTasksByPriority(priority: TaskPriority): Promise<Task[]> {
    try {
      return await tasksAPI.getTasksByPriority(priority);
    } catch (error: any) {
      console.error('Error getting tasks by priority:', error);
      return [];
    }
  }

  /**
   * Récupérer les commentaires d'une tâche
   */
  async getTaskComments(taskId: string) {
    try {
      return await tasksAPI.getTaskComments(taskId);
    } catch (error: any) {
      console.error('Error getting task comments:', error);
      return [];
    }
  }

  /**
   * Ajouter un commentaire à une tâche (version API)
   */
  async addTaskComment(taskId: string, content: string) {
    try {
      return await tasksAPI.addTaskComment(taskId, content);
    } catch (error: any) {
      console.error('Error adding task comment:', error);
      throw error;
    }
  }
}

/**
 * Instance globale du service tâche
 */
export const taskService = new TaskService();
