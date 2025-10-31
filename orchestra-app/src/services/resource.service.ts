/**
 * Resource Service - Agrégateur de services
 *
 * Ce service agrège les fonctionnalités de plusieurs services backend :
 * - Skills API (Service 24) : Gestion des compétences
 * - Capacity API (Service 23) : Calcul de charge et disponibilité
 * - Users API : Profils utilisateurs
 * - Leaves API : Gestion des congés
 *
 * Note: Ce service remplace l'ancien service Firebase qui était un monolithe.
 * Maintenant, chaque domaine est géré par son propre service backend dédié.
 */

import {
  skillsAPI,
  capacityApi,
  usersAPI,
  leavesAPI,
  type UserSkill,
  type Skill,
  type CreateUserSkillRequest,
  type WorkContract,
  type ResourceAllocation,
  type UserCapacity,
  type Leave,
} from './api';

/**
 * Types additionnels pour compatibilité avec l'ancien service
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  role: string;
  departmentId?: string;
  isActive?: boolean;
  avatarUrl?: string;
  phoneNumber?: string;
  jobTitle?: string;
  bio?: string;
  preferences?: any;
  lastActivityAt?: Date;
}

export interface WorkloadSnapshot {
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  capacity: {
    theoretical: number;
    net: number;
    available: number;
  };
  allocated: {
    confirmed: number;
    tentative: number;
    total: number;
  };
  deductions: {
    leaves: number;
    training: number;
    meetings: number;
    other: number;
  };
  overloadRisk: 'none' | 'low' | 'medium' | 'high' | 'critical';
  calculatedAt: Date;
  validUntil: Date;
}

export interface WorkloadCalculation {
  userId: string;
  period: { start: Date; end: Date };
  availability: WorkloadSnapshot;
  suggestions: AllocationSuggestion[];
  alerts: WorkloadAlert[];
}

export interface AllocationSuggestion {
  type: 'reallocation' | 'skill_match' | 'availability';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  actions: string[];
}

export interface WorkloadAlert {
  id: string;
  userId: string;
  type: 'overload' | 'underload' | 'skill_gap';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  createdAt: Date;
}

export interface WorkingHours {
  weeklyHours: number;
  dailyHours: number;
  workingDays: string[];
}

export interface ProductivityProfile {
  rate: number;
  peakHours?: string[];
  preferredTaskTypes?: string[];
}

export interface UserPreferences {
  theme?: string;
  language?: string;
  notifications?: any;
}

/**
 * Service Resource - Agrégateur
 */
export class ResourceService {
  // =============================================================================
  // GESTION DES UTILISATEURS ÉTENDUS
  // =============================================================================

  /**
   * Met à jour le profil de travail d'un utilisateur
   */
  async updateUserWorkingProfile(
    userId: string,
    profile: {
      workingHours?: WorkingHours;
      productivity?: ProductivityProfile;
      preferences?: UserPreferences;
    }
  ): Promise<void> {
    // Utiliser l'API Users pour mettre à jour le profil
    const updateData: any = {};

    if (profile.preferences) {
      updateData.preferences = profile.preferences;
    }

    if (Object.keys(updateData).length > 0) {
      await usersAPI.update(userId, updateData);
    }
  }

