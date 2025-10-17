import { teleworkAPI } from './api/telework.api';
import {
  UserTeleworkProfile,
  TeleworkOverride,
  TeamTeleworkRule,
  TeleworkMode,
  WeekdayPattern,
  WeekdayKey,
  WEEKDAYS,
  ApprovalStatus,
  ValidationResult,
  TeleworkConflict
} from '../types/telework.types';

class TeleworkServiceV2 {
  // =============================================
  // GESTION DES PROFILS UTILISATEUR
  // =============================================

  /**
   * Créer un profil télétravail par défaut pour un utilisateur
   */
  async createDefaultProfile(userId: string, displayName: string, createdBy: string): Promise<UserTeleworkProfile> {
    const profileData = {
      userId,
      displayName,
      defaultMode: 'office' as TeleworkMode,
      weeklyPattern: {
        monday: 'default',
        tuesday: 'default',
        wednesday: 'default',
        thursday: 'default',
        friday: 'default',
        saturday: 'default',
        sunday: 'default'
      },
      constraints: {
        maxRemoteDaysPerWeek: 2,
        maxConsecutiveRemoteDays: 2,
        requiresApproval: false
      },
      isActive: true,
      createdBy
    };

    return await teleworkAPI.createProfile(profileData);
  }

  /**
   * Récupérer le profil télétravail d'un utilisateur
   */
  async getUserProfile(userId: string): Promise<UserTeleworkProfile | null> {
    try {
      const profile = await teleworkAPI.getUserProfile(userId);
      return profile;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }
  }

  /**
   * Mettre à jour un profil télétravail
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<UserTeleworkProfile>,
    updatedBy: string
  ): Promise<void> {
    try {
      await teleworkAPI.updateProfile(userId, {
        ...updates,
        updatedBy
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les profils (pour admin)
   */
  async getAllProfiles(): Promise<UserTeleworkProfile[]> {
    try {
      return await teleworkAPI.getAllProfiles();
    } catch (error) {
      console.error('Erreur lors de la récupération des profils:', error);
      return [];
    }
  }

  /**
   * Récupérer les profils télétravail pour une liste d'utilisateurs spécifiques
   */
  async getAllUserProfiles(userIds: string[]): Promise<UserTeleworkProfile[]> {
    if (userIds.length === 0) return [];

    try {
      // L'API backend gère automatiquement les chunks si nécessaire
      const profiles = await teleworkAPI.getUserProfilesByIds(userIds);
      return profiles;
    } catch (error) {
      console.error('Erreur lors de la récupération des profils par IDs:', error);
      return [];
    }
  }

  // =============================================
  // GESTION DES EXCEPTIONS (OVERRIDES)
  // =============================================

  /**
   * Créer une demande d'exception
   */
  async requestOverride(override: Omit<TeleworkOverride, 'id' | 'createdAt' | 'approvalStatus'>): Promise<string> {
    try {
      // Validation avant création
      const validation = await this.validateOverrideRequest(
        override.userId,
        typeof override.date === 'string' ? new Date(override.date) : override.date,
        override.mode
      );

      const overrideData: any = {
        userId: override.userId,
        date: typeof override.date === 'string' ? override.date : override.date.toISOString().split('T')[0],
        mode: override.mode,
        createdBy: override.createdBy
      };

      // Ajouter reason seulement s'il est défini
      if (override.reason !== undefined) {
        overrideData.reason = override.reason;
      }

      const result = await teleworkAPI.createOverride(overrideData);
      return result.id;
    } catch (error) {
      console.error('Erreur lors de la création de l\'exception:', error);
      throw error;
    }
  }

  /**
   * Approuver une exception
   */
  async approveOverride(overrideId: string, approvedBy: string, reason?: string): Promise<void> {
    try {
      await teleworkAPI.approveOverride(overrideId, {
        approvedBy,
        reason
      });
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      throw error;
    }
  }

