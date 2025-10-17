import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnalyticsPeriod,
  AnalyticsCacheType,
  TaskStatus,
  ProjectStatus,
} from '@prisma/client';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  differenceInHours,
} from 'date-fns';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  // ==========================================
  // KPIs GLOBAUX
  // ==========================================

  async getGlobalKPIs(filters?: {
    startDate?: Date;
    endDate?: Date;
    projects?: string[];
    users?: string[];
  }) {
    try {
      const dateRange = {
        start: filters?.startDate || startOfMonth(new Date()),
        end: filters?.endDate || endOfMonth(new Date()),
      };

      // Projets actifs
      const activeProjects = await this.prisma.project.count({
        where: {
          status: {
            in: [ProjectStatus.ACTIVE, ProjectStatus.DRAFT],
          },
        },
      });

      // Taux de complétion des tâches
      const taskCompletion = await this.getTaskCompletionRate(dateRange);
      const previousTaskCompletion = await this.getTaskCompletionRate({
        start: subMonths(dateRange.start, 1),
        end: subMonths(dateRange.end, 1),
      });

      // Utilisation des ressources
      const resourceUtilization = await this.getResourceUtilizationRate(
        dateRange,
      );

      // Productivité équipe
      const teamProductivity = await this.getTeamProductivityScore(dateRange);

      // Respect des délais
      const onTimeDelivery = await this.getOnTimeDeliveryRate(dateRange);

      const kpis = [
        {
          id: 'active-projects',
          name: 'Projets Actifs',
          value: activeProjects,
          category: 'project',
          trend: 'stable' as const,
          updatedAt: new Date(),
        },
        {
          id: 'task-completion-rate',
          name: 'Taux de Complétion',
          value: taskCompletion,
          previousValue: previousTaskCompletion,
          trend:
            taskCompletion > previousTaskCompletion
              ? ('up' as const)
              : taskCompletion < previousTaskCompletion
                ? ('down' as const)
                : ('stable' as const),
          trendPercentage: previousTaskCompletion
            ? ((taskCompletion - previousTaskCompletion) /
                previousTaskCompletion) *
              100
            : 0,
          unit: '%',
          target: 85,
          threshold: { warning: 70, critical: 50 },
          category: 'task',
          updatedAt: new Date(),
        },
        {
          id: 'resource-utilization',
          name: 'Utilisation Ressources',
          value: resourceUtilization,
          unit: '%',
          target: 75,
          trend: 'stable' as const,
          threshold: { warning: 60, critical: 40 },
          category: 'resource',
          updatedAt: new Date(),
        },
        {
          id: 'team-productivity',
          name: 'Productivité Équipe',
          value: teamProductivity,
          unit: '/10',
          target: 8,
          trend: 'up' as const,
          threshold: { warning: 6, critical: 4 },
          category: 'resource',
          updatedAt: new Date(),
        },
        {
          id: 'on-time-delivery',
          name: 'Respect des Délais',
          value: onTimeDelivery,
          unit: '%',
          target: 90,
          trend: 'stable' as const,
          threshold: { warning: 75, critical: 60 },
          category: 'project',
          updatedAt: new Date(),
        },
      ];

      // Mettre en cache
      await this.cacheMetrics(
        `kpi_global_${dateRange.start.toISOString()}_${dateRange.end.toISOString()}`,
        AnalyticsCacheType.KPI,
        kpis,
        filters,
        1800, // 30 minutes
      );

      return kpis;
    } catch (error) {
      this.logger.error('Error calculating global KPIs:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTRIQUES PROJET
  // ==========================================

  async getProjectMetrics(projectId: string, dateRange?: {
    start: Date;
    end: Date;
  }) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: true,
          members: true,
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const range = dateRange || {
        start: project.startDate,
        end: new Date(),
      };

      const tasks = project.tasks;
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED)
        .length;
      const inProgressTasks = tasks.filter(
        (t) => t.status === TaskStatus.IN_PROGRESS,
      ).length;
      const blockedTasks = 0; // No BLOCKED status in current schema
      // tasks.filter((t) => t.status === TaskStatus.BLOCKED).length;
      const overdueTasks = tasks.filter(
        (t) =>
          t.dueDate &&
          t.dueDate < new Date() &&
          t.status !== TaskStatus.COMPLETED,
      ).length;

      const completionRate =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const averageTaskDuration = await this.calculateAverageTaskDuration(
        tasks,
      );

      return {
        projectId,
        projectName: project.name,
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        overdueTasks,
        completionRate,
        averageTaskDuration,
        teamSize: project.members.length,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting project metrics:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTRIQUES RESSOURCE
  // ==========================================

  async getResourceMetrics(userId: string, dateRange?: {
    start: Date;
    end: Date;
  }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const range = dateRange || {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
      };

      const userTasks = await this.prisma.task.findMany({
        where: {
          assigneeId: userId,
          updatedAt: {
            gte: range.start,
            lte: range.end,
          },
        },
      });

      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(
        (t) => t.status === TaskStatus.COMPLETED,
      ).length;
      const averageTaskDuration = await this.calculateAverageTaskDuration(
        userTasks,
      );

      // Calculer les métriques via TimeEntries
      const timeEntries = await this.prisma.timeEntry.findMany({
        where: {
          userId,
          date: {
            gte: range.start,
            lte: range.end,
          },
        },
      });

      const totalHours =
        timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 60; // Convertir minutes en heures
      const billableHours =
        timeEntries
          .filter((e) => e.isBillable)
          .reduce((sum, entry) => sum + entry.duration, 0) / 60;

      const workingDays = Math.ceil(
        (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24),
      );
      const utilization = (totalHours / (workingDays * 8)) * 100; // Assuming 8h/day

      return {
        userId,
        userName: user.firstName + " " + user.lastName || user.email,
        totalTasks,
        completedTasks,
        averageTaskDuration,
        totalHours,
        billableHours,
        utilization: Math.min(utilization, 100),
        productivity:
          completedTasks > 0
            ? Math.min((completedTasks / totalTasks) * 10, 10)
            : 0,
        lastActive: user.lastActivityAt || user.updatedAt,
      };
    } catch (error) {
      this.logger.error('Error getting resource metrics:', error);
      throw error;
    }
  }

  // ==========================================
  // RAPPORTS EXÉCUTIFS
  // ==========================================

  async generateExecutiveReport(period: AnalyticsPeriod, userId: string) {
    try {
      const now = new Date();
      let startDate: Date, endDate: Date;

      switch (period) {
        case AnalyticsPeriod.WEEK:
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case AnalyticsPeriod.MONTH:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case AnalyticsPeriod.QUARTER:
          const quarterStart = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStart, 1);
          endDate = new Date(now.getFullYear(), quarterStart + 3, 0);
          break;
        case AnalyticsPeriod.YEAR:
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
      }

      const dateRange = { start: startDate, end: endDate };

      // Calculer KPIs globaux
      const globalKPIs = {
        projectsCompleted: await this.getCompletedProjectsCount(dateRange),
        tasksCompleted: await this.getCompletedTasksCount(dateRange),
        teamProductivity: await this.getTeamProductivityScore(dateRange),
        budgetUtilization: 0, // TODO: Implement if budget tracking added
        clientSatisfaction: 0, // TODO: Implement if feedback added
        resourceUtilization: await this.getResourceUtilizationRate(dateRange),
      };

      // Métriques par département
      const departments = await this.prisma.department.findMany();
      const departmentMetrics: Record<string, any> = {};

      for (const dept of departments) {
        const deptUsers = await this.prisma.user.count({
          where: { departmentId: dept.id },
        });
        departmentMetrics[dept.name] = {
          productivity: 7 + Math.random() * 2, // Simulation
          utilization: 70 + Math.random() * 20, // Simulation
          satisfaction: 7.5 + Math.random() * 1.5, // Simulation
          userCount: deptUsers,
        };
      }

      // Trends (simplified)
      const trends = {
        projectDelivery: 'improving' as const,
        teamPerformance: 'stable' as const,
        budgetControl: 'improving' as const,
      };

      // Alerts (simplified)
      const overdueTasks = await this.prisma.task.count({
        where: {
          dueDate: { lt: now },
          status: { not: TaskStatus.COMPLETED },
        },
      });

      const alerts = [];
      if (overdueTasks > 10) {
        alerts.push({
          type: 'deadline',
          severity: 'high',
          message: `${overdueTasks} tâches en retard`,
        });
      }

      const report = await this.prisma.analyticsReport.create({
        data: {
          period,
          startDate,
          endDate,
          globalKPIs,
          departmentMetrics,
          trends,
          alerts,
          generatedBy: userId,
        },
      });

      return report;
    } catch (error) {
      this.logger.error('Error generating executive report:', error);
      throw error;
    }
  }

  async getReports(userId: string, filters?: {
    period?: AnalyticsPeriod;
    startDate?: Date;
    endDate?: Date;
  }) {
    return this.prisma.analyticsReport.findMany({
      where: {
        ...(filters?.period && { period: filters.period }),
        ...(filters?.startDate && {
          startDate: { gte: filters.startDate },
        }),
        ...(filters?.endDate && {
          endDate: { lte: filters.endDate },
        }),
      },
      orderBy: { generatedAt: 'desc' },
      take: 50,
    });
  }

  async getReportById(id: string) {
    return this.prisma.analyticsReport.findUnique({
      where: { id },
    });
  }

  // ==========================================
  // MÉTHODES PRIVÉES
  // ==========================================

  private async getTaskCompletionRate(dateRange: {
    start: Date;
    end: Date;
  }): Promise<number> {
    const tasks = await this.prisma.task.findMany({
      where: {
        updatedAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });

    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    return (completed / tasks.length) * 100;
  }

  private async getResourceUtilizationRate(dateRange: {
    start: Date;
    end: Date;
  }): Promise<number> {
    const users = await this.prisma.user.count();
    if (users === 0) return 0;

    // Calcul basé sur time entries
    const timeEntries = await this.prisma.timeEntry.aggregate({
      where: {
        date: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      _avg: {
        duration: true,
      },
    });

    const avgMinutesPerDay = timeEntries._avg.duration || 0;
    const avgHoursPerDay = avgMinutesPerDay / 60;
    return Math.min((avgHoursPerDay / 8) * 100, 100); // 8h working day
  }

  private async getTeamProductivityScore(dateRange: {
    start: Date;
    end: Date;
  }): Promise<number> {
    const completionRate = await this.getTaskCompletionRate(dateRange);
    const utilizationRate = await this.getResourceUtilizationRate(dateRange);
    return (completionRate * 0.6 + utilizationRate * 0.4) / 10;
  }

  private async getOnTimeDeliveryRate(dateRange: {
    start: Date;
    end: Date;
  }): Promise<number> {
    const completedTasks = await this.prisma.task.findMany({
      where: {
        status: TaskStatus.COMPLETED,
        completedAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });

    if (completedTasks.length === 0) return 100;

    const onTime = completedTasks.filter(
      (t) =>
        !t.dueDate ||
        !t.completedAt ||
        t.completedAt <= new Date(t.dueDate),
    ).length;

    return (onTime / completedTasks.length) * 100;
  }

  private async getCompletedProjectsCount(dateRange: {
    start: Date;
    end: Date;
  }): Promise<number> {
    return this.prisma.project.count({
      where: {
        status: ProjectStatus.COMPLETED,
        updatedAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });
  }

  private async getCompletedTasksCount(dateRange: {
    start: Date;
    end: Date;
  }): Promise<number> {
    return this.prisma.task.count({
      where: {
        status: TaskStatus.COMPLETED,
        completedAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });
  }

  private async calculateAverageTaskDuration(tasks: any[]): Promise<number> {
    const completed = tasks.filter(
      (t) => t.status === TaskStatus.COMPLETED && t.createdAt && t.completedAt,
    );
    if (completed.length === 0) return 0;

    const totalHours = completed.reduce((sum, task) => {
      const hours = differenceInHours(
        new Date(task.completedAt),
        new Date(task.createdAt),
      );
      return sum + hours;
    }, 0);

    return totalHours / completed.length;
  }

  // ==========================================
  // CACHE
  // ==========================================

  private async cacheMetrics(
    key: string,
    type: AnalyticsCacheType,
    data: any,
    filters: any = null,
    ttlSeconds: number = 3600,
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      await this.prisma.analyticsCache.upsert({
        where: { cacheKey: key },
        update: {
          data,
          filters,
          expiresAt,
          updatedAt: new Date(),
        },
        create: {
          type,
          cacheKey: key,
          data,
          filters,
          expiresAt,
        },
      });
    } catch (error) {
      this.logger.error('Error caching metrics:', error);
    }
  }

  async getCachedMetrics(key: string): Promise<any | null> {
    try {
      const cached = await this.prisma.analyticsCache.findUnique({
        where: {
          cacheKey: key,
          expiresAt: { gt: new Date() },
        },
      });

      return cached?.data || null;
    } catch (error) {
      this.logger.error('Error getting cached metrics:', error);
      return null;
    }
  }

  async clearCache(type?: AnalyticsCacheType): Promise<void> {
    await this.prisma.analyticsCache.deleteMany({
      where: type ? { type } : {},
    });
  }

  async cleanExpiredCache(): Promise<void> {
    await this.prisma.analyticsCache.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }

  // ==========================================
  // HR ANALYTICS - MÉTRIQUES RH
  // ==========================================

  /**
   * Calcule les métriques RH globales pour une période
   */
  async getHRMetrics(period: { startDate: Date; endDate: Date; label?: string }) {
    try {
      const cacheKey = `hr_metrics_${period.startDate.toISOString()}_${period.endDate.toISOString()}`;

      // Vérifier le cache
      const cached = await this.getCachedMetrics(cacheKey);
      if (cached) return cached;

      // Récupérer tous les utilisateurs actifs
      const users = await this.prisma.user.findMany({
        include: {
          department: true,
        },
      });
      const activeEmployees = users.filter((u) => u.isActive);

      // Récupérer les demandes de congés pour la période
      const leaves = await this.prisma.leave.findMany({
        where: {
          startDate: {
            gte: period.startDate,
            lte: period.endDate,
          },
        },
        include: {
          user: {
            include: {
              department: true,
            },
          },
        },
      });

      const approvedLeaves = leaves.filter((l) => l.status === 'APPROVED');
      const rejectedLeaves = leaves.filter((l) => l.status === 'REJECTED');
      const pendingLeaves = leaves.filter((l) => l.status === 'PENDING');

      const totalLeaveDays = approvedLeaves.reduce((sum, l) => sum + Number(l.days), 0);

      // Calculer les statistiques
      const leaveTypeBreakdown = this.calculateLeaveTypeStats(leaves);
      const monthlyTrends = this.calculateMonthlyTrends(leaves, period);
      const departmentStats = await this.calculateDepartmentStats(leaves, users);
      const topLeaveUsers = this.calculateTopLeaveUsers(leaves, users);
      const absenteeismRate = this.calculateAbsenteeismRate(
        totalLeaveDays,
        activeEmployees.length,
        period,
      );
      const averageApprovalTime = this.calculateAverageApprovalTime(approvedLeaves);

      const metrics = {
        period: {
          startDate: period.startDate,
          endDate: period.endDate,
          label: period.label || '',
        },
        totalEmployees: users.length,
        activeEmployees: activeEmployees.length,
        totalLeaveRequests: leaves.length,
        totalLeaveDays,
        approvedLeaveRequests: approvedLeaves.length,
        rejectedLeaveRequests: rejectedLeaves.length,
        pendingLeaveRequests: pendingLeaves.length,
        averageLeaveDaysPerEmployee:
          activeEmployees.length > 0 ? totalLeaveDays / activeEmployees.length : 0,
        leaveTypeBreakdown,
        monthlyTrends,
        departmentStats,
        topLeaveUsers,
        absenteeismRate,
        leaveApprovalRate: leaves.length > 0 ? (approvedLeaves.length / leaves.length) * 100 : 0,
        averageApprovalTime,
      };

      // Mettre en cache (30 minutes)
      await this.cacheMetrics(cacheKey, AnalyticsCacheType.TREND_ANALYSIS, metrics, period, 1800);

      return metrics;
    } catch (error) {
      this.logger.error('Error calculating HR metrics:', error);
      throw error;
    }
  }

  /**
   * Analyse les patterns de congés (saisonniers, hebdomadaires, durée)
   */
  async analyzeLeavePatterns(period: { startDate: Date; endDate: Date }) {
    try {
      // Étendre la période à 1 an en arrière pour l'analyse saisonnière
      const extendedStartDate = new Date(period.startDate);
      extendedStartDate.setFullYear(extendedStartDate.getFullYear() - 1);

      const leaves = await this.prisma.leave.findMany({
        where: {
          status: 'APPROVED',
          startDate: {
            gte: extendedStartDate,
            lte: period.endDate,
          },
        },
      });

      const seasonalTrends = this.analyzeSeasonalTrends(leaves);
      const weeklyPatterns = this.analyzeWeeklyPatterns(leaves);
      const durationDistribution = this.analyzeDurationDistribution(leaves);

      return {
        seasonalTrends,
        weeklyPatterns,
        durationDistribution,
      };
    } catch (error) {
      this.logger.error('Error analyzing leave patterns:', error);
      throw error;
    }
  }

  /**
   * Prédit la capacité d'équipe future basée sur les congés planifiés
   */
  async forecastTeamCapacity(futurePeriod: { startDate: Date; endDate: Date; label?: string }) {
    try {
      // Récupérer les congés approuvés dans la période future
      const futureLeaves = await this.prisma.leave.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            {
              startDate: {
                gte: futurePeriod.startDate,
                lte: futurePeriod.endDate,
              },
            },
            {
              endDate: {
                gte: futurePeriod.startDate,
                lte: futurePeriod.endDate,
              },
            },
          ],
        },
        include: {
          user: {
            include: {
              department: true,
            },
          },
        },
      });

      // Récupérer tous les départements
      const departments = await this.prisma.department.findMany({
        include: {
          users: {
            where: {
              isActive: true,
            },
          },
        },
      });

      // Calculer les jours ouvrés dans la période
      const workingDays = this.calculateWorkingDaysBetween(
        futurePeriod.startDate,
        futurePeriod.endDate,
      );

      const departmentCapacities = departments.map((dept) => {
        const deptUsers = dept.users;
        const totalCapacity = deptUsers.length * workingDays;

        // Calculer les absences planifiées pour ce département
        const deptLeaves = futureLeaves.filter(
          (leave) => leave.user.departmentId === dept.id,
        );
        const plannedAbsence = deptLeaves.reduce((sum, leave) => {
          // Calculer l'intersection entre les dates de congé et la période
          const leaveStart = new Date(Math.max(leave.startDate.getTime(), futurePeriod.startDate.getTime()));
          const leaveEnd = new Date(Math.min(leave.endDate.getTime(), futurePeriod.endDate.getTime()));
          const overlapDays = this.calculateWorkingDaysBetween(leaveStart, leaveEnd);
          return sum + overlapDays;
        }, 0);

        const availableCapacity = totalCapacity - plannedAbsence;
        const utilizationRate = totalCapacity > 0 ? (plannedAbsence / totalCapacity) * 100 : 0;
        const riskLevel = this.assessRiskLevel(utilizationRate);
        const recommendations = this.generateRecommendations(
          dept.name,
          utilizationRate,
          plannedAbsence,
        );

        return {
          name: dept.name,
          totalCapacity,
          plannedAbsence,
          availableCapacity,
          utilizationRate: Math.round(utilizationRate * 100) / 100,
          riskLevel,
          recommendations,
        };
      });

      return {
        period: {
          startDate: futurePeriod.startDate,
          endDate: futurePeriod.endDate,
          label: futurePeriod.label || '',
        },
        departments: departmentCapacities,
      };
    } catch (error) {
      this.logger.error('Error forecasting team capacity:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTHODES PRIVÉES - HR ANALYTICS
  // ==========================================

  private calculateLeaveTypeStats(leaves: any[]) {
    const typeMap = new Map<string, { count: number; totalDays: number; approved: number }>();

    leaves.forEach((leave) => {
      if (!typeMap.has(leave.type)) {
        typeMap.set(leave.type, { count: 0, totalDays: 0, approved: 0 });
      }

      const stats = typeMap.get(leave.type)!;
      stats.count++;
      stats.totalDays += Number(leave.days);

      if (leave.status === 'APPROVED') {
        stats.approved++;
      }
    });

    return Array.from(typeMap.entries()).map(([type, stats]) => ({
      type,
      count: stats.count,
      totalDays: stats.totalDays,
      averageDuration: stats.count > 0 ? stats.totalDays / stats.count : 0,
      approvalRate: stats.count > 0 ? (stats.approved / stats.count) * 100 : 0,
    }));
  }

  private calculateMonthlyTrends(
    leaves: any[],
    period: { startDate: Date; endDate: Date },
  ) {
    const monthMap = new Map<
      string,
      {
        totalRequests: number;
        totalDays: number;
        approvedDays: number;
        rejectedDays: number;
      }
    >();

    leaves.forEach((leave) => {
      const leaveDate = new Date(leave.startDate);
      const monthKey = `${leaveDate.getFullYear()}-${leaveDate.getMonth() + 1}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          totalRequests: 0,
          totalDays: 0,
          approvedDays: 0,
          rejectedDays: 0,
        });
      }

      const stats = monthMap.get(monthKey)!;
      stats.totalRequests++;
      stats.totalDays += Number(leave.days);

      if (leave.status === 'APPROVED') {
        stats.approvedDays += Number(leave.days);
      } else if (leave.status === 'REJECTED') {
        stats.rejectedDays += Number(leave.days);
      }
    });

    return Array.from(monthMap.entries()).map(([monthKey, stats]) => {
      const [year, month] = monthKey.split('-').map(Number);
      const monthName = new Date(year, month - 1).toLocaleDateString('fr-FR', {
        month: 'long',
      });
      return {
        month: monthName,
        year,
        ...stats,
      };
    });
  }

  private async calculateDepartmentStats(leaves: any[], users: any[]) {
    // Grouper les utilisateurs par département
    const departmentMap = new Map<
      string,
      { name: string; users: any[] }
    >();

    users
      .filter((u) => u.isActive)
      .forEach((user) => {
        const deptName = user.department?.name || 'Non défini';
        if (!departmentMap.has(deptName)) {
          departmentMap.set(deptName, { name: deptName, users: [] });
        }
        departmentMap.get(deptName)!.users.push(user);
      });

    return Array.from(departmentMap.values()).map((dept) => {
      const deptUserIds = dept.users.map((u) => u.id);
      const deptLeaves = leaves.filter((leave) => deptUserIds.includes(leave.userId));
      const approvedLeaves = deptLeaves.filter((l) => l.status === 'APPROVED');
      const totalDays = approvedLeaves.reduce((sum, l) => sum + Number(l.days), 0);

      // Calculer le type de congé le plus populaire
      const typeFreq = new Map<string, number>();
      approvedLeaves.forEach((leave) => {
        typeFreq.set(leave.type, (typeFreq.get(leave.type) || 0) + 1);
      });

      const mostPopularType =
        Array.from(typeFreq.entries()).sort(([, a], [, b]) => b - a)[0]?.[0] || 'PAID_LEAVE';

      return {
        department: dept.name,
        employeeCount: dept.users.length,
        totalLeaveDays: totalDays,
        averageLeaveDaysPerEmployee:
          dept.users.length > 0 ? totalDays / dept.users.length : 0,
        absenteeismRate: this.calculateAbsenteeismRate(totalDays, dept.users.length, {
          startDate: new Date(),
          endDate: new Date(),
        }),
        mostPopularLeaveType: mostPopularType,
      };
    });
  }

  private calculateTopLeaveUsers(leaves: any[], users: any[]) {
    const userMap = new Map<
      string,
      { totalDays: number; count: number; lastDate: Date | null }
    >();

    leaves
      .filter((l) => l.status === 'APPROVED')
      .forEach((leave) => {
        if (!userMap.has(leave.userId)) {
          userMap.set(leave.userId, { totalDays: 0, count: 0, lastDate: null });
        }

        const stats = userMap.get(leave.userId)!;
        stats.totalDays += Number(leave.days);
        stats.count++;

        const leaveDate = new Date(leave.startDate);
        if (!stats.lastDate || leaveDate > stats.lastDate) {
          stats.lastDate = leaveDate;
        }
      });

    return Array.from(userMap.entries())
      .map(([userId, stats]) => {
        const user = users.find((u) => u.id === userId);
        return {
          userId,
          displayName: user ? `${user.firstName} ${user.lastName}` : 'Utilisateur inconnu',
          department: user?.department?.name || 'Non défini',
          totalLeaveDays: stats.totalDays,
          leaveRequestsCount: stats.count,
          averageRequestDuration: stats.count > 0 ? stats.totalDays / stats.count : 0,
          lastLeaveDate: stats.lastDate,
        };
      })
      .sort((a, b) => b.totalLeaveDays - a.totalLeaveDays)
      .slice(0, 10);
  }

  private calculateAbsenteeismRate(
    totalLeaveDays: number,
    employeeCount: number,
    period: { startDate: Date; endDate: Date },
  ): number {
    if (employeeCount === 0) return 0;

    const workingDays = this.calculateWorkingDaysBetween(period.startDate, period.endDate);
    const totalPossibleWorkingDays = employeeCount * workingDays;

    return totalPossibleWorkingDays > 0
      ? (totalLeaveDays / totalPossibleWorkingDays) * 100
      : 0;
  }

  private calculateAverageApprovalTime(approvedLeaves: any[]): number {
    const approvalsWithTime = approvedLeaves.filter((l) => l.approvedAt && l.createdAt);

    if (approvalsWithTime.length === 0) return 0;

    const totalHours = approvalsWithTime.reduce((sum, leave) => {
      const diffMs = new Date(leave.approvedAt).getTime() - new Date(leave.createdAt).getTime();
      return sum + diffMs / (1000 * 60 * 60);
    }, 0);

    return totalHours / approvalsWithTime.length;
  }

  private analyzeSeasonalTrends(leaves: any[]) {
    const monthStats = new Array(12).fill(0).map(() => ({ days: 0, count: 0 }));

    leaves.forEach((leave) => {
      const month = new Date(leave.startDate).getMonth();
      monthStats[month].days += Number(leave.days);
      monthStats[month].count++;
    });

    const maxDays = Math.max(...monthStats.map((s) => s.days));

    return monthStats.map((stats, month) => ({
      month: month + 1,
      averageDays: stats.count > 0 ? stats.days / stats.count : 0,
      requestCount: stats.count,
      pattern:
        stats.days > maxDays * 0.7
          ? ('HIGH' as const)
          : stats.days > maxDays * 0.3
            ? ('MEDIUM' as const)
            : ('LOW' as const),
    }));
  }

  private analyzeWeeklyPatterns(leaves: any[]) {
    const dayStats = new Array(7).fill(0);

    leaves.forEach((leave) => {
      const dayOfWeek = new Date(leave.startDate).getDay();
      dayStats[dayOfWeek]++;
    });

    return dayStats.map((frequency, dayOfWeek) => ({
      dayOfWeek,
      frequency,
    }));
  }

  private analyzeDurationDistribution(leaves: any[]) {
    const ranges = [
      { range: '1 jour', min: 1, max: 1 },
      { range: '2-3 jours', min: 2, max: 3 },
      { range: '4-7 jours', min: 4, max: 7 },
      { range: '8-14 jours', min: 8, max: 14 },
      { range: '15+ jours', min: 15, max: Infinity },
    ];

    const distribution = ranges.map((range) => ({
      range: range.range,
      count: leaves.filter((l) => Number(l.days) >= range.min && Number(l.days) <= range.max).length,
      percentage: 0,
    }));

    const total = leaves.length;
    distribution.forEach((d) => {
      d.percentage = total > 0 ? (d.count / total) * 100 : 0;
    });

    return distribution;
  }

  private calculateWorkingDaysBetween(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // Exclure samedi (6) et dimanche (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  private assessRiskLevel(utilizationRate: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (utilizationRate > 30) return 'HIGH';
    if (utilizationRate > 15) return 'MEDIUM';
    return 'LOW';
  }

  private generateRecommendations(
    department: string,
    utilizationRate: number,
    plannedAbsence: number,
  ): string[] {
    const recommendations: string[] = [];

    if (utilizationRate > 30) {
      recommendations.push('Planifier du personnel supplémentaire ou des prestataires');
      recommendations.push('Envisager le report de projets non critiques');
    }

    if (utilizationRate > 15) {
      recommendations.push('Surveiller la charge de travail de près');
      recommendations.push('Préparer un plan de continuité');
    }

    if (plannedAbsence === 0) {
      recommendations.push('Encourager la prise de congés pour maintenir la motivation');
    }

    return recommendations;
  }
}
