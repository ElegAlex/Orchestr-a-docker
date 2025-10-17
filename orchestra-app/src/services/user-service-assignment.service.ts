/**
 * User Service Assignment Service - Version REST API
 *
 * Ce service a été migré de Firebase vers REST API.
 * Gère les assignations des utilisateurs aux services métier.
 *
 * @see /home/alex/Documents/Repository/orchestr-a-docker/backend/src/user-service-assignments
 * @see user-service-assignment.service.ts.firebase-backup Pour l'ancienne version Firebase
 */

import { userServiceAssignmentsApi, UserServiceAssignment, CreateAssignmentDto } from './api/user-service-assignments.api';
import { User } from '../types';

// Note: Ce service est maintenant simplifié car la logique multi-services
// est gérée par le modèle UserServiceAssignment dans PostgreSQL

export class UserServiceAssignmentService {
  /**
   * Assigne un utilisateur à un service
   * Note: Crée une nouvelle assignation active
   */
  async assignUserToService(userId: string, serviceId: string | null): Promise<void> {
    try {
      if (!serviceId) {
        // Si serviceId est null, on désactive toutes les assignations de l'utilisateur
        const assignments = await userServiceAssignmentsApi.getByUser(userId);
        await Promise.all(
          assignments.map(a => userServiceAssignmentsApi.update(a.id, { isActive: false }))
        );
        return;
      }

      const dto: CreateAssignmentDto = {
        userId,
        serviceId,
        isActive: true,
      };

      await userServiceAssignmentsApi.create(dto);
    } catch (error) {
      console.error('Error assigning user to service:', error);
      throw error;
    }
  }

  /**
   * Ajoute un service à un utilisateur (pour multi-services)
   */
  async addServiceToUser(userId: string, serviceId: string): Promise<void> {
    try {
      const dto: CreateAssignmentDto = {
        userId,
        serviceId,
        isActive: true,
      };
      await userServiceAssignmentsApi.create(dto);
    } catch (error) {
      // Si l'assignation existe déjà, on l'ignore
      if ((error as any)?.response?.status === 400) {
        console.log('Assignment already exists, skipping');
        return;
      }
      console.error('Error adding service to user:', error);
      throw error;
    }
  }

  /**
   * Retire un service d'un utilisateur
   */
  async removeServiceFromUser(userId: string, serviceId: string): Promise<void> {
    try {
      const assignments = await userServiceAssignmentsApi.getByUser(userId);
      const assignment = assignments.find(a => a.serviceId === serviceId);

      if (assignment) {
        await userServiceAssignmentsApi.delete(assignment.id);
      }
    } catch (error) {
      console.error('Error removing service from user:', error);
      throw error;
    }
  }

  /**
   * Définit tous les services d'un utilisateur (remplace la liste existante)
   */
  async setUserServices(userId: string, serviceIds: string[]): Promise<void> {
    try {
      // Désactiver toutes les assignations existantes
      const currentAssignments = await userServiceAssignmentsApi.getByUser(userId);
      await Promise.all(
        currentAssignments.map(a => userServiceAssignmentsApi.update(a.id, { isActive: false }))
      );

      // Créer les nouvelles assignations
      await Promise.all(
        serviceIds.map(serviceId => this.addServiceToUser(userId, serviceId))
      );
    } catch (error) {
      console.error('Error setting user services:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les utilisateurs d'un service
   */
  async getUsersByService(serviceId: string): Promise<User[]> {
    try {
      const assignments = await userServiceAssignmentsApi.getByService(serviceId);
      return assignments
        .filter(a => a.user)
        .map(a => ({
          id: a.user!.id,
          email: a.user!.email,
          firstName: a.user!.firstName,
          lastName: a.user!.lastName,
          role: a.user!.role as any,
          isActive: true,
          createdAt: new Date(),
          lastLoginAt: undefined,
          updatedAt: new Date(),
        } as User));
    } catch (error) {
      console.error('Error fetching users by service:', error);
      throw error;
    }
  }

  /**
   * Récupère les utilisateurs non assignés à aucun service
   */
  async getUnassignedUsers(): Promise<User[]> {
    try {
      const stats = await userServiceAssignmentsApi.getStats();
      // Note: Cette méthode nécessiterait un endpoint dédié pour être précise
      // Pour l'instant, on retourne une liste vide
      console.warn('getUnassignedUsers: méthode simplifiée, utiliser l\'endpoint users avec filtres');
      return [];
    } catch (error) {
      console.error('Error fetching unassigned users:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques d'affectation des services
   */
  async getServiceAssignmentStats(): Promise<{
    totalUsers: number;
    assignedUsers: number;
    unassignedUsers: number;
    serviceBreakdown: Array<{
      serviceId: string;
      serviceName: string;
      userCount: number;
      users: User[];
    }>;
  }> {
    try {
      const stats = await userServiceAssignmentsApi.getStats();

      // Transformation pour compatibilité avec l'ancien format
      return {
        totalUsers: stats.totalUsers,
        assignedUsers: stats.assignedUsersCount,
        unassignedUsers: stats.unassignedUsersCount,
        serviceBreakdown: [], // Nécessiterait des appels supplémentaires
      };
    } catch (error) {
      console.error('Error fetching service assignment stats:', error);
      throw error;
    }
  }

  /**
   * Transfère tous les utilisateurs d'un service vers un autre
   */
  async transferUsersToService(fromServiceId: string, toServiceId: string | null): Promise<void> {
    try {
      const assignments = await userServiceAssignmentsApi.getByService(fromServiceId);

      await Promise.all(
        assignments.map(async (assignment) => {
          // Désactiver l'ancienne assignation
          await userServiceAssignmentsApi.update(assignment.id, { isActive: false });

          // Créer la nouvelle assignation si toServiceId n'est pas null
          if (toServiceId) {
            await this.addServiceToUser(assignment.userId, toServiceId);
          }
        })
      );
    } catch (error) {
      console.error('Error transferring users between services:', error);
      throw error;
    }
  }
}

export const userServiceAssignmentService = new UserServiceAssignmentService();
