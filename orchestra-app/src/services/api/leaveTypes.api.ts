import api from './client';

/**
 * Interface pour un type de congé configurable
 */
export interface LeaveTypeConfig {
  id: string;
  name: string;
  code: string;
  description?: string;
  defaultDays: number;
  color: string;
  icon: string;
  requiresApproval: boolean;
  isPaid: boolean;
  countInBalance: boolean;
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/**
 * Interface pour créer un nouveau type de congé
 */
export interface CreateLeaveTypeRequest {
  name: string;
  code: string;
  description?: string;
  defaultDays: number;
  color?: string;
  icon?: string;
  requiresApproval?: boolean;
  isPaid?: boolean;
  countInBalance?: boolean;
  sortOrder?: number;
}

/**
 * Interface pour mettre à jour un type de congé (code non modifiable)
 */
export interface UpdateLeaveTypeRequest {
  name?: string;
  description?: string;
  defaultDays?: number;
  color?: string;
  icon?: string;
  requiresApproval?: boolean;
  isPaid?: boolean;
  countInBalance?: boolean;
  sortOrder?: number;
}

/**
 * Interface pour réorganiser les types de congés
 */
export interface ReorderLeaveTypesRequest {
  orderedIds: string[];
}

/**
 * Interface pour le total de jours par défaut
 */
export interface TotalDefaultDaysResponse {
  totalDays: number;
}

/**
 * API Client pour la gestion des types de congés (Service 34)
 *
 * Gère les types de congés configurables avec paramètres par défaut.
 * Remplace la configuration globale des jours de congés par département/utilisateur.
 */
export const leaveTypesAPI = {
  /**
   * Récupère tous les types de congés
   * @param includeInactive - Inclure les types désactivés (défaut: false)
   */
  async getAll(includeInactive = false): Promise<LeaveTypeConfig[]> {
    const response = await api.get<LeaveTypeConfig[]>('/leave-types', {
      params: { includeInactive: includeInactive ? 'true' : 'false' },
    });
    return response || [];
  },

  /**
   * Récupère les types de congés actifs uniquement
   */
  async getActive(): Promise<LeaveTypeConfig[]> {
    return this.getAll(false);
  },

  /**
   * Récupère un type de congé par ID
   */
  async getById(id: string): Promise<LeaveTypeConfig> {
    return await api.get(`/leave-types/${id}`);
  },

  /**
   * Récupère un type de congé par code unique
   */
  async getByCode(code: string): Promise<LeaveTypeConfig> {
    return await api.get(`/leave-types/by-code/${code}`);
  },

  /**
   * Calcule le total de jours par défaut (tous types actifs)
   */
  async calculateTotalDays(): Promise<TotalDefaultDaysResponse> {
    return await api.get('/leave-types/total-days');
  },

  /**
   * Crée un nouveau type de congé (ADMIN uniquement)
   */
  async create(data: CreateLeaveTypeRequest): Promise<LeaveTypeConfig> {
    return await api.post('/leave-types', data);
  },

  /**
   * Met à jour un type de congé (ADMIN uniquement)
   * Note: Le code ne peut pas être modifié
   */
  async update(id: string, data: UpdateLeaveTypeRequest): Promise<LeaveTypeConfig> {
    return await api.patch(`/leave-types/${id}`, data);
  },

  /**
   * Désactive un type de congé (soft delete) (ADMIN uniquement)
   * Les types système ne peuvent pas être désactivés
   */
  async deactivate(id: string): Promise<LeaveTypeConfig> {
    return await api.patch(`/leave-types/${id}/deactivate`, {});
  },

  /**
   * Réactive un type de congé désactivé (ADMIN uniquement)
   */
  async activate(id: string): Promise<LeaveTypeConfig> {
    return await api.patch(`/leave-types/${id}/activate`, {});
  },

  /**
   * Réorganise l'ordre d'affichage des types de congés (ADMIN uniquement)
   * Utile pour drag & drop dans l'interface
   */
  async reorder(orderedIds: string[]): Promise<{ message: string }> {
    return await api.post('/leave-types/reorder', { orderedIds });
  },

  /**
   * Supprime définitivement un type de congé (hard delete) (ADMIN uniquement)
   * Les types système ne peuvent pas être supprimés
   * ATTENTION: Suppression définitive, utiliser deactivate() à la place si possible
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/leave-types/${id}`);
  },

  /**
   * Récupère les 4 types de congés système par défaut
   * Utile pour affichage initial ou réinitialisation
   */
  async getSystemTypes(): Promise<LeaveTypeConfig[]> {
    const allTypes = await this.getActive();
    return allTypes.filter((type) => type.isSystem);
  },

  /**
   * Récupère les types de congés personnalisés (non système)
   */
  async getCustomTypes(): Promise<LeaveTypeConfig[]> {
    const allTypes = await this.getActive();
    return allTypes.filter((type) => !type.isSystem);
  },
};
