import { milestoneApi } from './api/milestone.api';
import { Milestone, MilestoneStatus, MilestoneType, Deliverable, MilestoneDependency } from '../types';

/**
 * Service Milestones - Migré vers API REST
 */
class MilestoneService {
  /**
   * Créer un nouveau Milestone
   */
  async createMilestone(milestone: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const created = await milestoneApi.create({
        projectId: milestone.projectId,
        name: milestone.name,
        description: milestone.description || '',
        code: milestone.code || '',
        type: milestone.type || 'MINOR',
        dueDate: milestone.dueDate.toISOString(),
        startDate: milestone.startDate?.toISOString(),
        followsTasks: milestone.followsTasks ?? false,
        isKeyDate: milestone.isKeyDate ?? false,
        deliverables: milestone.deliverables || [],
        successCriteria: milestone.successCriteria || [],
        ownerId: milestone.ownerId,
        reviewers: milestone.reviewers || [],
        completionRate: milestone.completionRate ?? 0,
        dependsOn: milestone.dependsOn || [],
        epicIds: milestone.epicIds || [],
        taskIds: milestone.taskIds || [],
        validationRequired: milestone.validationRequired ?? false,
        impact: milestone.impact || 'MEDIUM',
        affectedTeams: milestone.affectedTeams || [],
        color: milestone.color || '#3b82f6',
        icon: milestone.icon,
        showOnRoadmap: milestone.showOnRoadmap ?? true,
      });

      return created.id;
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw error;
    }
  }

  /**
   * Obtenir tous les milestones d'un projet
   */
  async getProjectMilestones(projectId: string): Promise<Milestone[]> {
    try {
      const milestones = await milestoneApi.getByProject(projectId);

      return milestones.map(this.convertFromApi);
    } catch (error) {
      console.error('Error getting project milestones:', error);
      return [];
    }
  }

  /**
   * Obtenir un milestone par son ID
   */
  async getMilestoneById(milestoneId: string): Promise<Milestone | null> {
    try {
      const milestone = await milestoneApi.getById(milestoneId);
      return this.convertFromApi(milestone);
    } catch (error) {
      console.error('Error getting milestone:', error);
      return null;
    }
  }

  /**
   * Mettre à jour un milestone
   */
  async updateMilestone(milestoneId: string, updates: Partial<Milestone>): Promise<void> {
    try {
      const updateData: any = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.code !== undefined) updateData.code = updates.code;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate.toISOString();
      if (updates.startDate !== undefined) updateData.startDate = updates.startDate.toISOString();
      if (updates.followsTasks !== undefined) updateData.followsTasks = updates.followsTasks;
      if (updates.isKeyDate !== undefined) updateData.isKeyDate = updates.isKeyDate;
      if (updates.deliverables !== undefined) updateData.deliverables = updates.deliverables;
      if (updates.successCriteria !== undefined) updateData.successCriteria = updates.successCriteria;
      if (updates.reviewers !== undefined) updateData.reviewers = updates.reviewers;
      if (updates.completionRate !== undefined) updateData.completionRate = updates.completionRate;
      if (updates.dependsOn !== undefined) updateData.dependsOn = updates.dependsOn;
      if (updates.epicIds !== undefined) updateData.epicIds = updates.epicIds;
      if (updates.taskIds !== undefined) updateData.taskIds = updates.taskIds;
      if (updates.validationRequired !== undefined) updateData.validationRequired = updates.validationRequired;
      if (updates.impact !== undefined) updateData.impact = updates.impact;
      if (updates.affectedTeams !== undefined) updateData.affectedTeams = updates.affectedTeams;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.showOnRoadmap !== undefined) updateData.showOnRoadmap = updates.showOnRoadmap;

      await milestoneApi.update(milestoneId, updateData);
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw error;
    }
  }

  /**
   * Ajouter un livrable à un milestone
   */
  async addDeliverable(milestoneId: string, deliverable: Deliverable): Promise<void> {
    try {
      const milestone = await this.getMilestoneById(milestoneId);
      if (!milestone) throw new Error('Milestone not found');

      const deliverables = [...(milestone.deliverables || []), deliverable];
      await this.updateMilestone(milestoneId, { deliverables });
    } catch (error) {
      console.error('Error adding deliverable:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un livrable
   */
  async updateDeliverable(milestoneId: string, deliverableId: string, updates: Partial<Deliverable>): Promise<void> {
    try {
      const milestone = await this.getMilestoneById(milestoneId);
      if (!milestone) throw new Error('Milestone not found');

      const deliverables = (milestone.deliverables || []).map((d: Deliverable) =>
        d.id === deliverableId ? { ...d, ...updates } : d
      );

      await this.updateMilestone(milestoneId, { deliverables });
    } catch (error) {
      console.error('Error updating deliverable:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le taux de completion d'un milestone - SUPPRIMÉ
   * Le calcul automatique a été désactivé car il était trompeur
   */
  async updateMilestoneCompletion(milestoneId: string): Promise<void> {
    // Méthode désactivée - le calcul automatique était trompeur
    console.log(`⚠️ Milestone completion calculation disabled for ${milestoneId}`);
  }

  /**
   * Valider un milestone
   */
  async validateMilestone(milestoneId: string, validatorId: string, notes?: string): Promise<void> {
    try {
      await milestoneApi.validate(milestoneId, validatorId, notes);
    } catch (error) {
      console.error('Error validating milestone:', error);
      throw error;
    }
  }

  /**
   * Récupérer les milestones d'un projet
   */
  async getMilestonesByProject(projectId: string): Promise<Milestone[]> {
    return this.getProjectMilestones(projectId);
  }

  /**
   * Obtenir les milestones par statut
   */
  async getMilestonesByStatus(projectId: string, status: MilestoneStatus): Promise<Milestone[]> {
    try {
      const milestones = await milestoneApi.getByProjectAndStatus(projectId, status);
      return milestones.map(this.convertFromApi);
    } catch (error) {
      console.error('Error getting milestones by status:', error);
      return [];
    }
  }

  /**
   * Obtenir les milestones à risque (date dépassée)
   */
  async getAtRiskMilestones(projectId: string): Promise<Milestone[]> {
    try {
      const milestones = await milestoneApi.getAtRisk(projectId);
      return milestones.map(this.convertFromApi);
    } catch (error) {
      console.error('Error getting at-risk milestones:', error);
      return [];
    }
  }

  /**
   * Obtenir les prochains milestones (dans les 30 jours)
   */
  async getUpcomingMilestones(projectId: string, days: number = 30): Promise<Milestone[]> {
    try {
      const milestones = await milestoneApi.getUpcoming(projectId, days);
      return milestones.map(this.convertFromApi);
    } catch (error) {
      console.error('Error getting upcoming milestones:', error);
      return [];
    }
  }

  /**
   * Ajouter une dépendance à un milestone
   */
  async addMilestoneDependency(milestoneId: string, dependency: MilestoneDependency): Promise<void> {
    try {
      const milestone = await this.getMilestoneById(milestoneId);
      if (!milestone) throw new Error('Milestone not found');

      const dependencies = [...(milestone.dependsOn || []), dependency];
      await this.updateMilestone(milestoneId, { dependsOn: dependencies });
    } catch (error) {
      console.error('Error adding milestone dependency:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un milestone peut être démarré (dépendances satisfaites)
   */
  async canMilestoneStart(milestoneId: string): Promise<{ canStart: boolean; blockedBy: string[] }> {
    try {
      const milestone = await this.getMilestoneById(milestoneId);
      if (!milestone) return { canStart: false, blockedBy: ['Milestone not found'] };

      const blockedBy: string[] = [];

      // Vérifier les dépendances
      for (const dep of milestone.dependsOn || []) {
        if (dep.type === 'milestone') {
          const depMilestone = await this.getMilestoneById(dep.id);
          if (!depMilestone || depMilestone.status !== 'completed') {
            blockedBy.push(`Milestone: ${dep.name}`);
          }
        } else if (dep.type === 'epic') {
          // Note: Cette vérification nécessiterait un service Epic
          blockedBy.push(`Epic: ${dep.name} (vérification non implémentée)`);
        }
      }

      return {
        canStart: blockedBy.length === 0,
        blockedBy,
      };
    } catch (error) {
      console.error('Error checking milestone dependencies:', error);
      return { canStart: false, blockedBy: ['Error checking dependencies'] };
    }
  }

  /**
   * Supprimer un milestone
   */
  async deleteMilestone(milestoneId: string): Promise<void> {
    try {
      await milestoneApi.delete(milestoneId);
    } catch (error) {
      console.error('Error deleting milestone:', error);
      throw error;
    }
  }

  /**
   * Calculer les métriques des milestones d'un projet
   */
  async getProjectMilestoneMetrics(projectId: string): Promise<{
    totalMilestones: number;
    completedMilestones: number;
    atRiskMilestones: number;
    upcomingMilestones: number;
    averageCompletion: number;
    keyDatesCount: number;
  }> {
    try {
      return await milestoneApi.getProjectMetrics(projectId);
    } catch (error) {
      console.error('Error calculating milestone metrics:', error);
      return {
        totalMilestones: 0,
        completedMilestones: 0,
        atRiskMilestones: 0,
        upcomingMilestones: 0,
        averageCompletion: 0,
        keyDatesCount: 0,
      };
    }
  }

  /**
   * Force le recalcul de tous les jalons d'un projet
   * Utile pour la maintenance ou la correction des données
   */
  async recalculateProjectMilestonesCompletion(projectId: string): Promise<void> {
    console.log(`⚠️ Milestone completion recalculation disabled for project ${projectId}`);
  }

  /**
   * Convertir un milestone de l'API vers le format frontend
   */
  private convertFromApi(milestone: any): Milestone {
    return {
      ...milestone,
      dueDate: new Date(milestone.dueDate),
      startDate: milestone.startDate ? new Date(milestone.startDate) : undefined,
      validatedAt: milestone.validatedAt ? new Date(milestone.validatedAt) : undefined,
      createdAt: new Date(milestone.createdAt),
      updatedAt: new Date(milestone.updatedAt),
    };
  }
}

export const milestoneService = new MilestoneService();

// Fonction de test globale pour debug
(window as any).testMilestoneCompletion = async (milestoneId: string) => {
  console.log(`🧪 [TEST] Testing milestone completion for: ${milestoneId}`);
  await milestoneService.updateMilestoneCompletion(milestoneId);
};
