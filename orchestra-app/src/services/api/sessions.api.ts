import api from './client';

// Types
export interface Session {
  id: string;
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
    isMobile?: boolean;
  } | null;
  lastActivityAt: string;
  expiresAt: string;
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
}

export interface CreateSessionDto {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
    isMobile?: boolean;
  };
  expiresAt: string;
}

export interface UpdateSessionDto {
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
    isMobile?: boolean;
  };
  lastActivityAt?: string;
  expiresAt?: string;
  isActive?: boolean;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  inactiveSessions: number;
  totalUsers: number;
  usersWithActiveSessions: number;
  usersWithoutActiveSessions: number;
}

// API Methods
export const sessionsApi = {
  /**
   * Crée une nouvelle session (audit logging)
   */
  create: async (dto: CreateSessionDto): Promise<Session> => {
    const { data } = await api.post<Session>('/sessions', dto);
    return data;
  },

  /**
   * Récupère toutes les sessions (avec filtres optionnels)
   */
  getAll: async (userId?: string, isActive?: boolean): Promise<Session[]> => {
    const params: any = {};
    if (userId) params.userId = userId;
    if (isActive !== undefined) params.isActive = isActive;

    const { data } = await api.get<Session[]>('/sessions', { params });
    return data;
  },

  /**
   * Récupère une session par ID
   */
  getById: async (id: string): Promise<Session> => {
    const { data } = await api.get<Session>(`/sessions/${id}`);
    return data;
  },

  /**
   * Récupère les sessions d'un utilisateur
   */
  getByUser: async (userId: string): Promise<Session[]> => {
    const { data } = await api.get<Session[]>(`/sessions/user/${userId}`);
    return data;
  },

  /**
   * Récupère les sessions actives d'un utilisateur
   */
  getActiveByUser: async (userId: string): Promise<Session[]> => {
    const { data } = await api.get<Session[]>(`/sessions/user/${userId}/active`);
    return data;
  },

  /**
   * Met à jour une session
   */
  update: async (id: string, dto: UpdateSessionDto): Promise<Session> => {
    const { data } = await api.patch<Session>(`/sessions/${id}`, dto);
    return data;
  },

  /**
   * Met à jour l'activité d'une session
   */
  updateActivity: async (id: string): Promise<Session> => {
    const { data } = await api.patch<Session>(`/sessions/${id}/activity`);
    return data;
  },

  /**
   * Invalide une session (soft delete)
   */
  invalidate: async (id: string): Promise<Session> => {
    const { data } = await api.patch<Session>(`/sessions/${id}/invalidate`);
    return data;
  },

  /**
   * Invalide toutes les sessions d'un utilisateur
   */
  invalidateAllUserSessions: async (userId: string): Promise<{ count: number }> => {
    const { data } = await api.delete<{ count: number }>(
      `/sessions/user/${userId}/invalidate-all`,
    );
    return data;
  },

  /**
   * Nettoie les sessions expirées
   */
  cleanupExpiredSessions: async (): Promise<{ deletedCount: number }> => {
    const { data } = await api.delete<{ deletedCount: number }>('/sessions/cleanup');
    return data;
  },

  /**
   * Récupère les statistiques des sessions
   */
  getStats: async (): Promise<SessionStats> => {
    const { data } = await api.get<SessionStats>('/sessions/stats');
    return data;
  },
};
