import api from './client';

// Types
export interface OrganizationService {
  id: string;
  name: string;
  description?: string;
  color: string;
  manager?: string | null;
  managedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  budget?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userAssignments?: UserServiceAssignment[];
}

export interface UserServiceAssignment {
  id: string;
  userId: string;
  serviceId: string;
  role?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  color: string;
  manager?: string;
  budget?: number;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  color?: string;
  manager?: string;
  budget?: number;
  isActive?: boolean;
}

export interface ServiceStats {
  total: number;
  withManager: number;
  totalBudget: number;
}

// API Methods
export const servicesApi = {
  /**
   * Récupère tous les services
   */
  getAll: async (isActive?: boolean): Promise<OrganizationService[]> => {
    const params = isActive !== undefined ? { isActive } : {};
    return await api.get<OrganizationService[]>('/services', { params });
  },

  /**
   * Récupère un service par son ID
   */
  getById: async (id: string): Promise<OrganizationService> => {
    return await api.get<OrganizationService>(`/services/${id}`);
  },

  /**
   * Crée un nouveau service
   */
  create: async (dto: CreateServiceDto): Promise<OrganizationService> => {
    return await api.post<OrganizationService>('/services', dto);
  },

  /**
   * Met à jour un service
   */
  update: async (id: string, dto: UpdateServiceDto): Promise<OrganizationService> => {
    return await api.patch<OrganizationService>(`/services/${id}`, dto);
  },

  /**
   * Supprime un service (soft delete)
   */
  delete: async (id: string): Promise<OrganizationService> => {
    return await api.delete<OrganizationService>(`/services/${id}`);
  },

  /**
   * Récupère les statistiques des services
   */
  getStats: async (): Promise<ServiceStats> => {
    return await api.get<ServiceStats>('/services/stats');
  },
};