  /**
   * Rejeter une exception
   */
  async rejectOverride(overrideId: string, rejectedBy: string, reason: string): Promise<void> {
    try {
      await teleworkAPI.rejectOverride(overrideId, {
        rejectedBy,
        reason
      });
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      throw error;
    }
  }

  /**
   * Supprimer une exception
   */
  async deleteOverride(overrideId: string): Promise<void> {
    try {
      await teleworkAPI.deleteOverride(overrideId);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }

  /**
   * Récupérer les exceptions d'un utilisateur pour une période
   */
  async getUserOverrides(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TeleworkOverride[]> {
    try {
      const overrides = await teleworkAPI.getUserOverrides(
        userId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      return overrides;
    } catch (error) {
      console.error('Erreur lors de la récupération des exceptions:', error);
      return [];
    }
  }

  /**
   * Récupérer les exceptions en attente d'approbation
   */
  async getPendingOverrides(approverId?: string): Promise<TeleworkOverride[]> {
    try {
      const overrides = await teleworkAPI.getPendingOverrides();

      // Filtrer par approbateur si spécifié (logique client-side)
      if (approverId) {
        // Logique pour déterminer qui peut approuver (manager, RH, admin)
        // Pour l'instant, retourner toutes les demandes
      }

      return overrides;
    } catch (error) {
      console.error('Erreur lors de la récupération des approbations:', error);
      return [];
    }
  }

  // =============================================
  // GESTION DES RÈGLES ÉQUIPE
  // =============================================

  /**
   * Créer une règle équipe
   */
  async createTeamRule(rule: Omit<TeamTeleworkRule, 'id' | 'createdAt'>): Promise<string> {
    try {
      const result = await teleworkAPI.createTeamRule(rule);
      return result.id;
    } catch (error) {
      console.error('Erreur lors de la création de la règle équipe:', error);
      throw error;
    }
  }

  /**
   * Récupérer les règles équipe actives pour un utilisateur
   */
  async getTeamRulesForUser(userId: string): Promise<TeamTeleworkRule[]> {
    try {
      return await teleworkAPI.getUserTeamRules(userId);
    } catch (error) {
      console.error('Erreur lors de la récupération des règles équipe:', error);
      return [];
    }
  }

  // =============================================
  // VALIDATION ET LOGIQUE MÉTIER (CLIENT-SIDE)
  // =============================================

  /**
   * Valider une demande d'exception
   * Cette validation reste côté client pour l'UI
   */
  async validateOverrideRequest(
    userId: string,
    date: Date,
    requestedMode: TeleworkMode
  ): Promise<ValidationResult> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        return {
          isValid: false,
          canProceed: false,
          reason: 'Profil télétravail non trouvé',
          conflicts: [],
          requiresApproval: false
        };
      }

      const conflicts: TeleworkConflict[] = [];

      // 1. Vérifier les contraintes hebdomadaires
      if (requestedMode === 'remote') {
        const weekStart = this.getWeekStart(date);
        const weekEnd = this.getWeekEnd(date);
        const remoteDaysInWeek = await this.countRemoteDaysInWeek(userId, weekStart, weekEnd, date);

        if (remoteDaysInWeek >= profile.constraints.maxRemoteDaysPerWeek) {
          conflicts.push({
            type: 'constraint_violation',
            severity: 'error',
            message: `Limite hebdomadaire de ${profile.constraints.maxRemoteDaysPerWeek} jours de télétravail atteinte`,
            source: 'weekly_limit',
            resolutionSuggestions: [
              'Choisir un autre jour de la semaine',
              'Demander une exception à votre manager'
            ]
          });
        }
      }

      // 2. Vérifier les règles équipe
      const teamRules = await this.getTeamRulesForUser(userId);
      const conflictingRules = teamRules.filter(rule =>
        this.isRuleActiveOnDate(rule, date) &&
        rule.requiredMode !== requestedMode &&
        !rule.exemptions.includes(userId)
      );

      if (conflictingRules.length > 0) {
        conflictingRules.forEach(rule => {
          conflicts.push({
            type: 'team_rule_conflict',
            severity: 'warning',
            message: `Conflit avec la règle équipe "${rule.name}"`,
            source: rule.id,
            resolutionSuggestions: [
              'Demander une exemption à votre manager',
              'Choisir un autre jour'
            ]
          });
        });
      }

      // 3. Déterminer si approbation nécessaire
      const requiresApproval =
        profile.constraints.requiresApproval ||
        conflicts.some(c => c.type === 'team_rule_conflict') ||
        conflicts.some(c => c.severity === 'error');

      return {
        isValid: conflicts.filter(c => c.severity === 'error').length === 0,
        canProceed: true,
        conflicts,
        requiresApproval
      };

    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      return {
        isValid: false,
        canProceed: false,
        reason: 'Erreur lors de la validation',
        conflicts: [],
        requiresApproval: false
      };
    }
  }