  /**
   * Récupère un utilisateur avec son profil complet
   */
  async getUserWithProfile(userId: string): Promise<User | null> {
    try {
      const user = await usersAPI.getById(userId);
      return user as User;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Récupère tous les utilisateurs avec leurs profils
   */
  async getAllUsersWithProfiles(): Promise<User[]> {
    try {
      const users = await usersAPI.getAll({ isActive: true });
      return users as User[];
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  // =============================================================================
  // GESTION DES COMPÉTENCES
  // =============================================================================

  /**
   * Ajoute une compétence à un utilisateur
   */
  async addUserSkill(
    userId: string,
    skill: Omit<UserSkill, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<UserSkill> {
    const skillData: CreateUserSkillRequest = {
      skillId: skill.skillId,
      level: skill.level,
      yearsOfExperience: skill.yearsOfExperience,
      certifications: skill.certifications,
      notes: skill.notes,
    };

    return await skillsAPI.addUserSkill(userId, skillData);
  }

  /**
   * Met à jour une compétence utilisateur
   */
  async updateUserSkill(
    userId: string,
    skillId: string,
    updates: Partial<UserSkill>
  ): Promise<void> {
    await skillsAPI.updateUserSkill(userId, skillId, updates);
  }

  /**
   * Supprime une compétence utilisateur
   */
  async deleteUserSkill(userId: string, skillId: string): Promise<void> {
    await skillsAPI.deleteUserSkill(userId, skillId);
  }

  /**
   * Met à jour toutes les compétences d'un utilisateur (batch)
   */
  async updateUserSkills(userId: string, skills: UserSkill[]): Promise<void> {
    // Récupérer les compétences existantes
    const existingSkills = await this.getUserSkills(userId);

    // Supprimer les compétences qui ne sont plus dans la nouvelle liste
    const newSkillIds = new Set(skills.map((s) => s.skillId));
    for (const existing of existingSkills) {
      if (!newSkillIds.has(existing.skillId)) {
        await this.deleteUserSkill(userId, existing.id);
      }
    }

    // Ajouter ou mettre à jour les compétences
    for (const skill of skills) {
      const existing = existingSkills.find((s) => s.skillId === skill.skillId);
      if (existing) {
        await this.updateUserSkill(userId, existing.id, skill);
      } else {
        await this.addUserSkill(userId, skill);
      }
    }
  }

  /**
   * Récupère les compétences d'un utilisateur
   */
  async getUserSkills(userId: string): Promise<UserSkill[]> {
    try {
      return await skillsAPI.getUserSkills(userId);
    } catch (error) {
      console.error('Error fetching user skills:', error);
      return [];
    }
  }

  /**
   * Trouve des utilisateurs par compétence
   */
  async findUsersBySkill(
    skillName: string,
    minLevel: string = 'BEGINNER'
  ): Promise<User[]> {
    try {
      // Utiliser l'API Skills pour obtenir des recommandations
      // (cette fonctionnalité pourrait être ajoutée au backend Skills)
      const allUsers = await this.getAllUsersWithProfiles();
      const usersWithSkill: User[] = [];

      for (const user of allUsers) {
        const skills = await this.getUserSkills(user.id);
        const hasSkill = skills.some(
          (skill) =>
            skill.skill?.name.toLowerCase().includes(skillName.toLowerCase()) &&
            this.compareSkillLevels(skill.level, minLevel)
        );

        if (hasSkill) {
          usersWithSkill.push(user);
        }
      }

      return usersWithSkill;
    } catch (error) {
      console.error('Error finding users by skill:', error);
      return [];
    }
  }

  private compareSkillLevels(userLevel: string, requiredLevel: string): boolean {
    const levelOrder = ['BEGINNER', 'INTERMEDIATE', 'EXPERT'];
    const userIndex = levelOrder.indexOf(userLevel.toUpperCase());
    const requiredIndex = levelOrder.indexOf(requiredLevel.toUpperCase());
    return userIndex >= requiredIndex;
  }

  // =============================================================================
  // GESTION DES CONGÉS (WRAPPER)
  // =============================================================================

  /**
   * Crée un congé (wrapper vers leavesAPI)
   */
  async createLeave(
    leave: Omit<Leave, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Leave> {
    return await leavesAPI.create(leave as any);
  }

  /**
   * Met à jour un congé
   */
  async updateLeave(leaveId: string, updates: Partial<Leave>): Promise<void> {
    await leavesAPI.update(leaveId, updates);
  }

  /**
   * Approuve un congé
   */
  async approveLeave(leaveId: string, approvedBy: string): Promise<void> {
    await leavesAPI.approve(leaveId);
  }

  /**
   * Récupère les congés d'un utilisateur
   */
  async getUserLeaves(userId: string, status?: string): Promise<Leave[]> {
    const params: any = { userId };
    if (status) params.status = status;
    return await leavesAPI.getAll(params);
  }

  /**
   * Récupère les congés sur une période
   */
  async getLeavesByPeriod(startDate: Date, endDate: Date): Promise<Leave[]> {
    return await leavesAPI.getAll({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'APPROVED',
    });
  }

  // =============================================================================
  // CALCUL DE CHARGE ET DISPONIBILITÉ
  // =============================================================================

  /**
   * Calcule la charge de travail d'un utilisateur sur une période
   */
  async calculateUserWorkload(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WorkloadCalculation> {
    try {
      // Utiliser l'API Capacity pour calculer la charge
      const capacity = await capacityApi.calculateUserCapacity(userId, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      // Convertir en format WorkloadCalculation
      const snapshot: WorkloadSnapshot = {
        userId,
        weekStart: startDate,
        weekEnd: endDate,
        capacity: {
          theoretical: capacity.theoreticalDays * 7, // Approximation en heures
          net: capacity.availableDays * 7,
          available: capacity.remainingDays * 7,
        },
        allocated: {
          confirmed: capacity.allocatedDays * 7,
          tentative: 0,
          total: capacity.allocatedDays * 7,
        },
        deductions: {
          leaves: (capacity.theoreticalDays - capacity.availableDays) * 7,
          training: 0,
          meetings: 0,
          other: 0,
        },
        overloadRisk: this.calculateOverloadRisk(
          capacity.allocatedDays,
          capacity.availableDays
        ),
        calculatedAt: new Date(),
        validUntil: new Date(Date.now() + 60 * 60 * 1000), // 1h
      };

      // Générer des alertes basées sur la capacité
      const alerts: WorkloadAlert[] = [];
      if (capacity.alerts && capacity.alerts.length > 0) {
        capacity.alerts.forEach((alert: any) => {
          alerts.push({
            id: `alert_${userId}_${Date.now()}`,
            userId,
            type: alert.type === 'OVERALLOCATION' ? 'overload' : 'underload',
            severity: alert.severity.toLowerCase() as any,
            message: alert.message,
            threshold: capacity.availableDays,
            currentValue: capacity.allocatedDays,
            createdAt: new Date(),
          });
        });
      }

      return {
        userId,
        period: { start: startDate, end: endDate },
        availability: snapshot,
        suggestions: [],
        alerts,
      };
    } catch (error) {
      console.error('Error calculating workload:', error);
      // Retourner un calcul vide en cas d'erreur
      return this.getEmptyWorkloadCalculation(userId, startDate, endDate);
    }
  }

  private calculateOverloadRisk(
    allocated: number,
    available: number
  ): WorkloadSnapshot['overloadRisk'] {
    if (available === 0) return 'critical';
    const ratio = allocated / available;
    if (ratio > 1.1) return 'critical';
    if (ratio > 1.0) return 'high';
    if (ratio > 0.9) return 'medium';
    if (ratio > 0.8) return 'low';
    return 'none';
  }

  private getEmptyWorkloadCalculation(
    userId: string,
    startDate: Date,
    endDate: Date
  ): WorkloadCalculation {
    return {
      userId,
      period: { start: startDate, end: endDate },
      availability: {
        userId,
        weekStart: startDate,
        weekEnd: endDate,
        capacity: { theoretical: 0, net: 0, available: 0 },
        allocated: { confirmed: 0, tentative: 0, total: 0 },
        deductions: { leaves: 0, training: 0, meetings: 0, other: 0 },
        overloadRisk: 'none',
        calculatedAt: new Date(),
        validUntil: new Date(Date.now() + 60 * 60 * 1000),
      },
      suggestions: [],
      alerts: [],
    };
  }

  // =============================================================================
  // AFFECTATIONS DES RESSOURCES (WRAPPER CAPACITY API)
  // =============================================================================

  /**
   * Crée une allocation de ressource
   */
  async createAllocation(
    allocation: Omit<ResourceAllocation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ResourceAllocation> {
    return await capacityApi.createAllocation(allocation as any);
  }

  /**
   * Met à jour une allocation
   */
  async updateAllocation(
    allocationId: string,
    updates: Partial<ResourceAllocation>
  ): Promise<void> {
    await capacityApi.updateAllocation(allocationId, updates);
  }

  /**
   * Confirme une allocation
   */
  async confirmAllocation(allocationId: string): Promise<void> {
    // Status est géré via updateAllocation
    await capacityApi.updateAllocation(allocationId, { status: 'CONFIRMED' });
  }

  /**
   * Récupère les allocations d'un utilisateur
   */
  async getUserAllocations(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ResourceAllocation[]> {
    const params: any = {};
    if (startDate) params.startDate = startDate.toISOString().split('T')[0];
    if (endDate) params.endDate = endDate.toISOString().split('T')[0];

    return await capacityApi.getUserAllocations(userId, params);
  }

  /**
   * Récupère les allocations d'un projet
   */
  async getProjectAllocations(projectId: string): Promise<ResourceAllocation[]> {
    return await capacityApi.getProjectAllocations(projectId);
  }

  // =============================================================================
  // OPTIMISATION ET SUGGESTIONS
  // =============================================================================

  /**
   * Suggère une allocation de ressource basée sur les compétences et disponibilité
   */
  async suggestResourceAllocation(taskRequirements: {
    requiredSkills: string[];
    estimatedHours: number;
    startDate: Date;
    endDate: Date;
  }): Promise<
    { user: User; matchScore: number; availability: WorkloadSnapshot }[]
  > {
    try {
      const users = await this.getAllUsersWithProfiles();
      const suggestions: {
        user: User;
        matchScore: number;
        availability: WorkloadSnapshot;
      }[] = [];

      for (const user of users) {
        // Calculer le score de correspondance des compétences
        const userSkills = await this.getUserSkills(user.id);
        const matchScore = this.calculateSkillMatchScore(
          userSkills,
          taskRequirements.requiredSkills
        );

        if (matchScore > 0) {
          // Vérifier la disponibilité
          const workload = await this.calculateUserWorkload(
            user.id,
            taskRequirements.startDate,
            taskRequirements.endDate
          );

          suggestions.push({
            user,
            matchScore,
            availability: workload.availability,
          });
        }
      }

      // Trier par score de correspondance et disponibilité
      return suggestions.sort((a, b) => {
        const scoreComparison = b.matchScore - a.matchScore;
        if (scoreComparison !== 0) return scoreComparison;

        return (
          b.availability.capacity.available - a.availability.capacity.available
        );
      });
    } catch (error) {
      console.error('Error suggesting resource allocation:', error);
      return [];
    }
  }

  /**
   * Analyse la charge de travail d'une équipe
   */
  async analyzeTeamWorkload(
    userIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<{
    teamMetrics: any;
    individualAnalyses: any[];
    teamOptimizations: any[];
  }> {
    try {
      const individualAnalyses = [];

      for (const userId of userIds) {
        const workload = await this.calculateUserWorkload(
          userId,
          startDate,
          endDate
        );
        const capacity = workload.availability;

        individualAnalyses.push({
          userId,
          utilizationRate:
            capacity.capacity.net > 0
              ? (capacity.allocated.total / capacity.capacity.net) * 100
              : 0,
          efficiencyScore: 80, // Valeur par défaut
          overloadRisk: capacity.overloadRisk,
          availableCapacity: capacity.capacity.available,
        });
      }

      const teamMetrics = {
        averageUtilization:
          individualAnalyses.reduce(
            (sum, calc) => sum + (calc.utilizationRate || 0),
            0
          ) / individualAnalyses.length,
        teamEfficiency:
          individualAnalyses.reduce(
            (sum, calc) => sum + (calc.efficiencyScore || 0),
            0
          ) / individualAnalyses.length,
      };

      return {
        teamMetrics,
        individualAnalyses,
        teamOptimizations: [],
      };
    } catch (error) {
      console.error('Error analyzing team workload:', error);
      return {
        teamMetrics: { averageUtilization: 0, teamEfficiency: 0 },
        individualAnalyses: [],
        teamOptimizations: [],
      };
    }
  }

  /**
   * Obtient des suggestions d'optimisation de charge
   */
  async getWorkloadOptimizations(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      const workload = await this.calculateUserWorkload(userId, startDate, endDate);

      if (workload.alerts.length > 0) {
        return workload.alerts.map((alert) => ({
          type: 'reallocation',
          description: alert.message,
          severity: alert.severity,
          recommendations: [
            'Réaffecter certaines tâches',
            'Étaler la charge sur plusieurs semaines',
            'Augmenter l\'équipe projet',
          ],
        }));
      }

      return [];
    } catch (error) {
      console.error('Error getting workload optimizations:', error);
      return [];
    }
  }

  private calculateSkillMatchScore(
    userSkills: UserSkill[],
    requiredSkills: string[]
  ): number {
    if (requiredSkills.length === 0) return 1;

    let matchCount = 0;
    let totalWeight = 0;

    requiredSkills.forEach((requiredSkill) => {
      const userSkill = userSkills.find((skill) =>
        skill.skill?.name.toLowerCase().includes(requiredSkill.toLowerCase())
      );

      if (userSkill) {
        const levelWeight = this.getSkillLevelWeight(userSkill.level);
        matchCount += levelWeight;
      }
      totalWeight += 1;
    });

    return totalWeight > 0 ? matchCount / totalWeight : 0;
  }

  private getSkillLevelWeight(level: string): number {
    const weights = {
      BEGINNER: 0.25,
      INTERMEDIATE: 0.5,
      EXPERT: 1.0,
    };
    return weights[level as keyof typeof weights] || 0;
  }

  // =============================================================================
  // UTILITAIRES
  // =============================================================================

  /**
   * Calcule le nombre de jours ouvrés entre deux dates
   */
  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Pas dimanche (0) ni samedi (6)
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Abonnements temps réel (stubs - à implémenter avec WebSockets si nécessaire)
   */
  subscribeToUserWorkload(
    userId: string,
    callback: (workload: WorkloadSnapshot[]) => void
  ): () => void {
    console.warn('Real-time subscriptions not implemented in REST API version');
    // Retourner une fonction de désabonnement vide
    return () => {};
  }

  subscribeToTeamWorkload(
    userIds: string[],
    callback: (workloads: { userId: string; workload: WorkloadSnapshot }[]) => void
  ): () => void {
    console.warn('Real-time subscriptions not implemented in REST API version');
    return () => {};
  }
}

export const resourceService = new ResourceService();
