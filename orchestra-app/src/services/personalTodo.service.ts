import { personalTodosAPI } from './api';
import type { PersonalTodo, CreatePersonalTodoRequest, UpdatePersonalTodoRequest } from './api';

/**
 * Service Personal Todos (REST API Version)
 * Migré depuis Firebase vers backend REST
 */
class PersonalTodoService {
  /**
   * Créer une to-do personnelle
   */
  async create(input: { text: string; priority?: number }): Promise<PersonalTodo> {
    const data: CreatePersonalTodoRequest = {
      text: input.text,
      priority: input.priority,
    };

    return await personalTodosAPI.create(data);
  }

  /**
   * Récupérer toutes les to-dos de l'utilisateur connecté
   */
  async getUserTodos(completed?: boolean): Promise<PersonalTodo[]> {
    const params = completed !== undefined ? { completed } : undefined;
    return await personalTodosAPI.getAll(params);
  }

  /**
   * Récupérer une todo par ID
   */
  async getById(id: string): Promise<PersonalTodo> {
    return await personalTodosAPI.getById(id);
  }

  /**
   * Toggle completed
   */
  async toggleCompleted(id: string): Promise<PersonalTodo> {
    return await personalTodosAPI.toggle(id);
  }

  /**
   * Mettre à jour le texte
   */
  async updateText(id: string, text: string): Promise<PersonalTodo> {
    return await personalTodosAPI.update(id, { text });
  }

  /**
   * Mettre à jour la priorité
   */
  async updatePriority(id: string, priority: number): Promise<PersonalTodo> {
    return await personalTodosAPI.update(id, { priority });
  }

  /**
   * Mettre à jour une todo
   */
  async update(id: string, data: UpdatePersonalTodoRequest): Promise<PersonalTodo> {
    return await personalTodosAPI.update(id, data);
  }

  /**
   * Supprimer une to-do
   */
  async delete(id: string): Promise<void> {
    return await personalTodosAPI.delete(id);
  }

  /**
   * Supprimer toutes les to-dos complétées
   */
  async cleanupOldCompleted(): Promise<{ deleted: number }> {
    return await personalTodosAPI.deleteCompleted();
  }
}

export const personalTodoService = new PersonalTodoService();
export type { PersonalTodo };