  // =============================================
  // UTILITAIRES (CLIENT-SIDE)
  // =============================================

  /**
   * Générer un ID unique pour une exception (client-side)
   */
  private generateOverrideId(userId: string, date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${userId}_${year}-${month}-${day}`;
  }

  /**
   * Vérifier si une règle équipe est active à une date donnée
   */
  private isRuleActiveOnDate(rule: TeamTeleworkRule, date: Date): boolean {
    if (!rule.isActive) return false;

    switch (rule.recurrence.type) {
      case 'weekly':
        if (rule.recurrence.weeklyPattern) {
          const dayOfWeek = date.getDay();
          return dayOfWeek === rule.recurrence.weeklyPattern.dayOfWeek;
        }
        break;

      case 'specific_dates':
        if (rule.recurrence.specificDates) {
          return rule.recurrence.specificDates.some(d => {
            const ruleDate = typeof d === 'string' ? new Date(d) : d;
            return ruleDate.toDateString() === date.toDateString();
          });
        }
        break;
    }

    return false;
  }

  /**
   * Compter les jours de télétravail dans une semaine
   */
  private async countRemoteDaysInWeek(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
    excludeDate?: Date
  ): Promise<number> {
    const overrides = await this.getUserOverrides(userId, weekStart, weekEnd);

    let count = 0;
    const current = new Date(weekStart);

    while (current <= weekEnd) {
      // Exclure la date spécifiée du décompte
      if (excludeDate && current.toDateString() === excludeDate.toDateString()) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      // Vérifier s'il y a une exception pour ce jour
      const override = overrides.find(o => {
        const overrideDate = typeof o.date === 'string' ? new Date(o.date) : o.date;
        return overrideDate.toDateString() === current.toDateString() &&
               o.approvalStatus === 'approved';
      });

      if (override && override.mode === 'remote') {
        count++;
      }

      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Obtenir le début de semaine
   */
  private getWeekStart(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Lundi comme début de semaine
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Obtenir la fin de semaine
   */
  private getWeekEnd(date: Date): Date {
    const end = this.getWeekStart(date);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Nettoyer les exceptions expirées
   * Note: Cette opération est maintenant gérée automatiquement par le backend
   */
  async cleanupExpiredOverrides(): Promise<number> {
    console.warn('cleanupExpiredOverrides: Cette opération est maintenant automatique côté backend');
    return 0;
  }

  /**
   * Obtenir un profil avec création automatique si inexistant
   */
  async getOrCreateUserProfile(userId: string, displayName: string, createdBy: string): Promise<UserTeleworkProfile> {
    let profile = await this.getUserProfile(userId);

    if (!profile) {
      profile = await this.createDefaultProfile(userId, displayName, createdBy);
    }

    return profile;
  }

  // =============================================
  // ADAPTATEURS COMPATIBILITÉ REMOTE-WORK
  // (pour migration depuis remote-work.service.ts)
  // =============================================

  /**
   * Récupère le planning simple (format Remote-Work compatible)
   * Convertit le profil Telework en format boolean simple
   */
  async getSimpleRemoteSchedule(userId: string): Promise<{
    userId: string;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
    updatedAt: Date;
    updatedBy: string;
  } | null> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return null;

    // Convertir le pattern Telework en booleans simples
    const weeklyPattern = profile.weeklyPattern;
    return {
      userId,
      monday: weeklyPattern.monday === 'remote',
      tuesday: weeklyPattern.tuesday === 'remote',
      wednesday: weeklyPattern.wednesday === 'remote',
      thursday: weeklyPattern.thursday === 'remote',
      friday: weeklyPattern.friday === 'remote',
      saturday: weeklyPattern.saturday === 'remote',
      sunday: weeklyPattern.sunday === 'remote',
      updatedAt: profile.updatedAt ? new Date(profile.updatedAt) : new Date(),
      updatedBy: profile.updatedBy || userId
    };
  }

  /**
   * Met à jour le planning simple (format Remote-Work compatible)
   */
  async updateSimpleRemoteSchedule(
    userId: string,
    schedule: {
      monday?: boolean;
      tuesday?: boolean;
      wednesday?: boolean;
      thursday?: boolean;
      friday?: boolean;
      saturday?: boolean;
      sunday?: boolean;
    },
    updatedBy: string
  ): Promise<void> {
    // Convertir booleans en modes Telework
    const weeklyPatternUpdate: any = {};

    const days: Array<keyof typeof schedule> = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach(day => {
      if (schedule[day] !== undefined) {
        weeklyPatternUpdate[day] = schedule[day] ? 'remote' : 'office';
      }
    });

    // Si le profil n'existe pas, le créer
    let profile = await this.getUserProfile(userId);
    if (!profile) {
      profile = await this.createDefaultProfile(userId, 'User', updatedBy);
    }

    await this.updateUserProfile(userId, { weeklyPattern: weeklyPatternUpdate }, updatedBy);
  }

  /**
   * Vérifie si un utilisateur est en télétravail (format Remote-Work compatible)
   */
  async isUserRemoteOnDate(userId: string, date: Date): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return false;

    // Vérifier s'il y a une exception (override) pour ce jour
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const overrides = await this.getUserOverrides(userId, startDate, endDate);
    const override = overrides.find(o => {
      const overrideDate = typeof o.date === 'string' ? new Date(o.date) : o.date;
      return overrideDate.toDateString() === date.toDateString() && o.approvalStatus === 'approved';
    });

    if (override) {
      return override.mode === 'remote';
    }

    // Sinon, vérifier le planning hebdomadaire
    const dayOfWeek = date.getDay();
    const dayMapping: Record<number, keyof typeof profile.weeklyPattern> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };

    const dayKey = dayMapping[dayOfWeek];
    return profile.weeklyPattern[dayKey] === 'remote';
  }

  /**
   * Calcule des statistiques simples de télétravail (format Remote-Work compatible)
   */
  async getSimpleRemoteWorkStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalDays: number;
    remoteDays: number;
    officeDays: number;
    remotePercentage: number;
  }> {
    let remoteDays = 0;
    let officeDays = 0;
    let totalDays = 0;

    const current = new Date(startDate);
    while (current <= endDate) {
      // Exclure les weekends
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        totalDays++;

        const isRemote = await this.isUserRemoteOnDate(userId, current);
        if (isRemote) {
          remoteDays++;
        } else {
          officeDays++;
        }
      }

      current.setDate(current.getDate() + 1);
    }

    const remotePercentage = totalDays > 0 ? Math.round((remoteDays / totalDays) * 100) : 0;

    return {
      totalDays,
      remoteDays,
      officeDays,
      remotePercentage
    };
  }
}

export const teleworkServiceV2 = new TeleworkServiceV2();
