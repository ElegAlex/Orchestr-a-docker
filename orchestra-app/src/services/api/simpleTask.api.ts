import api from './client';

export interface SimpleTask {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  timeSlot: {
    start: string;
    end: string;
  };
  assignedTo: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateSimpleTaskRequest {
  title: string;
  description?: string;
  date: string; // ISO date string
  timeSlot: {
    start: string;
    end: string;
  };
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  assignedTo: string;
  createdBy: string;
}

export interface CreateMultipleSimpleTasksRequest {
  title: string;
  description?: string;
  date: string;
  timeSlot: {
    start: string;
    end: string;
  };
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  userIds: string[];
  createdBy: string;
}

export interface UpdateSimpleTaskRequest {
  title?: string;
  description?: string;
  date?: string;
  timeSlot?: {
    start: string;
    end: string;
  };
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

// Transformer pour adapter le format backend vers frontend
const transformTask = (task: any): SimpleTask => ({
  ...task,
  timeSlot: {
    start: task.timeStart,
    end: task.timeEnd,
  },
});

export const simpleTaskApi = {
  /**
   * Récupérer toutes les tâches simples
   */
  getAll: async (): Promise<SimpleTask[]> => {
    const tasks = await api.get('/simple-tasks');
    return Array.isArray(tasks) ? tasks.map(transformTask) : [];
  },

  /**
   * Récupérer les tâches d'un utilisateur
   */
  getByUser: async (userId: string): Promise<SimpleTask[]> => {
    const tasks = await api.get(`/simple-tasks/user/${userId}`);
    return Array.isArray(tasks) ? tasks.map(transformTask) : [];
  },

  /**
   * Récupérer les tâches d'un utilisateur par plage de dates
   */
  getByUserAndDateRange: async (
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<SimpleTask[]> => {
    const tasks = await api.get(`/simple-tasks/user/${userId}/date-range`, {
      params: { startDate, endDate },
    });
    return Array.isArray(tasks) ? tasks.map(transformTask) : [];
  },

  /**
   * Récupérer une tâche par ID
   */
  getById: async (id: string): Promise<SimpleTask> => {
    const task = await api.get(`/simple-tasks/${id}`);
    return transformTask(task);
  },

  /**
   * Créer une tâche simple
   */
  create: async (data: CreateSimpleTaskRequest): Promise<SimpleTask> => {
    const task = await api.post('/simple-tasks', data);
    return transformTask(task);
  },

  /**
   * Créer plusieurs tâches simples
   */
  createMultiple: async (data: CreateMultipleSimpleTasksRequest): Promise<SimpleTask[]> => {
    const tasks = await api.post('/simple-tasks/bulk', data);
    return Array.isArray(tasks) ? tasks.map(transformTask) : [];
  },

  /**
   * Mettre à jour une tâche simple
   */
  update: async (id: string, data: UpdateSimpleTaskRequest): Promise<SimpleTask> => {
    const task = await api.patch(`/simple-tasks/${id}`, data);
    return transformTask(task);
  },

  /**
   * Mettre à jour le statut d'une tâche
   */
  updateStatus: async (id: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE'): Promise<SimpleTask> => {
    const task = await api.patch(`/simple-tasks/${id}/status`, { status });
    return transformTask(task);
  },

  /**
   * Supprimer une tâche simple
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/simple-tasks/${id}`);
  },
};
