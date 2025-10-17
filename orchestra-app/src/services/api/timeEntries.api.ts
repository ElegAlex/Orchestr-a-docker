import api from './client';

export type TimeEntryType = 'TASK' | 'MEETING' | 'SUPPORT' | 'DEVELOPMENT' | 'OTHER';

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string | null;
  taskId: string | null;
  type: TimeEntryType;
  description: string | null;
  date: string; // ISO date
  duration: number; // minutes
  isBillable: boolean;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateTimeEntryRequest {
  projectId?: string;
  taskId?: string;
  type?: TimeEntryType;
  description?: string;
  date: string; // ISO date
  duration: number; // minutes
  isBillable?: boolean;
}

export interface UpdateTimeEntryRequest {
  projectId?: string;
  taskId?: string;
  type?: TimeEntryType;
  description?: string;
  date?: string;
  duration?: number;
  isBillable?: boolean;
}

export interface GetTimeEntriesParams {
  userId?: string;
  projectId?: string;
  taskId?: string;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  page?: number;
  limit?: number;
}

export interface PaginatedTimeEntriesResponse {
  data: TimeEntry[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TimeEntryStats {
  totalEntries: number;
  totalMinutes: number;
  totalHours: number;
  billableMinutes: number;
  billableHours: number;
  nonBillableMinutes: number;
  byType: Record<string, number>; // minutes par type
  byProject: Record<string, number>; // minutes par projet
}

export interface ProjectTimeEntryStats {
  totalEntries: number;
  totalMinutes: number;
  totalHours: number;
  byUser: Record<string, {
    name: string;
    minutes: number;
  }>;
}

export const timeEntriesAPI = {
  /**
   * Récupère toutes les time entries avec filtres
   */
  async getAll(params?: GetTimeEntriesParams): Promise<PaginatedTimeEntriesResponse> {
    const response = await api.get('/time-entries', { params });
    return response.data;
  },

  /**
   * Récupère une time entry par ID
   */
  async getById(id: string): Promise<TimeEntry> {
    return await api.get(`/time-entries/${id}`);
  },

  /**
   * Récupère les statistiques de l'utilisateur connecté
   */
  async getStats(startDate?: string, endDate?: string): Promise<TimeEntryStats> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return await api.get('/time-entries/stats', { params });
  },

  /**
   * Récupère les statistiques d'un projet
   */
  async getProjectStats(
    projectId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ProjectTimeEntryStats> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return await api.get(`/time-entries/project/${projectId}/stats`, { params });
  },

  /**
   * Crée une nouvelle time entry
   */
  async create(data: CreateTimeEntryRequest): Promise<TimeEntry> {
    return await api.post('/time-entries', data);
  },

  /**
   * Met à jour une time entry
   */
  async update(id: string, data: UpdateTimeEntryRequest): Promise<TimeEntry> {
    return await api.patch(`/time-entries/${id}`, data);
  },

  /**
   * Supprime une time entry
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/time-entries/${id}`);
  },
};
