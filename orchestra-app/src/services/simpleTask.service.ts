import { simpleTaskApi } from './api/simpleTask.api';
import { SimpleTask, CreateSimpleTaskInput } from '../types/simpleTask';

/**
 * Service Simple Tasks - Migré vers API REST
 */
class SimpleTaskService {
  /**
   * Créer UNE tâche simple
   */
  async create(input: CreateSimpleTaskInput, assignedTo: string, createdBy: string): Promise<SimpleTask> {
    try {
      const task = await simpleTaskApi.create({
        title: input.title,
        description: input.description || '',
        date: input.date.toISOString(),
        timeSlot: {
          start: input.timeSlot.start,
          end: input.timeSlot.end,
        },
        priority: input.priority,
        assignedTo,
        createdBy,
      });

      // Convertir les dates ISO en objets Date
      return {
        ...task,
        date: new Date(task.date),
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      };
    } catch (error: any) {
      console.error('Error creating simple task:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de la tâche');
    }
  }

  /**
   * Créer PLUSIEURS tâches (duplication multi-users)
   */
  async createMultiple(
    input: CreateSimpleTaskInput,
    userIds: string[],
    createdBy: string
  ): Promise<SimpleTask[]> {
    try {
      const tasks = await simpleTaskApi.createMultiple({
        title: input.title,
        description: input.description || '',
        date: input.date.toISOString(),
        timeSlot: {
          start: input.timeSlot.start,
          end: input.timeSlot.end,
        },
        priority: input.priority,
        userIds,
        createdBy,
      });

      // Convertir les dates ISO en objets Date
      return tasks.map(task => ({
        ...task,
        date: new Date(task.date),
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      }));
    } catch (error: any) {
      console.error('Error creating multiple simple tasks:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la création des tâches');
    }
  }

  /**
   * Récupérer TOUTES les tâches (pour admin/calendar global)
   */
  async getAll(): Promise<SimpleTask[]> {
    try {
      const tasks = await simpleTaskApi.getAll();

      // Convertir les dates ISO en objets Date
      return tasks.map(task => ({
        ...task,
        date: new Date(task.date),
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      }));
    } catch (error: any) {
      console.error('Error fetching all simple tasks:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des tâches');
    }
  }

  /**
   * Récupérer par user
   */
  async getByUser(userId: string): Promise<SimpleTask[]> {
    try {
      const tasks = await simpleTaskApi.getByUser(userId);

      // Vérifier que tasks est bien un tableau
      if (!Array.isArray(tasks)) {
        console.warn('simpleTaskApi.getByUser returned non-array:', tasks);
        return [];
      }

      // Convertir les dates ISO en objets Date
      return tasks.map(task => ({
        ...task,
        date: new Date(task.date),
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      }));
    } catch (error: any) {
      console.error('Error fetching user simple tasks:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des tâches');
    }
  }

  /**
   * Récupérer par user et date
   */
  async getByUserAndDate(userId: string, startDate: Date, endDate: Date): Promise<SimpleTask[]> {
    try {
      const tasks = await simpleTaskApi.getByUserAndDateRange(
        userId,
        startDate.toISOString(),
        endDate.toISOString()
      );

      // Convertir les dates ISO en objets Date
      return tasks.map(task => ({
        ...task,
        date: new Date(task.date),
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      }));
    } catch (error: any) {
      console.error('Error fetching simple tasks by date range:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des tâches');
    }
  }

  /**
   * Récupérer par ID
   */
  async getById(id: string): Promise<SimpleTask | null> {
    try {
      const task = await simpleTaskApi.getById(id);

      // Convertir les dates ISO en objets Date
      return {
        ...task,
        date: new Date(task.date),
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching simple task:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération de la tâche');
    }
  }

  /**
   * Mettre à jour
   */
  async update(id: string, updates: Partial<CreateSimpleTaskInput>): Promise<void> {
    try {
      const updateData: any = {};

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.date !== undefined) updateData.date = updates.date.toISOString();
      if (updates.timeSlot !== undefined) updateData.timeSlot = updates.timeSlot;
      if (updates.priority !== undefined) updateData.priority = updates.priority;

      await simpleTaskApi.update(id, updateData);
    } catch (error: any) {
      console.error('Error updating simple task:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour de la tâche');
    }
  }

  /**
   * Supprimer
   */
  async delete(id: string): Promise<void> {
    try {
      await simpleTaskApi.delete(id);
    } catch (error: any) {
      console.error('Error deleting simple task:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression de la tâche');
    }
  }

  /**
   * Changer statut
   */
  async updateStatus(id: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE'): Promise<void> {
    try {
      await simpleTaskApi.updateStatus(id, status);
    } catch (error: any) {
      console.error('Error updating simple task status:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    }
  }
}

export const simpleTaskService = new SimpleTaskService();
