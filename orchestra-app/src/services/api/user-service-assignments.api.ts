import api from './client';

// Types
export interface UserServiceAssignment {
  id: string;
  userId: string;
  serviceId: string;
  role?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
  };
  service?: {
    id: string;
    name: string;
    description?: string;
    color: string;
  };
}

export interface CreateAssignmentDto {
  userId: string;
  serviceId: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface UpdateAssignmentDto {
  userId?: string;
  serviceId?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface AssignmentStats {
  totalAssignments: number;
  activeAssignments: number;
  totalUsers: number;
  totalServices: number;
  assignedUsersCount: number;
  unassignedUsersCount: number;
  servicesWithUsersCount: number;
  servicesWithoutUsersCount: number;
}

// API Methods
export const userServiceAssignmentsApi = {
  /**
   * Récupère toutes les assignations
   */
  getAll: async (): Promise<UserServiceAssignment[]> => {
    // Ajouter timestamp pour casser le cache HTTP 304
    return await api.get<UserServiceAssignment[]>(`/user-service-assignments?t=${Date.now()}`);
  },

  /**
   * Récupère une assignation par ID
   */
  getById: async (id: string): Promise<UserServiceAssignment> => {
    return await api.get<UserServiceAssignment>(`/user-service-assignments/${id}`);
  },

  /**
   * Récupère les assignations d'un utilisateur
   */
  getByUser: async (userId: string): Promise<UserServiceAssignment[]> => {
    return await api.get<UserServiceAssignment[]>(
      `/user-service-assignments/user/${userId}`,
    );
  },

  /**
   * Récupère les assignations d'un service
   */
  getByService: async (serviceId: string): Promise<UserServiceAssignment[]> => {
    return await api.get<UserServiceAssignment[]>(
      `/user-service-assignments/service/${serviceId}`,
    );
  },

  /**
   * Crée une nouvelle assignation
   */
  create: async (dto: CreateAssignmentDto): Promise<UserServiceAssignment> => {
    return await api.post<UserServiceAssignment>('/user-service-assignments', dto);
  },

  /**
   * Met à jour une assignation
   */
  update: async (id: string, dto: UpdateAssignmentDto): Promise<UserServiceAssignment> => {
    return await api.patch<UserServiceAssignment>(
      `/user-service-assignments/${id}`,
      dto,
    );
  },

  /**
   * Supprime une assignation (soft delete)
   */
  delete: async (id: string): Promise<UserServiceAssignment> => {
    return await api.delete<UserServiceAssignment>(`/user-service-assignments/${id}`);
  },

  /**
   * Récupère les statistiques des assignations
   */
  getStats: async (): Promise<AssignmentStats> => {
    return await api.get<AssignmentStats>('/user-service-assignments/stats');
  },
};
