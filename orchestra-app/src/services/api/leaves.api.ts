import api from './client';

export interface Leave {
  id: string;
  userId: string;
  type: 'PAID_LEAVE' | 'SICK_LEAVE' | 'RTT' | 'UNPAID_LEAVE' | 'PARENTAL_LEAVE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  days: string;
  reason?: string;
  approverId?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
  };
  approver?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateLeaveRequest {
  type: 'PAID_LEAVE' | 'SICK_LEAVE' | 'RTT' | 'UNPAID_LEAVE' | 'PARENTAL_LEAVE';
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
}

export interface UpdateLeaveRequest {
  type?: 'PAID_LEAVE' | 'SICK_LEAVE' | 'RTT' | 'UNPAID_LEAVE' | 'PARENTAL_LEAVE';
  startDate?: string;
  endDate?: string;
  days?: number;
  reason?: string;
}

export interface RejectLeaveRequest {
  rejectionReason: string;
}

export interface GetLeavesParams {
  userId?: string;
  departmentId?: string | null; // Filtre par département (null = tous les départements)
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  type?: 'PAID_LEAVE' | 'SICK_LEAVE' | 'RTT' | 'UNPAID_LEAVE' | 'PARENTAL_LEAVE';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface LeaveStats {
  userId: string;
  totalLeaves: number;
  byStatus: Array<{
    status: string;
    count: number;
    totalDays: string;
  }>;
  byType: Array<{
    type: string;
    count: number;
    totalDays: string;
  }>;
}

export const leavesAPI = {
  /**
   * Récupère toutes les demandes de congé avec filtrage optionnel
   */
  async getAll(params?: GetLeavesParams): Promise<Leave[]> {
    const response = await api.get('/leaves', { params });
    return response.data || [];
  },

  /**
   * Récupère les congés d'un utilisateur
   */
  async getLeavesByUser(userId: string): Promise<Leave[]> {
    return this.getAll({ userId });
  },

  /**
   * Récupère les congés par statut
   */
  async getLeavesByStatus(
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED',
  ): Promise<Leave[]> {
    return this.getAll({ status });
  },

  /**
   * Récupère une demande de congé par ID
   */
  async getById(id: string): Promise<Leave> {
    return await api.get(`/leaves/${id}`);
  },

  /**
   * Crée une nouvelle demande de congé
   */
  async createLeave(data: CreateLeaveRequest): Promise<Leave> {
    return await api.post('/leaves', data);
  },

  /**
   * Met à jour une demande de congé (PENDING seulement)
   */
  async updateLeave(leaveId: string, data: UpdateLeaveRequest): Promise<Leave> {
    return await api.patch(`/leaves/${leaveId}`, data);
  },

  /**
   * Supprime une demande de congé (PENDING seulement)
   */
  async deleteLeave(leaveId: string): Promise<void> {
    await api.delete(`/leaves/${leaveId}`);
  },

  /**
   * Approuve une demande de congé (ADMIN/RESPONSABLE/MANAGER)
   */
  async approveLeave(leaveId: string): Promise<Leave> {
    return await api.post(`/leaves/${leaveId}/approve`);
  },

  /**
   * Rejette une demande de congé (ADMIN/RESPONSABLE/MANAGER)
   */
  async rejectLeave(leaveId: string, data: RejectLeaveRequest): Promise<Leave> {
    return await api.post(`/leaves/${leaveId}/reject`, data);
  },

  /**
   * Annule une demande de congé approuvée (ADMIN/RESPONSABLE)
   */
  async cancelLeave(leaveId: string): Promise<Leave> {
    return await api.post(`/leaves/${leaveId}/cancel`);
  },

  /**
   * Récupère les statistiques de congés d'un utilisateur
   */
  async getUserStats(userId: string): Promise<LeaveStats> {
    return await api.get(`/leaves/user/${userId}/stats`);
  },
};
