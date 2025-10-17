import api from './client';

// ==========================================
// TYPES - Telework Override
// ==========================================

export interface TeleworkOverride {
  id: string;
  userId: string;
  date: string; // ISO date
  mode: 'REMOTE' | 'ONSITE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    departmentId?: string;
  };
}

export interface CreateTeleworkOverrideRequest {
  userId: string;
  date: string; // ISO date
  mode?: 'REMOTE' | 'ONSITE';
  reason?: string;
}

export interface UpdateTeleworkOverrideRequest {
  date?: string;
  mode?: 'REMOTE' | 'ONSITE';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
}

// ==========================================
// TYPES - Presence Calculation
// ==========================================

export interface UserPresence {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    department?: {
      id: string;
      name: string;
    };
  };
  status: 'on_site' | 'telework' | 'absent';
  details?: string;
  validationStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
}

export interface DepartmentPresence {
  departmentId: string;
  departmentName: string;
  onSite: UserPresence[];
  telework: UserPresence[];
  absent: UserPresence[];
  totalUsers: number;
}

export interface PresenceStatus {
  onSite: UserPresence[];
  telework: UserPresence[];
  absent: UserPresence[];
  byDepartment?: DepartmentPresence[];
}

export interface PresenceStats {
  totalUsers: number;
  onSiteCount: number;
  teleworkCount: number;
  absentCount: number;
  onSitePercentage: number;
  teleworkPercentage: number;
}

// ==========================================
// API CLIENT
// ==========================================

export const presenceApi = {
  // ==========================================
  // TELEWORK OVERRIDES
  // ==========================================

  /**
   * Créer un telework override
   */
  createTeleworkOverride: async (
    data: CreateTeleworkOverrideRequest,
  ): Promise<TeleworkOverride> => {
    const response = await api.post('/presences/telework-overrides', data);
    return response;
  },

  /**
   * Récupérer les telework overrides d'un utilisateur
   */
  getTeleworkOverridesByUser: async (
    userId: string,
  ): Promise<TeleworkOverride[]> => {
    const response = await api.get(`/presences/telework-overrides/user/${userId}`);
    return response;
  },

  /**
   * Récupérer les telework overrides pour une date
   */
  getTeleworkOverridesForDate: async (
    date: string,
  ): Promise<TeleworkOverride[]> => {
    const response = await api.get(`/presences/telework-overrides/date/${date}`);
    return response;
  },

  /**
   * Récupérer un telework override par ID
   */
  getTeleworkOverride: async (id: string): Promise<TeleworkOverride> => {
    const response = await api.get(`/presences/telework-overrides/${id}`);
    return response;
  },

  /**
   * Mettre à jour un telework override
   */
  updateTeleworkOverride: async (
    id: string,
    data: UpdateTeleworkOverrideRequest,
  ): Promise<TeleworkOverride> => {
    const response = await api.patch(`/presences/telework-overrides/${id}`, data);
    return response;
  },

  /**
   * Approuver ou rejeter un telework override
   */
  updateTeleworkOverrideStatus: async (
    id: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED',
  ): Promise<TeleworkOverride> => {
    const response = await api.patch(`/presences/telework-overrides/${id}/status`, {
      status,
    });
    return response;
  },

  /**
   * Supprimer un telework override
   */
  deleteTeleworkOverride: async (id: string): Promise<void> => {
    await api.delete(`/presences/telework-overrides/${id}`);
  },

  // ==========================================
  // PRESENCE CALCULATION
  // ==========================================

  /**
   * Calculer les présences pour une date donnée
   */
  getPresencesForDate: async (
    date: string,
    departmentId?: string,
  ): Promise<PresenceStatus> => {
    const params = departmentId ? { departmentId } : {};
    const response = await api.get(`/presences/date/${date}`, { params });
    return response;
  },

  /**
   * Récupérer les statistiques de présence
   */
  getPresenceStats: async (
    date: string,
    departmentId?: string,
  ): Promise<PresenceStats> => {
    const params = departmentId ? { departmentId } : {};
    const response = await api.get(`/presences/stats/date/${date}`, { params });
    return response;
  },
};
