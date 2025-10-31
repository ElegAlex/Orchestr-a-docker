import api from './client';

export type EpicStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Epic {
  id: string;
  projectId: string;
  code: string;
  name: string;
  description: string;
  status: EpicStatus;
  priority: Priority;
  risk: RiskLevel;
  startDate: string | null;
  endDate: string | null;
  progress: number; // 0-100
  ownerId: string;
  stakeholders: string[];
  taskIds: string[];
  taskCount: number;
  completedTaskCount: number;
  dependencies: any; // JSON
  businessValue: number | null;
  tags: string[];
  metadata: any | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
}

export interface CreateEpicRequest {
  projectId: string;
  code?: string;
  name: string;
  description?: string;
  status?: EpicStatus;
  priority?: Priority;
  risk?: RiskLevel;
  startDate?: string;
  endDate?: string;
  ownerId: string;
  stakeholders?: string[];
  taskIds?: string[];
  progress?: number;
  businessValue?: number;
  tags?: string[];
}

export interface UpdateEpicRequest {
  name?: string;
  description?: string;
  status?: EpicStatus;
  priority?: Priority;
  risk?: RiskLevel;
  startDate?: string;
  endDate?: string;
  stakeholders?: string[];
  taskIds?: string[];
  progress?: number;
  businessValue?: number;
  tags?: string[];
}

export interface UpdateEpicProgressRequest {
  progress: number;
}

export interface UpdateEpicStatusRequest {
  status: EpicStatus;
}

export interface GetEpicsParams {
  page?: number;
  limit?: number;
  projectId?: string;
}

export interface PaginatedEpicsResponse {
  data: Epic[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const epicsAPI = {
  /**
   * Récupère tous les epics avec pagination
   */
  async getAll(params?: GetEpicsParams): Promise<PaginatedEpicsResponse> {
    const response = await api.get('/epics', { params });
    return response.data;
  },

  /**
   * Récupère les epics d'un projet
   */
  async getByProject(projectId: string): Promise<Epic[]> {
    const response = await api.get(`/epics/project/${projectId}`);
    return response.data || [];
  },

  /**
   * Récupère un epic par ID
   */
  async getById(id: string): Promise<Epic> {
    return await api.get(`/epics/${id}`);
  },

  /**
   * Récupère les tâches associées à un epic
   */
  async getTasks(id: string): Promise<any[]> {
    const response = await api.get(`/epics/${id}/tasks`);
    return response.data || [];
  },

  /**
   * Crée un nouvel epic
   */
  async create(data: CreateEpicRequest): Promise<Epic> {
    return await api.post('/epics', data);
  },

  /**
   * Met à jour un epic
   */
  async update(id: string, data: UpdateEpicRequest): Promise<Epic> {
    return await api.patch(`/epics/${id}`, data);
  },

  /**
   * Met à jour la progression d'un epic
   */
  async updateProgress(id: string, progress: number): Promise<Epic> {
    return await api.patch(`/epics/${id}/progress`, { progress });
  },

  /**
   * Met à jour le statut d'un epic
   */
  async updateStatus(id: string, status: EpicStatus): Promise<Epic> {
    return await api.patch(`/epics/${id}/status`, { status });
  },

  /**
   * Supprime un epic
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/epics/${id}`);
  },
};
