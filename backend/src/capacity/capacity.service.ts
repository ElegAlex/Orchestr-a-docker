import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractType, WeekDay } from '@prisma/client';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { UpdateAllocationDto } from './dto/update-allocation.dto';
import {
  startOfMonth,
  endOfMonth,
  addDays,
  differenceInDays,
  format,
  isWeekend,
} from 'date-fns';
import { fr } from 'date-fns/locale';

// Types pour les réponses (exportés pour utilisation dans le controller)
export interface DatePeriod {
  startDate: Date;
  endDate: Date;
  label?: string;
}

export interface UserCapacity {
  userId: string;
  period: DatePeriod;
  theoreticalDays: number;
  availableDays: number;
  plannedDays: number;
  remainingDays: number;
  overallocationDays: number;
  holidayDays: number;
  leaveDays: number;
  workingDaysInPeriod: number[];
  alerts: CapacityAlert[];
}

export interface CapacityAlert {
  type: 'OVERALLOCATION' | 'UNDERUTILIZATION' | 'LEAVE_CONFLICT' | 'DEADLINE_RISK';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  suggestedActions?: string[];
  affectedProjects?: string[];
}

@Injectable()
export class CapacityService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // GESTION DES CONTRATS
  // ==========================================

  /**
   * Récupère le contrat actif d'un utilisateur
   */
  async getUserContract(userId: string) {
    console.log('🔍 [getUserContract] Recherche contrat pour userId:', userId);
    console.log('🔍 [getUserContract] Date actuelle:', new Date());

    const contracts = await this.prisma.workContract.findMany({
      where: {
        userId,
        startDate: { lte: new Date() },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ]
      },
      orderBy: { startDate: 'desc' },
      take: 1
    });

    console.log('🔍 [getUserContract] Contrats trouvés:', contracts.length);
    if (contracts.length > 0) {
      console.log('✅ [getUserContract] Contrat:', contracts[0].id, 'startDate:', contracts[0].startDate);
    }

    if (contracts.length === 0) {
      console.log('⚪ [getUserContract] Aucun contrat, retour contrat virtuel');
      // Retourner un contrat virtuel par défaut
      return this.getVirtualDefaultContract(userId);
    }

    return contracts[0];
  }

  /**
   * Récupère tous les contrats d'un utilisateur
   */
  async getUserContracts(userId: string) {
    return this.prisma.workContract.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' }
    });
  }

  /**
   * Crée un contrat de travail
   */
  async createContract(userId: string, dto: CreateContractDto) {
    console.log('🔍 [Service] createContract appelé avec userId:', userId);
    console.log('🔍 [Service] dto:', JSON.stringify(dto, null, 2));

    try {
      const result = await this.prisma.workContract.create({
        data: {
          userId,
          type: dto.type,
          workingTimePercentage: dto.workingTimePercentage,
          weeklyHours: dto.weeklyHours,
          workingDays: dto.workingDays,
          workingSchedule: dto.workingSchedule || null,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          paidLeaveDays: dto.paidLeaveDays || 25,
          rttDays: dto.rttDays || 0,
          isRemoteAllowed: dto.isRemoteAllowed || false,
          maxRemoteDaysPerWeek: dto.maxRemoteDaysPerWeek || null,
          hourlyRate: dto.hourlyRate || null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      console.log('✅ [Service] Contrat créé avec succès:', result.id);
      return result;
    } catch (error) {
      console.error('❌ [Service] Erreur lors de la création du contrat:', error);
      throw error;
    }
  }

  /**
   * Met à jour un contrat
   */
  async updateContract(contractId: string, dto: UpdateContractDto) {
    const contract = await this.prisma.workContract.findUnique({
      where: { id: contractId }
    });

    if (!contract) {
      throw new NotFoundException(`Contrat ${contractId} introuvable`);
    }

    const updateData: any = {};
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.workingTimePercentage !== undefined) updateData.workingTimePercentage = dto.workingTimePercentage;
    if (dto.weeklyHours !== undefined) updateData.weeklyHours = dto.weeklyHours;
    if (dto.workingDays !== undefined) updateData.workingDays = dto.workingDays;
    if (dto.workingSchedule !== undefined) updateData.workingSchedule = dto.workingSchedule;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.paidLeaveDays !== undefined) updateData.paidLeaveDays = dto.paidLeaveDays;
    if (dto.rttDays !== undefined) updateData.rttDays = dto.rttDays;
    if (dto.isRemoteAllowed !== undefined) updateData.isRemoteAllowed = dto.isRemoteAllowed;
    if (dto.maxRemoteDaysPerWeek !== undefined) updateData.maxRemoteDaysPerWeek = dto.maxRemoteDaysPerWeek;
    if (dto.hourlyRate !== undefined) updateData.hourlyRate = dto.hourlyRate;

    return this.prisma.workContract.update({
      where: { id: contractId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  /**
   * Supprime un contrat
   */
  async deleteContract(contractId: string) {
    const contract = await this.prisma.workContract.findUnique({
      where: { id: contractId }
    });

    if (!contract) {
      throw new NotFoundException(`Contrat ${contractId} introuvable`);
    }

    await this.prisma.workContract.delete({
      where: { id: contractId }
    });

    return { message: 'Contrat supprimé avec succès' };
  }

  /**
   * Contrat virtuel par défaut (non persisté)
   */
  private getVirtualDefaultContract(userId: string) {
    return {
      id: `virtual-${userId}`,
      userId,
      type: ContractType.CDI,
      workingTimePercentage: 100,
      weeklyHours: 35,
      workingDays: [WeekDay.MONDAY, WeekDay.TUESDAY, WeekDay.WEDNESDAY, WeekDay.THURSDAY, WeekDay.FRIDAY],
      workingSchedule: null,
      startDate: new Date(),
      endDate: null,
      paidLeaveDays: 25,
      rttDays: 0,
      isRemoteAllowed: false,
      maxRemoteDaysPerWeek: null,
      hourlyRate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // ==========================================
  // GESTION DES ALLOCATIONS
  // ==========================================

  /**
   * Récupère les allocations d'un utilisateur
   */
  async getUserAllocations(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId };

    if (startDate && endDate) {
      where.OR = [
        {
          startDate: { gte: startDate, lte: endDate }
        },
        {
          endDate: { gte: startDate, lte: endDate }
        },
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: endDate } }
          ]
        }
      ];
    }

    return this.prisma.resourceAllocation.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });
  }

  /**
   * Récupère les allocations d'un projet
   */
  async getProjectAllocations(projectId: string, startDate?: Date, endDate?: Date) {
    const where: any = { projectId };

    if (startDate && endDate) {
      where.OR = [
        {
          startDate: { gte: startDate, lte: endDate }
        },
        {
          endDate: { gte: startDate, lte: endDate }
        },
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: endDate } }
          ]
        }
      ];
    }

    return this.prisma.resourceAllocation.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });
  }

  /**
   * Crée une allocation de ressource
   */
  async createAllocation(dto: CreateAllocationDto) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId }
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur ${dto.userId} introuvable`);
    }

    // Vérifier que le projet existe
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId }
    });

    if (!project) {
      throw new NotFoundException(`Projet ${dto.projectId} introuvable`);
    }

    // Calculer les jours estimés
    const contract = await this.getUserContract(dto.userId);
    const period: DatePeriod = {
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate)
    };

    const theoreticalDays = await this.calculateTheoreticalDays(contract, period);
    const estimatedDays = (theoreticalDays * dto.allocationPercentage) / 100;

    return this.prisma.resourceAllocation.create({
      data: {
        userId: dto.userId,
        projectId: dto.projectId,
        allocationPercentage: dto.allocationPercentage,
        estimatedDays,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        notes: dto.notes || null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  /**
   * Met à jour une allocation
   */
  async updateAllocation(allocationId: string, dto: UpdateAllocationDto) {
    const allocation = await this.prisma.resourceAllocation.findUnique({
      where: { id: allocationId }
    });

    if (!allocation) {
      throw new NotFoundException(`Allocation ${allocationId} introuvable`);
    }

    const updateData: any = {};
    if (dto.allocationPercentage !== undefined) updateData.allocationPercentage = dto.allocationPercentage;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    // Recalculer les jours estimés si nécessaire
    if (dto.allocationPercentage !== undefined || dto.startDate !== undefined || dto.endDate !== undefined) {
      const contract = await this.getUserContract(allocation.userId);
      const period: DatePeriod = {
        startDate: dto.startDate ? new Date(dto.startDate) : allocation.startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : allocation.endDate
      };

      const theoreticalDays = await this.calculateTheoreticalDays(contract, period);
      const percentage = dto.allocationPercentage !== undefined ? dto.allocationPercentage : allocation.allocationPercentage;
      updateData.estimatedDays = (theoreticalDays * percentage) / 100;
    }

    return this.prisma.resourceAllocation.update({
      where: { id: allocationId },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  /**
   * Supprime une allocation
   */
  async deleteAllocation(allocationId: string) {
    const allocation = await this.prisma.resourceAllocation.findUnique({
      where: { id: allocationId }
    });

    if (!allocation) {
      throw new NotFoundException(`Allocation ${allocationId} introuvable`);
    }

    await this.prisma.resourceAllocation.delete({
      where: { id: allocationId }
    });

    return { message: 'Allocation supprimée avec succès' };
  }

  // ==========================================
  // CALCUL DE CAPACITÉ
  // ==========================================

  /**
   * Calcule la capacité complète d'un utilisateur pour une période
   */
  async calculateUserCapacity(userId: string, startDate: Date, endDate: Date, label?: string): Promise<UserCapacity> {
    const period: DatePeriod = { startDate, endDate, label };

    // Récupérer le contrat
    const contract = await this.getUserContract(userId);

    // Calculer les jours théoriques
    const theoreticalDays = await this.calculateTheoreticalDays(contract, period);

    // Récupérer les jours fériés
    const holidays = await this.prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        isWorkingDay: false
      }
    });
    const holidayDays = holidays.length;

    // Récupérer les congés approuvés
    const leaves = await this.prisma.leave.findMany({
      where: {
        userId,
        status: 'APPROVED',
        OR: [
          {
            startDate: { gte: startDate, lte: endDate }
          },
          {
            endDate: { gte: startDate, lte: endDate }
          },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } }
            ]
          }
        ]
      }
    });

    const leaveDays = leaves.reduce((sum, leave) => {
      const leaveStart = leave.startDate > startDate ? leave.startDate : startDate;
      const leaveEnd = leave.endDate < endDate ? leave.endDate : endDate;
      const days = differenceInDays(leaveEnd, leaveStart) + 1;
      return sum + days;
    }, 0);

    // Calculer les jours disponibles
    const availableDays = Math.max(0, theoreticalDays - holidayDays - leaveDays);

    // Récupérer les allocations
    const allocations = await this.getUserAllocations(userId, startDate, endDate);
    const plannedDays = allocations.reduce((sum, alloc) => sum + alloc.estimatedDays, 0);

    // Calculer les jours restants
    const remainingDays = availableDays - plannedDays;
    const overallocationDays = remainingDays < 0 ? Math.abs(remainingDays) : 0;

    // Générer les alertes
    const alerts = this.generateCapacityAlerts({
      theoreticalDays,
      availableDays,
      plannedDays,
      remainingDays
    });

    // Calculer la répartition journalière
    const workingDaysInPeriod = await this.calculateDailyCapacityForPeriod(contract, period);

    const capacity: UserCapacity = {
      userId,
      period,
      theoreticalDays,
      availableDays,
      plannedDays,
      remainingDays,
      overallocationDays,
      holidayDays,
      leaveDays,
      workingDaysInPeriod,
      alerts
    };

    // Sauvegarder en cache
    await this.cacheUserCapacity(capacity);

    return capacity;
  }

  /**
   * Calcule les jours théoriques selon le contrat
   */
  private async calculateTheoreticalDays(contract: any, period: DatePeriod): Promise<number> {
    let totalDays = 0;
    const currentDate = new Date(period.startDate);

    while (currentDate <= period.endDate) {
      const dayOfWeek = this.getDayOfWeek(currentDate);

      // Vérifier si c'est un jour ouvré selon le contrat
      if (contract.workingDays.includes(dayOfWeek)) {
        // Calculer la capacité selon le pourcentage de temps de travail
        const dailyCapacity = this.calculateDailyCapacity(contract, dayOfWeek);
        totalDays += dailyCapacity;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return totalDays;
  }

  /**
   * Calcule la capacité journalière selon le contrat
   */
  private calculateDailyCapacity(contract: any, dayOfWeek: WeekDay): number {
    // Si horaires spécifiques définis
    if (contract.workingSchedule) {
      const daySchedule = contract.workingSchedule.find((s: any) => s.day === dayOfWeek);
      if (daySchedule && daySchedule.isWorking) {
        const standardHours = 7; // 7h par jour standard
        const actualHours = daySchedule.totalHours;
        return (actualHours / standardHours) * (contract.workingTimePercentage / 100);
      }
      return 0;
    }

    // Calcul simple basé sur le pourcentage de temps
    return contract.workingTimePercentage / 100;
  }

  /**
   * Calcule la capacité jour par jour pour une période
   */
  private async calculateDailyCapacityForPeriod(contract: any, period: DatePeriod): Promise<number[]> {
    const dailyCapacities: number[] = [];
    const currentDate = new Date(period.startDate);

    while (currentDate <= period.endDate) {
      const dayOfWeek = this.getDayOfWeek(currentDate);

      if (contract.workingDays.includes(dayOfWeek)) {
        const capacity = this.calculateDailyCapacity(contract, dayOfWeek);
        dailyCapacities.push(capacity);
      } else {
        dailyCapacities.push(0);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyCapacities;
  }

  /**
   * Génère les alertes de capacité
   */
  private generateCapacityAlerts(capacityData: {
    theoreticalDays: number;
    availableDays: number;
    plannedDays: number;
    remainingDays: number;
  }): CapacityAlert[] {
    const alerts: CapacityAlert[] = [];
    const { theoreticalDays, availableDays, plannedDays, remainingDays } = capacityData;

    // Surallocation
    if (remainingDays < 0) {
      alerts.push({
        type: 'OVERALLOCATION',
        severity: Math.abs(remainingDays) > theoreticalDays * 0.2 ? 'CRITICAL' : 'HIGH',
        message: `Surallocation de ${Math.abs(remainingDays).toFixed(1)} jours détectée`,
        suggestedActions: [
          'Réduire les allocations sur certains projets',
          'Négocier les échéances avec les clients',
          'Recruter du renfort temporaire'
        ]
      });
    }

    // Sous-utilisation
    if (remainingDays > theoreticalDays * 0.5) {
      alerts.push({
        type: 'UNDERUTILIZATION',
        severity: 'MEDIUM',
        message: `Sous-utilisation importante: ${remainingDays.toFixed(1)} jours libres`,
        suggestedActions: [
          'Allouer à de nouveaux projets',
          'Planifier de la formation',
          'Anticiper les projets futurs'
        ]
      });
    }

    return alerts;
  }

  /**
   * Sauvegarde la capacité calculée en cache
   */
  private async cacheUserCapacity(capacity: UserCapacity): Promise<void> {
    try {
      await this.prisma.userCapacity.create({
        data: {
          userId: capacity.userId,
          periodStartDate: capacity.period.startDate,
          periodEndDate: capacity.period.endDate,
          periodLabel: capacity.period.label || null,
          theoreticalDays: capacity.theoreticalDays,
          availableDays: capacity.availableDays,
          plannedDays: capacity.plannedDays,
          remainingDays: capacity.remainingDays,
          overallocationDays: capacity.overallocationDays,
          holidayDays: capacity.holidayDays,
          leaveDays: capacity.leaveDays,
          workingDaysInPeriod: capacity.workingDaysInPeriod as any,
          alerts: capacity.alerts as any,
          calculatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Erreur lors de la mise en cache de la capacité:', error);
      // Ne pas faire échouer le processus principal
    }
  }

  /**
   * Récupère la capacité en cache (si disponible et récente)
   */
  async getCachedCapacity(userId: string, startDate: Date, endDate: Date) {
    const cached = await this.prisma.userCapacity.findFirst({
      where: {
        userId,
        periodStartDate: startDate,
        periodEndDate: endDate,
        calculatedAt: {
          gte: new Date(Date.now() - 3600000) // Cache valide 1h
        }
      },
      orderBy: { calculatedAt: 'desc' }
    });

    return cached;
  }

  /**
   * Génère des périodes prédéfinies
   */
  generatePeriods(type: 'month' | 'quarter' | 'year', year: number): DatePeriod[] {
    const periods: DatePeriod[] = [];

    switch (type) {
      case 'month':
        for (let month = 0; month < 12; month++) {
          const start = startOfMonth(new Date(year, month, 1));
          const end = endOfMonth(start);
          periods.push({
            startDate: start,
            endDate: end,
            label: format(start, 'MMMM yyyy', { locale: fr })
          });
        }
        break;

      case 'quarter':
        for (let quarter = 0; quarter < 4; quarter++) {
          const startMonth = quarter * 3;
          const start = startOfMonth(new Date(year, startMonth, 1));
          const end = endOfMonth(new Date(year, startMonth + 2, 1));
          periods.push({
            startDate: start,
            endDate: end,
            label: `Q${quarter + 1} ${year}`
          });
        }
        break;

      case 'year':
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31);
        periods.push({
          startDate: start,
          endDate: end,
          label: `Année ${year}`
        });
        break;
    }

    return periods;
  }

  // ==========================================
  // UTILITAIRES
  // ==========================================

  private getDayOfWeek(date: Date): WeekDay {
    const days = [WeekDay.SUNDAY, WeekDay.MONDAY, WeekDay.TUESDAY, WeekDay.WEDNESDAY, WeekDay.THURSDAY, WeekDay.FRIDAY, WeekDay.SATURDAY];
    return days[date.getDay()];
  }
}
