/**
 * LeaveService - Wrapper autour de leavesAPI pour compatibilité avec le code existant
 *
 * Cette classe maintient la même interface que l'ancien service Firebase
 * mais utilise l'API REST backend en interne.
 *
 * Note: Fichier Firebase original sauvegardé dans leave.service.ts.firebase-backup
 */

import { leavesAPI } from './api/leaves.api';
import type { Leave } from '../types';

export class LeaveService {
  /**
   * Récupère les congés d'un utilisateur
   */
  async getLeavesByUser(userId: string): Promise<Leave[]> {
    try {
      const leaves = await leavesAPI.getLeavesByUser(userId);

      // Trier par date de début (plus récent en premier)
      return leaves.sort((a, b) => {
        const dateA = a.startDate instanceof Date ? a.startDate : new Date(a.startDate || 0);
        const dateB = b.startDate instanceof Date ? b.startDate : new Date(b.startDate || 0);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error: any) {
      console.error('Error fetching user leaves:', error);
      return [];
    }
  }

  /**
   * Alias pour compatibilité avec l'ancien code
   */
  async getUserLeaves(userId: string): Promise<Leave[]> {
    return this.getLeavesByUser(userId);
  }

  /**
   * Récupère le solde de congés d'un utilisateur
   * Pour l'instant retourne un solde par défaut (TODO: implémenter le calcul réel)
   */
  async getLeaveBalance(userId: string): Promise<{
    paidLeave: number;
    rtt: number;
    sickLeave: number;
    other: number;
  }> {
    try {
      // TODO: Implémenter le vrai calcul de solde depuis le backend
      // Pour l'instant, on retourne un solde par défaut
      return {
        paidLeave: 25,
        rtt: 10,
        sickLeave: 0,
        other: 0
      };
    } catch (error: any) {
      console.error('Error fetching leave balance:', error);
      return {
        paidLeave: 0,
        rtt: 0,
        sickLeave: 0,
        other: 0
      };
    }
  }

  /**
   * Récupère tous les congés
   * @param filters Filtres optionnels (status, dates, département)
   */
  async getAllLeaves(filters?: {
    status?: string;
    departmentId?: string | null;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Leave[]> {
    try {
      const apiFilters = filters ? {
        status: filters.status,
        departmentId: filters.departmentId ?? undefined, // null devient undefined
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString()
      } : undefined;

      const leaves = await leavesAPI.getAll(apiFilters);

      // Trier par date de début (plus récent en premier)
      return leaves.sort((a, b) => {
        const dateA = a.startDate instanceof Date ? a.startDate : new Date(a.startDate || 0);
        const dateB = b.startDate instanceof Date ? b.startDate : new Date(b.startDate || 0);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error: any) {
      console.error('Error fetching all leaves:', error);
      return [];
    }
  }

  /**
   * Crée une demande de congé
   */
  async createLeaveRequest(data: {
    userId: string;
    type: string;
    startDate: Date;
    endDate: Date;
    days?: number;
    reason?: string;
  }): Promise<Leave> {
    try {
      // Calculer le nombre de jours si non fourni
      const days = data.days || this.calculateLeaveDays(data.startDate, data.endDate);

      const leaveData = {
        type: data.type,
        startDate: data.startDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
        endDate: data.endDate.toISOString().split('T')[0],     // Format: YYYY-MM-DD
        days: days,
        reason: data.reason
      };

      return await leavesAPI.createLeave(leaveData);
    } catch (error: any) {
      console.error('Error creating leave request:', error);
      throw error;
    }
  }

  /**
   * Met à jour une demande de congé
   */
  async updateLeave(leaveId: string, updates: Partial<Leave>): Promise<Leave> {
    try {
      // Convertir les dates si nécessaire
      const apiUpdates = { ...updates };
      if (updates.startDate && updates.startDate instanceof Date) {
        apiUpdates.startDate = updates.startDate.toISOString() as any;
      }
      if (updates.endDate && updates.endDate instanceof Date) {
        apiUpdates.endDate = updates.endDate.toISOString() as any;
      }

      return await leavesAPI.updateLeave(leaveId, apiUpdates);
    } catch (error: any) {
      console.error('Error updating leave:', error);
      throw error;
    }
  }

  /**
   * Approuve une demande de congé
   */
  async approveLeave(leaveId: string): Promise<Leave> {
    try {
      return await leavesAPI.updateLeaveStatus(leaveId, 'APPROVED');
    } catch (error: any) {
      console.error('Error approving leave:', error);
      throw error;
    }
  }

  /**
   * Rejette une demande de congé
   */
  async rejectLeave(leaveId: string, reason?: string): Promise<Leave> {
    try {
      const updates: any = { status: 'REJECTED' };
      if (reason) {
        updates.rejectionReason = reason;
      }
      return await leavesAPI.updateLeave(leaveId, updates);
    } catch (error: any) {
      console.error('Error rejecting leave:', error);
      throw error;
    }
  }

  /**
   * Annule une demande de congé
   */
  async cancelLeave(leaveId: string): Promise<void> {
    try {
      await leavesAPI.updateLeaveStatus(leaveId, 'CANCELLED');
    } catch (error: any) {
      console.error('Error cancelling leave:', error);
      throw error;
    }
  }

  /**
   * Supprime une demande de congé
   */
  async deleteLeave(leaveId: string): Promise<void> {
    try {
      await leavesAPI.deleteLeave(leaveId);
    } catch (error: any) {
      console.error('Error deleting leave:', error);
      throw error;
    }
  }

  /**
   * Récupère les congés pour une période donnée
   */
  async getLeavesByDateRange(startDate: Date, endDate: Date): Promise<Leave[]> {
    try {
      return await this.getAllLeaves({ startDate, endDate });
    } catch (error: any) {
      console.error('Error fetching leaves by date range:', error);
      return [];
    }
  }

  /**
   * Récupère les congés en attente
   */
  async getPendingLeaves(): Promise<Leave[]> {
    try {
      return await this.getAllLeaves({ status: 'PENDING' });
    } catch (error: any) {
      console.error('Error fetching pending leaves:', error);
      return [];
    }
  }

  /**
   * Calcule le nombre de jours de congé
   */
  calculateLeaveDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le dernier jour
    return diffDays;
  }
}

export const leaveService = new LeaveService();
export default leaveService;
