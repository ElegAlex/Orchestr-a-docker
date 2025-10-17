import api from './client';

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  code: string;
  type: 'MAJOR' | 'MINOR' | 'RELEASE' | 'REVIEW' | 'DECISION';
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';

  // Dates
  startDate?: string; // ISO date string
  dueDate: string; // ISO date string
  followsTasks: boolean;
  isKeyDate: boolean;

  // Deliverables & Criteria
  deliverables: any; // JSON
  successCriteria: string[];

  // Responsabilités
  ownerId: string;
  reviewers: string[];

  // État
  completionRate: number;

  // Dépendances
  dependsOn: any; // JSON
  epicIds: string[];
  taskIds: string[];

  // Validation
  validationRequired: boolean;
  validatedBy?: string;
  validatedAt?: string;
  validationNotes?: string;

  // Impact
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedTeams: string[];

  // Visualisation
  color: string;
  icon?: string;
  showOnRoadmap: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Relations (optional, populated by backend)
  project?: {
    id: string;
    name: string;
  };
}

export interface CreateMilestoneRequest {
  projectId: string;
  name: string;
  description?: string;
  code?: string;
  type?: 'MAJOR' | 'MINOR' | 'RELEASE' | 'REVIEW' | 'DECISION';
  startDate?: string;
  dueDate: string;
  followsTasks?: boolean;
  isKeyDate?: boolean;
  deliverables?: any;
  successCriteria?: string[];
  ownerId: string;
  reviewers?: string[];
  completionRate?: number;
  dependsOn?: any;
  epicIds?: string[];
  taskIds?: string[];
  validationRequired?: boolean;
  impact?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedTeams?: string[];
  color?: string;
  icon?: string;
  showOnRoadmap?: boolean;
}

export interface UpdateMilestoneRequest {
  name?: string;
  description?: string;
  code?: string;
  type?: 'MAJOR' | 'MINOR' | 'RELEASE' | 'REVIEW' | 'DECISION';
  status?: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
  startDate?: string;
  dueDate?: string;
  followsTasks?: boolean;
  isKeyDate?: boolean;
  deliverables?: any;
  successCriteria?: string[];
  reviewers?: string[];
  completionRate?: number;
  dependsOn?: any;
  epicIds?: string[];
  taskIds?: string[];
  validationRequired?: boolean;
  impact?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedTeams?: string[];
  color?: string;
  icon?: string;
  showOnRoadmap?: boolean;
}

export interface MilestoneMetrics {
  totalMilestones: number;
  completedMilestones: number;
  atRiskMilestones: number;
  upcomingMilestones: number;
  averageCompletion: number;
  keyDatesCount: number;
}

export const milestoneApi = {
  /**
   * Créer un milestone
   */
  create: async (data: CreateMilestoneRequest): Promise<Milestone> => {
    const response = await api.post('/milestones', data);
    return response.data;
  },

  /**
   * Récupérer tous les milestones d'un projet
   */
  getByProject: async (projectId: string): Promise<Milestone[]> => {
    const response = await api.get(`/milestones/project/${projectId}`);
    return response.data;
  },

  /**
   * Récupérer les milestones par statut
   */
  getByProjectAndStatus: async (
    projectId: string,
    status: string,
  ): Promise<Milestone[]> => {
    const response = await api.get(`/milestones/project/${projectId}/status/${status}`);
    return response.data;
  },

  /**
   * Récupérer les milestones à risque
   */
  getAtRisk: async (projectId: string): Promise<Milestone[]> => {
    const response = await api.get(`/milestones/project/${projectId}/at-risk`);
    return response.data;
  },

  /**
   * Récupérer les milestones à venir (dans les N prochains jours)
   */
  getUpcoming: async (projectId: string, days?: number): Promise<Milestone[]> => {
    const params = days ? { days: days.toString() } : {};
    const response = await api.get(`/milestones/project/${projectId}/upcoming`, {
      params,
    });
    return response.data;
  },

  /**
   * Récupérer les métriques des milestones d'un projet
   */
  getProjectMetrics: async (projectId: string): Promise<MilestoneMetrics> => {
    const response = await api.get(`/milestones/project/${projectId}/metrics`);
    return response.data;
  },

  /**
   * Récupérer un milestone par ID
   */
  getById: async (id: string): Promise<Milestone> => {
    const response = await api.get(`/milestones/${id}`);
    return response.data;
  },

  /**
   * Mettre à jour un milestone
   */
  update: async (id: string, data: UpdateMilestoneRequest): Promise<Milestone> => {
    const response = await api.patch(`/milestones/${id}`, data);
    return response.data;
  },

  /**
   * Mettre à jour le statut d'un milestone
   */
  updateStatus: async (
    id: string,
    status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELLED',
  ): Promise<Milestone> => {
    const response = await api.patch(`/milestones/${id}/status`, { status });
    return response.data;
  },

  /**
   * Valider un milestone
   */
  validate: async (
    id: string,
    validatorId: string,
    validationNotes?: string,
  ): Promise<Milestone> => {
    const response = await api.post(`/milestones/${id}/validate`, {
      validatorId,
      validationNotes,
    });
    return response.data;
  },

  /**
   * Supprimer un milestone
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/milestones/${id}`);
  },
};
