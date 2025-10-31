import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { FilterLeaveDto } from './dto/filter-leave.dto';
import { RejectLeaveDto } from './dto/reject-leave.dto';
import { LeaveStatus, Prisma } from '@prisma/client';

/**
 * Service de gestion des demandes de congés
 *
 * Fonctionnalités:
 * - CRUD complet des demandes
 * - Workflow d'approbation/rejet
 * - Validation des dates et chevauchements
 * - Statistiques utilisateur
 */
@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer une nouvelle demande de congé
   */
  async create(createLeaveDto: CreateLeaveDto, userId: string) {
    const { startDate, endDate, days, type, reason } = createLeaveDto;

    // Validation: startDate <= endDate
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new BadRequestException(
        'La date de début doit être antérieure ou égale à la date de fin',
      );
    }

    // Validation: vérifier les chevauchements avec les congés approuvés de l'utilisateur
    const hasOverlap = await this.checkOverlap(userId, start, end);
    if (hasOverlap) {
      throw new BadRequestException(
        'Cette période chevauche avec une demande de congé déjà approuvée',
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Créer la demande
    const leave = await this.prisma.leave.create({
      data: {
        userId,
        type,
        startDate: start,
        endDate: end,
        days,
        reason,
        status: LeaveStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return leave;
  }

  /**
   * Récupérer toutes les demandes de congé avec filtrage et pagination
   * 🔒 Isolation par département : Filtre les congés via l'utilisateur du département
   */
  async findAll(filterDto: FilterLeaveDto) {
    const {
      userId,
      departmentId,
      type,
      status,
      startDateFrom,
      startDateTo,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    // Construction des filtres
    const where: Prisma.LeaveWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    // 🔒 Filtre par département : congés d'utilisateurs du département
    if (departmentId) {
      where.user = {
        departmentId: departmentId,
      };
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (startDateFrom || startDateTo) {
      where.startDate = {};
      if (startDateFrom) {
        where.startDate.gte = new Date(startDateFrom);
      }
      if (startDateTo) {
        where.startDate.lte = new Date(startDateTo);
      }
    }

    if (search) {
      where.reason = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Exécution des requêtes
    const [leaves, total] = await Promise.all([
      this.prisma.leave.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
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
      }),
      this.prisma.leave.count({ where }),
    ]);

    // Conversion des Decimal en string pour JSON
    const leavesWithStringDays = leaves.map((leave) => ({
      ...leave,
      days: leave.days.toString(),
    }));

    return {
      data: leavesWithStringDays,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupérer une demande par ID
   */
  async findOne(id: string) {
    const leave = await this.prisma.leave.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!leave) {
      throw new NotFoundException('Demande de congé non trouvée');
    }

    return {
      ...leave,
      days: leave.days.toString(),
    };
  }

  /**
   * Mettre à jour une demande de congé
   * Uniquement si status = PENDING
   * BUG-02 FIX: Utilisateurs peuvent modifier leurs propres demandes PENDING
   */
  async update(
    id: string,
    updateLeaveDto: UpdateLeaveDto,
    userId: string,
    userRole: string,
  ) {
    const existingLeave = await this.prisma.leave.findUnique({
      where: { id },
    });

    if (!existingLeave) {
      throw new NotFoundException('Demande de congé non trouvée');
    }

    // BUG-02 FIX: Vérifier les permissions
    // Autorisé: Le user lui-même, ADMIN, ou RESPONSABLE
    const isOwner = existingLeave.userId === userId;
    const hasManagementRights = ['ADMIN', 'RESPONSABLE'].includes(userRole);

    if (!isOwner && !hasManagementRights) {
      throw new ForbiddenException(
        'Vous n\'êtes pas autorisé à modifier cette demande',
      );
    }

    // Seules les demandes PENDING peuvent être modifiées
    if (existingLeave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'Seules les demandes en attente peuvent être modifiées',
      );
    }

    const { startDate, endDate, days, type, reason } = updateLeaveDto;

    // Validation des dates si modifiées
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : existingLeave.startDate;
      const end = endDate ? new Date(endDate) : existingLeave.endDate;

      if (start > end) {
        throw new BadRequestException(
          'La date de début doit être antérieure ou égale à la date de fin',
        );
      }

      // Vérifier les chevauchements (exclure cette demande)
      const hasOverlap = await this.checkOverlap(
        existingLeave.userId,
        start,
        end,
        id,
      );
      if (hasOverlap) {
        throw new BadRequestException(
          'Cette période chevauche avec une demande de congé déjà approuvée',
        );
      }
    }

    // Mise à jour
    const updated = await this.prisma.leave.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(days !== undefined && { days }),
        ...(reason !== undefined && { reason }),
      },
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

    return {
      ...updated,
      days: updated.days.toString(),
    };
  }

  /**
   * Supprimer une demande de congé
   * Uniquement si status = PENDING
   */
  async remove(id: string, userId: string, userRole: string) {
    const existingLeave = await this.prisma.leave.findUnique({
      where: { id },
    });

    if (!existingLeave) {
      throw new NotFoundException('Demande de congé non trouvée');
    }

    // Vérifier les permissions
    if (existingLeave.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Vous n\'êtes pas autorisé à supprimer cette demande',
      );
    }

    // Seules les demandes PENDING peuvent être supprimées
    if (existingLeave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'Seules les demandes en attente peuvent être supprimées',
      );
    }

    await this.prisma.leave.delete({
      where: { id },
    });

    return {
      message: 'Demande de congé supprimée avec succès',
    };
  }

  /**
   * Approuver une demande de congé
   * Réservé aux rôles: ADMIN, RESPONSABLE, MANAGER
   */
  async approve(id: string, approverId: string) {
    const existingLeave = await this.prisma.leave.findUnique({
      where: { id },
    });

    if (!existingLeave) {
      throw new NotFoundException('Demande de congé non trouvée');
    }

    if (existingLeave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'Seules les demandes en attente peuvent être approuvées',
      );
    }

    const approved = await this.prisma.leave.update({
      where: { id },
      data: {
        status: LeaveStatus.APPROVED,
        approverId,
        approvedAt: new Date(),
      },
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

    return {
      ...approved,
      days: approved.days.toString(),
    };
  }

  /**
   * Rejeter une demande de congé
   * Réservé aux rôles: ADMIN, RESPONSABLE, MANAGER
   */
  async reject(id: string, rejectLeaveDto: RejectLeaveDto, approverId: string) {
    const existingLeave = await this.prisma.leave.findUnique({
      where: { id },
    });

    if (!existingLeave) {
      throw new NotFoundException('Demande de congé non trouvée');
    }

    if (existingLeave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'Seules les demandes en attente peuvent être rejetées',
      );
    }

    // On peut stocker la raison du rejet dans le champ reason
    const updated = await this.prisma.leave.update({
      where: { id },
      data: {
        status: LeaveStatus.REJECTED,
        approverId,
        approvedAt: new Date(),
        ...(rejectLeaveDto.rejectionReason && {
          reason: `${existingLeave.reason || ''}\n\n[REJETÉ] ${rejectLeaveDto.rejectionReason}`,
        }),
      },
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

    return {
      ...updated,
      days: updated.days.toString(),
    };
  }

  /**
   * Annuler une demande de congé approuvée
   * Réservé aux rôles: ADMIN, RESPONSABLE
   */
  async cancel(id: string, userId: string) {
    const existingLeave = await this.prisma.leave.findUnique({
      where: { id },
    });

    if (!existingLeave) {
      throw new NotFoundException('Demande de congé non trouvée');
    }

    if (existingLeave.status !== LeaveStatus.APPROVED) {
      throw new BadRequestException(
        'Seules les demandes approuvées peuvent être annulées',
      );
    }

    const cancelled = await this.prisma.leave.update({
      where: { id },
      data: {
        status: LeaveStatus.CANCELLED,
      },
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

    return {
      ...cancelled,
      days: cancelled.days.toString(),
    };
  }

  /**
   * Récupérer les statistiques de congés d'un utilisateur
   */
  async getUserLeaveStats(userId: string) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Statistiques par statut
    const statsByStatus = await this.prisma.leave.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
      _sum: {
        days: true,
      },
    });

    // Statistiques par type
    const statsByType = await this.prisma.leave.groupBy({
      by: ['type'],
      where: { userId },
      _count: true,
      _sum: {
        days: true,
      },
    });

    // Convertir les Decimal en string
    const formattedByStatus = statsByStatus.map((stat) => ({
      status: stat.status,
      count: stat._count,
      totalDays: stat._sum.days ? stat._sum.days.toString() : '0',
    }));

    const formattedByType = statsByType.map((stat) => ({
      type: stat.type,
      count: stat._count,
      totalDays: stat._sum.days ? stat._sum.days.toString() : '0',
    }));

    // Total général
    const totalLeaves = await this.prisma.leave.count({
      where: { userId },
    });

    return {
      userId,
      totalLeaves,
      byStatus: formattedByStatus,
      byType: formattedByType,
    };
  }

  /**
   * Vérifier si une période chevauche avec des congés approuvés existants
   */
  private async checkOverlap(
    userId: string,
    startDate: Date,
    endDate: Date,
    excludeLeaveId?: string,
  ): Promise<boolean> {
    const where: Prisma.LeaveWhereInput = {
      userId,
      status: LeaveStatus.APPROVED,
      OR: [
        // Le nouveau congé commence pendant un congé existant
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: startDate } },
          ],
        },
        // Le nouveau congé se termine pendant un congé existant
        {
          AND: [{ startDate: { lte: endDate } }, { endDate: { gte: endDate } }],
        },
        // Le nouveau congé englobe complètement un congé existant
        {
          AND: [
            { startDate: { gte: startDate } },
            { endDate: { lte: endDate } },
          ],
        },
      ],
    };

    if (excludeLeaveId) {
      where.NOT = { id: excludeLeaveId };
    }

    const overlappingLeaves = await this.prisma.leave.findMany({
      where,
    });

    return overlappingLeaves.length > 0;
  }
}
