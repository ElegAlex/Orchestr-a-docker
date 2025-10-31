import { usersAPI } from './api/users.api';
import { Skill, User } from '../types';

export interface SimpleUser {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
  skills: Skill[];
  workload?: number;
}

class SimpleUserService {
  /**
   * Récupère tous les utilisateurs actifs
   * Migration complète vers API REST backend (17 oct 2025)
   */
  async getAllUsers(): Promise<SimpleUser[]> {
    try {
      // Appel API REST avec filtre isActive
      const response = await usersAPI.getUsers({ isActive: true });

      // Mapper les utilisateurs de l'API vers le format SimpleUser
      const users = response.data.map((user: User) => ({
        id: user.id,
        displayName: user.displayName || `${user.firstName} ${user.lastName}`,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'contributor',
        department: user.department || 'Non spécifié',
        isActive: user.isActive !== false,
        skills: user.skills || [],
        workload: 0, // Workload calculé par le frontend si nécessaire
      } as SimpleUser));

      // Tri par displayName
      return users.sort((a, b) => a.displayName.localeCompare(b.displayName));
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return [];
    }
  }

  getRoleLabel(role: string): string {
    const roleLabels: Record<string, string> = {
      'admin': 'Administrateur',
      'responsable': 'Responsable',
      'manager': 'Chef de projet',
      'teamLead': 'Référent technique',
      'developer': 'Développeur',
      'designer': 'Designer',
      'contributor': 'Contributeur',
      'viewer': 'Observateur',
    };
    return roleLabels[role] || role;
  }

  getRoleColor(role: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" {
    const roleColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
      'admin': 'error',
      'manager': 'warning',
      'developer': 'primary',
      'designer': 'secondary',
      'contributor': 'info',
      'viewer': 'default',
    };
    return roleColors[role] || 'default';
  }

  getWorkloadColor(workload: number): "success" | "warning" | "error" {
    if (workload <= 70) return 'success';
    if (workload <= 90) return 'warning';
    return 'error';
  }

  getAvailabilityStatus(workload: number): string {
    if (workload <= 50) return 'Très disponible';
    if (workload <= 70) return 'Disponible';
    if (workload <= 90) return 'Occupé';
    return 'Surchargé';
  }

  /**
   * Met à jour un utilisateur
   * Migration complète vers API REST backend (17 oct 2025)
   */
  async updateUser(userId: string, updates: Partial<SimpleUser>): Promise<void> {
    try {
      // Mapper SimpleUser updates vers UpdateUserDto
      const updateData: any = {};

      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
      if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      // Note: skills et department peuvent nécessiter des endpoints dédiés selon le backend

      await usersAPI.updateUser(userId, updateData);
      console.log('✅ Utilisateur mis à jour:', userId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }
}

export const simpleUserService = new SimpleUserService();