import api from './client';

export interface PersonalTodo {
  id: string;
  userId: string;
  text: string;
  completed: boolean;
  priority: number; // 1=high, 2=medium, 3=low
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonalTodoRequest {
  text: string;
  priority?: number; // 1=high, 2=medium, 3=low
}

export interface UpdatePersonalTodoRequest {
  text?: string;
  completed?: boolean;
  priority?: number;
}

export interface GetPersonalTodosParams {
  completed?: boolean;
}

export const personalTodosAPI = {
  /**
   * Récupère toutes les todos de l'utilisateur connecté
   */
  async getAll(params?: GetPersonalTodosParams): Promise<PersonalTodo[]> {
    // api.get() retourne déjà response.data, pas besoin de .data ici
    return await api.get('/personal-todos', { params });
  },

  /**
   * Récupère une todo par ID
   */
  async getById(id: string): Promise<PersonalTodo> {
    return await api.get(`/personal-todos/${id}`);
  },

  /**
   * Crée une nouvelle todo
   */
  async create(data: CreatePersonalTodoRequest): Promise<PersonalTodo> {
    return await api.post('/personal-todos', data);
  },

  /**
   * Met à jour une todo
   */
  async update(id: string, data: UpdatePersonalTodoRequest): Promise<PersonalTodo> {
    return await api.patch(`/personal-todos/${id}`, data);
  },

  /**
   * Toggle le statut completed d'une todo
   */
  async toggle(id: string): Promise<PersonalTodo> {
    return await api.patch(`/personal-todos/${id}/toggle`);
  },

  /**
   * Supprime une todo
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/personal-todos/${id}`);
  },

  /**
   * Supprime toutes les todos complétées
   */
  async deleteCompleted(): Promise<{ deleted: number }> {
    return await api.delete('/personal-todos/completed/all');
  },
};
