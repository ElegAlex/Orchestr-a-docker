/**
 * Service de gestion des présences
 * Calcule qui est présent sur site, en télétravail ou absent pour une date donnée
 * Migré vers API REST
 */

import { presenceApi } from './api/presence.api';
import { User } from '../types';

export interface PresenceStatus {
  onSite: UserPresence[];
  telework: UserPresence[];
  absent: UserPresence[];
  byDepartment?: DepartmentPresence[]; // Pour les responsables
}

export interface DepartmentPresence {
  departmentName: string;
  onSite: UserPresence[];
  telework: UserPresence[];
  absent: UserPresence[];
  totalUsers: number;
}

export interface UserPresence {
  user: User;
  status: 'on_site' | 'telework' | 'absent';
  details?: string; // Ex: "Congé payé", "Télétravail validé"
  validationStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
}

class PresenceService {
  /**
   * Récupère les présences pour une date donnée
   * @param date Date à analyser
   * @param currentUserDepartment Département de l'utilisateur courant (pour filtrage)
   */
  async getPresencesForDate(
    date: Date,
    currentUserDepartment?: string | null,
  ): Promise<PresenceStatus> {
    try {
      const dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      // Si un département est spécifié, on doit passer l'ID du département
      // NOTE: L'ancien code utilisait le NOM du département, mais l'API attend l'ID
      // Pour l'instant, on passe undefined car on n'a pas l'ID
      // TODO: Adapter pour passer le departmentId au lieu du nom
      const departmentId = undefined; // currentUserDepartment serait le nom, pas l'ID

      const result = await presenceApi.getPresencesForDate(dateStr, departmentId);

      // Mapper le format API vers le format attendu par le frontend
      return {
        onSite: result.onSite.map((p: any) => ({
          user: this.mapUserFromApi(p.user),
          status: p.status,
          details: p.details,
          validationStatus: p.validationStatus,
        })),
        telework: result.telework.map((p: any) => ({
          user: this.mapUserFromApi(p.user),
          status: p.status,
          details: p.details,
          validationStatus: p.validationStatus,
        })),
        absent: result.absent.map((p: any) => ({
          user: this.mapUserFromApi(p.user),
          status: p.status,
          details: p.details,
          validationStatus: p.validationStatus,
        })),
        byDepartment: result.byDepartment?.map((dept: any) => ({
          departmentName: dept.departmentName,
          onSite: dept.onSite.map((p: any) => ({
            user: this.mapUserFromApi(p.user),
            status: p.status,
            details: p.details,
            validationStatus: p.validationStatus,
          })),
          telework: dept.telework.map((p: any) => ({
            user: this.mapUserFromApi(p.user),
            status: p.status,
            details: p.details,
            validationStatus: p.validationStatus,
          })),
          absent: dept.absent.map((p: any) => ({
            user: this.mapUserFromApi(p.user),
            status: p.status,
            details: p.details,
            validationStatus: p.validationStatus,
          })),
          totalUsers: dept.totalUsers,
        })),
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des présences:', error);
      throw error;
    }
  }

  /**
   * Statistiques pour une date donnée
   * @param date Date à analyser
   * @param currentUserDepartment Département de l'utilisateur courant (pour filtrage)
   */
  async getPresenceStats(
    date: Date,
    currentUserDepartment?: string | null,
  ): Promise<{
    totalUsers: number;
    onSiteCount: number;
    teleworkCount: number;
    absentCount: number;
    onSitePercentage: number;
    teleworkPercentage: number;
  }> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const departmentId = undefined; // TODO: convertir nom → ID

      return await presenceApi.getPresenceStats(dateStr, departmentId);
    } catch (error) {
      console.error('Erreur lors du calcul des stats de présence:', error);
      throw error;
    }
  }

  /**
   * Mapper un utilisateur depuis l'API vers le format User du frontend
   */
  private mapUserFromApi(apiUser: any): User {
    return {
      id: apiUser.id,
      email: apiUser.email,
      firstName: apiUser.firstName,
      lastName: apiUser.lastName,
      role: apiUser.role,
      department: apiUser.department?.name,
      departmentId: apiUser.department?.id,
      isActive: true, // Valeur par défaut
    };
  }
}

export const presenceService = new PresenceService();
