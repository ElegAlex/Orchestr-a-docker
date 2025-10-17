import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeleworkOverrideDto } from './dto/create-telework-override.dto';
import {
  UpdateTeleworkOverrideDto,
  ApprovalStatus,
} from './dto/update-telework-override.dto';

@Injectable()
export class PresencesService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // TELEWORK OVERRIDES MANAGEMENT
  // ==========================================

  /**
   * Créer un telework override
   */
  async createTeleworkOverride(dto: CreateTeleworkOverrideDto) {
    return this.prisma.teleworkOverride.create({
      data: {
        userId: dto.userId,
        date: new Date(dto.date),
        mode: dto.mode || 'REMOTE',
        reason: dto.reason,
        createdBy: dto.userId, // Utilise userId comme createdBy par défaut
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
  }

  /**
   * Récupérer tous les telework overrides d'un utilisateur
   */
  async findTeleworkOverridesByUser(userId: string) {
    return this.prisma.teleworkOverride.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer les telework overrides pour une date
   */
  async findTeleworkOverridesForDate(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.teleworkOverride.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
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
  }

  /**
   * Récupérer un telework override par ID
   */
  async findOneTeleworkOverride(id: string) {
    const override = await this.prisma.teleworkOverride.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!override) {
      throw new NotFoundException(`Telework override with ID ${id} not found`);
    }

    return override;
  }

  /**
   * Mettre à jour un telework override
   */
  async updateTeleworkOverride(id: string, dto: UpdateTeleworkOverrideDto) {
    const exists = await this.prisma.teleworkOverride.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException(`Telework override with ID ${id} not found`);
    }

    const updateData: any = {};

    if (dto.date) updateData.date = new Date(dto.date);
    if (dto.mode) updateData.mode = dto.mode;
    if (dto.reason !== undefined) updateData.reason = dto.reason;
    if (dto.status) updateData.approvalStatus = dto.status;

    return this.prisma.teleworkOverride.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Mettre à jour le statut d'approbation
   */
  async updateApprovalStatus(id: string, status: ApprovalStatus) {
    const exists = await this.prisma.teleworkOverride.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException(`Telework override with ID ${id} not found`);
    }

    return this.prisma.teleworkOverride.update({
      where: { id },
      data: { approvalStatus: status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Supprimer un telework override
   */
  async removeTeleworkOverride(id: string) {
    const exists = await this.prisma.teleworkOverride.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException(`Telework override with ID ${id} not found`);
    }

    return this.prisma.teleworkOverride.delete({
      where: { id },
    });
  }

  // ==========================================
  // PRESENCE CALCULATION
  // ==========================================

  /**
   * Calculer les présences pour une date donnée
   */
  async getPresencesForDate(date: Date, departmentId?: string) {
    // 1. Récupérer tous les utilisateurs actifs
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          notIn: ['ADMIN', 'VIEWER'],
        },
        ...(departmentId ? { departmentId } : {}),
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

    // 2. Récupérer les congés approuvés pour cette date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const leavesOnDate = await this.prisma.leave.findMany({
      where: {
        status: 'APPROVED',
        startDate: {
          lte: endOfDay,
        },
        endDate: {
          gte: startOfDay,
        },
      },
      select: {
        userId: true,
        type: true,
      },
    });

    // 3. Récupérer les telework overrides pour cette date
    const teleworkOnDate = await this.findTeleworkOverridesForDate(date);

    // 4. Classifier les utilisateurs
    const onSite: any[] = [];
    const telework: any[] = [];
    const absent: any[] = [];

    for (const user of users) {
      // Vérifier si absent (congé)
      const userLeave = leavesOnDate.find((leave) => leave.userId === user.id);
      if (userLeave) {
        absent.push({
          user,
          status: 'absent',
          details: this.getLeaveTypeLabel(userLeave.type),
          validationStatus: 'APPROVED',
        });
        continue;
      }

      // Vérifier si en télétravail
      const userTelework = teleworkOnDate.find(
        (override) => override.userId === user.id && override.mode === 'REMOTE',
      );
      if (userTelework) {
        telework.push({
          user,
          status: 'telework',
          details:
            userTelework.approvalStatus === 'APPROVED'
              ? 'Télétravail validé'
              : userTelework.approvalStatus === 'PENDING'
                ? 'En attente de validation'
                : 'Télétravail',
          validationStatus: userTelework.approvalStatus,
        });
        continue;
      }

      // Sinon, présent sur site
      onSite.push({
        user,
        status: 'on_site',
        details: 'Sur site',
      });
    }

    // 5. Si pas de filtre département, créer la segmentation par département
    let byDepartment: any[] | undefined;

    if (!departmentId) {
      const allPresences = [...onSite, ...telework, ...absent];
      const departments = [
        ...new Map(
          allPresences
            .filter((p) => p.user.department)
            .map((p) => [
              p.user.department.id,
              {
                id: p.user.department.id,
                name: p.user.department.name,
              },
            ]),
        ).values(),
      ].sort((a, b) => a.name.localeCompare(b.name));

      byDepartment = departments.map((dept) => {
        const deptOnSite = onSite.filter(
          (p) => p.user.department?.id === dept.id,
        );
        const deptTelework = telework.filter(
          (p) => p.user.department?.id === dept.id,
        );
        const deptAbsent = absent.filter(
          (p) => p.user.department?.id === dept.id,
        );

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          onSite: deptOnSite,
          telework: deptTelework,
          absent: deptAbsent,
          totalUsers:
            deptOnSite.length + deptTelework.length + deptAbsent.length,
        };
      });
    }

    return { onSite, telework, absent, byDepartment };
  }

  /**
   * Calculer les statistiques de présence pour une date
   */
  async getPresenceStats(date: Date, departmentId?: string) {
    const presences = await this.getPresencesForDate(date, departmentId);
    const totalUsers =
      presences.onSite.length +
      presences.telework.length +
      presences.absent.length;

    return {
      totalUsers,
      onSiteCount: presences.onSite.length,
      teleworkCount: presences.telework.length,
      absentCount: presences.absent.length,
      onSitePercentage:
        totalUsers > 0
          ? Math.round((presences.onSite.length / totalUsers) * 100)
          : 0,
      teleworkPercentage:
        totalUsers > 0
          ? Math.round((presences.telework.length / totalUsers) * 100)
          : 0,
    };
  }

  /**
   * Labels pour les types de congés
   */
  private getLeaveTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      PAID_LEAVE: 'Congé payé',
      RTT: 'RTT',
      SICK_LEAVE: 'Congé maladie',
      MATERNITY_LEAVE: 'Congé maternité',
      PATERNITY_LEAVE: 'Congé paternité',
      EXCEPTIONAL_LEAVE: 'Congé exceptionnel',
      CONVENTIONAL_LEAVE: 'Congé conventionnel',
      UNPAID_LEAVE: 'Congé sans solde',
      TRAINING: 'Formation',
    };
    return labels[type] || type;
  }
}
