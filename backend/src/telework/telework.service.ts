import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserTeleworkProfileDto,
  UpdateUserTeleworkProfileDto,
  CreateTeleworkOverrideDto,
  UpdateTeleworkOverrideDto,
  ApproveTeleworkOverrideDto,
  CreateTeamTeleworkRuleDto,
  UpdateTeamTeleworkRuleDto,
  ValidateOverrideRequestDto,
  GetOverridesQueryDto,
  ValidationResult,
  TeleworkConflict,
} from './telework.dto';
import { TeleworkMode, ApprovalStatus } from '@prisma/client';

@Injectable()
export class TeleworkService {
  constructor(private prisma: PrismaService) {}

  // =============================================
  // GESTION DES PROFILS UTILISATEUR
  // =============================================

  /**
   * Créer un profil télétravail par défaut pour un utilisateur
   */
  async createDefaultProfile(
    userId: string,
    displayName: string,
    createdBy: string,
  ) {
    const profile = await this.prisma.userTeleworkProfile.create({
      data: {
        userId,
        displayName,
        defaultMode: 'ONSITE',
        weeklyPattern: {
          monday: 'default',
          tuesday: 'default',
          wednesday: 'default',
          thursday: 'default',
          friday: 'default',
          saturday: 'default',
          sunday: 'default',
        },
        constraints: {
          maxRemoteDaysPerWeek: 2,
          maxConsecutiveRemoteDays: 2,
          requiresApproval: false,
        },
        isActive: true,
        createdBy,
        updatedBy: createdBy,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            departmentId: true,
          },
        },
      },
    });

    return profile;
  }

  /**
   * Récupérer le profil télétravail d'un utilisateur
   */
  async getUserProfile(userId: string) {
    const profile = await this.prisma.userTeleworkProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            departmentId: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(
        `Profil télétravail non trouvé pour l'utilisateur ${userId}`,
      );
    }

    return profile;
  }

  /**
   * Mettre à jour un profil télétravail
   */
  async updateUserProfile(userId: string, dto: UpdateUserTeleworkProfileDto) {
    // Vérifier que le profil existe
    await this.getUserProfile(userId);

    const updateData: any = {
      updatedBy: dto.updatedBy,
    };

    if (dto.displayName !== undefined) updateData.displayName = dto.displayName;
    if (dto.defaultMode !== undefined) updateData.defaultMode = dto.defaultMode;
    if (dto.weeklyPattern !== undefined)
      updateData.weeklyPattern = dto.weeklyPattern;
    if (dto.constraints !== undefined)
      updateData.constraints = dto.constraints;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const profile = await this.prisma.userTeleworkProfile.update({
      where: { userId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            departmentId: true,
          },
        },
      },
    });

    return profile;
  }

  /**
   * Récupérer tous les profils (pour admin)
   */
  async getAllProfiles() {
    const profiles = await this.prisma.userTeleworkProfile.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            departmentId: true,
          },
        },
      },
      orderBy: { displayName: 'asc' },
    });

    return profiles;
  }

  /**
   * Récupérer les profils télétravail pour une liste d'utilisateurs spécifiques
   */
  async getAllUserProfiles(userIds: string[]) {
    if (userIds.length === 0) return [];

    const profiles = await this.prisma.userTeleworkProfile.findMany({
      where: {
        userId: { in: userIds },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            departmentId: true,
          },
        },
      },
    });

    return profiles;
  }

  /**
   * Obtenir un profil avec création automatique si inexistant
   */
  async getOrCreateUserProfile(
    userId: string,
    displayName: string,
    createdBy: string,
  ) {
    try {
      const profile = await this.getUserProfile(userId);
      return profile;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return this.createDefaultProfile(userId, displayName, createdBy);
      }
      throw error;
    }
  }

  /**
   * Créer un profil utilisateur avec données complètes
   */
  async createUserProfile(dto: CreateUserTeleworkProfileDto) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur ${dto.userId} non trouvé`);
    }

    // Vérifier qu'un profil n'existe pas déjà
    const existingProfile = await this.prisma.userTeleworkProfile.findUnique({
      where: { userId: dto.userId },
    });

    if (existingProfile) {
      throw new BadRequestException(
        `Un profil télétravail existe déjà pour l'utilisateur ${dto.userId}`,
      );
    }

    const profile = await this.prisma.userTeleworkProfile.create({
      data: {
        userId: dto.userId,
        displayName: dto.displayName,
        defaultMode: dto.defaultMode || 'ONSITE',
        weeklyPattern: (dto.weeklyPattern || {
          monday: 'default',
          tuesday: 'default',
          wednesday: 'default',
          thursday: 'default',
          friday: 'default',
          saturday: 'default',
          sunday: 'default',
        }) as any,
        constraints: (dto.constraints || {
          maxRemoteDaysPerWeek: 2,
          maxConsecutiveRemoteDays: 2,
          requiresApproval: false,
        }) as any,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        createdBy: dto.createdBy,
        updatedBy: dto.createdBy,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            departmentId: true,
          },
        },
      },
    });

    return profile;
  }

  // =============================================
  // GESTION DES EXCEPTIONS (OVERRIDES)
  // =============================================

  /**
   * Créer une demande d'exception
   */
  async requestOverride(dto: CreateTeleworkOverrideDto) {
    // Validation avant création
    const validation = await this.validateOverrideRequest({
      userId: dto.userId,
      date: dto.date,
      requestedMode: dto.mode,
    });

    // Générer ID unique pour éviter les doublons
    const overrideId = this.generateOverrideId(dto.userId, new Date(dto.date));

    // Vérifier si une demande existe déjà pour ce jour
    const existingOverride = await this.prisma.teleworkOverride.findUnique({
      where: { id: overrideId },
    });

    if (existingOverride) {
      throw new BadRequestException(
        `Une demande d'exception existe déjà pour cette date`,
      );
    }

    const approvalStatus = validation.requiresApproval
      ? ApprovalStatus.PENDING
      : ApprovalStatus.APPROVED;

    const override = await this.prisma.teleworkOverride.create({
      data: {
        id: overrideId,
        userId: dto.userId,
        date: new Date(dto.date),
        mode: dto.mode,
        reason: dto.reason,
        approvalStatus,
        createdBy: dto.createdBy,
        // Si pas besoin d'approbation, approuver automatiquement
        approvedBy: validation.requiresApproval ? null : dto.createdBy,
        approvedAt: validation.requiresApproval ? null : new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            departmentId: true,
          },
        },
      },
    });

    return override;
  }

  /**
   * Approuver une exception
   */
  async approveOverride(overrideId: string, dto: ApproveTeleworkOverrideDto) {
    const override = await this.prisma.teleworkOverride.findUnique({
      where: { id: overrideId },
    });

    if (!override) {
      throw new NotFoundException(
        `Exception ${overrideId} non trouvée`,
      );
    }

    if (override.approvalStatus !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        `Cette exception a déjà été ${override.approvalStatus === ApprovalStatus.APPROVED ? 'approuvée' : 'rejetée'}`,
      );
    }

    const updatedOverride = await this.prisma.teleworkOverride.update({
      where: { id: overrideId },
      data: {
        approvalStatus: ApprovalStatus.APPROVED,
        approvedBy: dto.approvedBy,
        approvedAt: new Date(),
        rejectionReason: null,
        updatedBy: dto.approvedBy,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            departmentId: true,
          },
        },
      },
    });

    return updatedOverride;
  }

  /**
   * Rejeter une exception
   */
  async rejectOverride(overrideId: string, dto: ApproveTeleworkOverrideDto) {
    const override = await this.prisma.teleworkOverride.findUnique({
      where: { id: overrideId },
    });

    if (!override) {
      throw new NotFoundException(
        `Exception ${overrideId} non trouvée`,
      );
    }

    if (override.approvalStatus !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        `Cette exception a déjà été ${override.approvalStatus === ApprovalStatus.APPROVED ? 'approuvée' : 'rejetée'}`,
      );
    }

    if (!dto.rejectionReason) {
      throw new BadRequestException(
        'Une raison de rejet est obligatoire',
      );
    }

    const updatedOverride = await this.prisma.teleworkOverride.update({
      where: { id: overrideId },
      data: {
        approvalStatus: ApprovalStatus.REJECTED,
        approvedBy: dto.approvedBy,
        approvedAt: new Date(),
        rejectionReason: dto.rejectionReason,
        updatedBy: dto.approvedBy,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            departmentId: true,
          },
        },
      },
    });

    return updatedOverride;
  }

  /**
   * Supprimer une exception
   */
  async deleteOverride(overrideId: string) {
    const override = await this.prisma.teleworkOverride.findUnique({
      where: { id: overrideId },
    });

    if (!override) {
      throw new NotFoundException(
        `Exception ${overrideId} non trouvée`,
      );
    }

    await this.prisma.teleworkOverride.delete({
      where: { id: overrideId },
    });

    return { message: 'Exception supprimée avec succès', id: overrideId };
  }

  /**
   * Récupérer les exceptions d'un utilisateur pour une période
   */
  async getUserOverrides(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const overrides = await this.prisma.teleworkOverride.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            departmentId: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return overrides;
  }

  /**
   * Récupérer les exceptions en attente d'approbation
   */
  async getPendingOverrides(approverId?: string) {
    const overrides = await this.prisma.teleworkOverride.findMany({
      where: {
        approvalStatus: ApprovalStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            departmentId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // TODO: Filtrer par approbateur si spécifié (logique manager/RH)
    return overrides;
  }

  /**
   * Récupérer les exceptions avec filtres
   */
  async getOverrides(query: GetOverridesQueryDto) {
    const where: any = {};

    if (query.userId) where.userId = query.userId;
    if (query.status) where.approvalStatus = query.status;

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const overrides = await this.prisma.teleworkOverride.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            departmentId: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return overrides;
  }

  /**
   * Nettoyer les exceptions expirées
   */
  async cleanupExpiredOverrides() {
    const now = new Date();

    const result = await this.prisma.teleworkOverride.deleteMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });

    return {
      message: `${result.count} exception(s) expirée(s) supprimée(s)`,
      count: result.count,
    };
  }

  // =============================================
  // GESTION DES RÈGLES ÉQUIPE
  // =============================================

  /**
   * Créer une règle équipe
   */
  async createTeamRule(dto: CreateTeamTeleworkRuleDto) {
    const rule = await this.prisma.teamTeleworkRule.create({
      data: {
        name: dto.name,
        description: dto.description,
        teamId: dto.teamId,
        departmentId: dto.departmentId,
        affectedUserIds: dto.affectedUserIds,
        exemptions: dto.exemptions || [],
        requiredMode: dto.requiredMode,
        recurrence: dto.recurrence as any,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        createdBy: dto.createdBy,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return rule;
  }

  /**
   * Récupérer toutes les règles équipe
   */
  async getAllTeamRules() {
    const rules = await this.prisma.teamTeleworkRule.findMany({
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rules;
  }

  /**
   * Récupérer les règles équipe actives pour un utilisateur
   */
  async getTeamRulesForUser(userId: string) {
    const rules = await this.prisma.teamTeleworkRule.findMany({
      where: {
        isActive: true,
        affectedUserIds: {
          has: userId,
        },
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rules;
  }

  /**
   * Mettre à jour une règle équipe
   */
  async updateTeamRule(ruleId: string, dto: UpdateTeamTeleworkRuleDto) {
    const rule = await this.prisma.teamTeleworkRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new NotFoundException(`Règle équipe ${ruleId} non trouvée`);
    }

    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.teamId !== undefined) updateData.teamId = dto.teamId;
    if (dto.departmentId !== undefined)
      updateData.departmentId = dto.departmentId;
    if (dto.affectedUserIds !== undefined)
      updateData.affectedUserIds = dto.affectedUserIds;
    if (dto.exemptions !== undefined) updateData.exemptions = dto.exemptions;
    if (dto.requiredMode !== undefined)
      updateData.requiredMode = dto.requiredMode;
    if (dto.recurrence !== undefined) updateData.recurrence = dto.recurrence;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.updatedBy !== undefined) updateData.updatedBy = dto.updatedBy;

    const updatedRule = await this.prisma.teamTeleworkRule.update({
      where: { id: ruleId },
      data: updateData,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedRule;
  }

  /**
   * Supprimer une règle équipe
   */
  async deleteTeamRule(ruleId: string) {
    const rule = await this.prisma.teamTeleworkRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new NotFoundException(`Règle équipe ${ruleId} non trouvée`);
    }

    await this.prisma.teamTeleworkRule.delete({
      where: { id: ruleId },
    });

    return { message: 'Règle équipe supprimée avec succès', id: ruleId };
  }

  // =============================================
  // VALIDATION ET LOGIQUE MÉTIER
  // =============================================

  /**
   * Valider une demande d'exception
   */
  async validateOverrideRequest(
    dto: ValidateOverrideRequestDto,
  ): Promise<ValidationResult> {
    try {
      // Récupérer le profil utilisateur
      let profile;
      try {
        profile = await this.getUserProfile(dto.userId);
      } catch (error) {
        return {
          isValid: false,
          canProceed: false,
          reason: 'Profil télétravail non trouvé',
          conflicts: [],
          requiresApproval: false,
        };
      }

      const conflicts: TeleworkConflict[] = [];
      const date = new Date(dto.date);

      // 1. Vérifier les contraintes hebdomadaires
      if (dto.requestedMode === 'REMOTE') {
        const weekStart = this.getWeekStart(date);
        const weekEnd = this.getWeekEnd(date);
        const remoteDaysInWeek = await this.countRemoteDaysInWeek(
          dto.userId,
          weekStart,
          weekEnd,
          date,
        );

        const maxRemoteDays = (profile.constraints as any)
          .maxRemoteDaysPerWeek || 2;

        if (remoteDaysInWeek >= maxRemoteDays) {
          conflicts.push({
            type: 'constraint_violation',
            severity: 'error',
            message: `Limite hebdomadaire de ${maxRemoteDays} jours de télétravail atteinte`,
            source: 'weekly_limit',
            resolutionSuggestions: [
              'Choisir un autre jour de la semaine',
              'Demander une exception à votre manager',
            ],
          });
        }
      }

      // 2. Vérifier les règles équipe
      const teamRules = await this.getTeamRulesForUser(dto.userId);
      const conflictingRules = teamRules.filter(
        (rule) =>
          this.isRuleActiveOnDate(rule, date) &&
          rule.requiredMode !== dto.requestedMode &&
          !rule.exemptions.includes(dto.userId),
      );

      if (conflictingRules.length > 0) {
        conflictingRules.forEach((rule) => {
          conflicts.push({
            type: 'team_rule_conflict',
            severity: 'warning',
            message: `Conflit avec la règle équipe "${rule.name}"`,
            source: rule.id,
            resolutionSuggestions: [
              'Demander une exemption à votre manager',
              'Choisir un autre jour',
            ],
          });
        });
      }

      // 3. Déterminer si approbation nécessaire
      const requiresApproval =
        (profile.constraints as any).requiresApproval ||
        conflicts.some((c) => c.type === 'team_rule_conflict') ||
        conflicts.some((c) => c.severity === 'error');

      return {
        isValid: conflicts.filter((c) => c.severity === 'error').length === 0,
        canProceed: true,
        conflicts,
        requiresApproval,
      };
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      return {
        isValid: false,
        canProceed: false,
        reason: 'Erreur lors de la validation',
        conflicts: [],
        requiresApproval: false,
      };
    }
  }

  // =============================================
  // UTILITAIRES
  // =============================================

  /**
   * Générer un ID unique pour une exception
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
  private isRuleActiveOnDate(rule: any, date: Date): boolean {
    if (!rule.isActive) return false;

    const recurrence = rule.recurrence as any;

    switch (recurrence.type) {
      case 'weekly':
        if (recurrence.weeklyPattern) {
          const dayOfWeek = date.getDay();
          return dayOfWeek === recurrence.weeklyPattern.dayOfWeek;
        }
        break;

      case 'specific_dates':
        if (recurrence.specificDates && Array.isArray(recurrence.specificDates)) {
          return recurrence.specificDates.some((d: string) => {
            const specificDate = new Date(d);
            return specificDate.toDateString() === date.toDateString();
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
    excludeDate?: Date,
  ): Promise<number> {
    const overrides = await this.getUserOverrides(userId, weekStart, weekEnd);

    let count = 0;
    const current = new Date(weekStart);

    while (current <= weekEnd) {
      // Exclure la date spécifiée du décompte
      if (
        excludeDate &&
        current.toDateString() === excludeDate.toDateString()
      ) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      // Vérifier s'il y a une exception pour ce jour
      const override = overrides.find(
        (o) =>
          new Date(o.date).toDateString() === current.toDateString() &&
          o.approvalStatus === ApprovalStatus.APPROVED,
      );

      if (override && override.mode === 'REMOTE') {
        count++;
      }

      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Obtenir le début de semaine (lundi)
   */
  private getWeekStart(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Lundi comme début
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Obtenir la fin de semaine (dimanche)
   */
  private getWeekEnd(date: Date): Date {
    const end = this.getWeekStart(date);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}
