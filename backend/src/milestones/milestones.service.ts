import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto, MilestoneStatus } from './dto/update-milestone.dto';

@Injectable()
export class MilestonesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupérer tous les milestones (avec pagination optionnelle)
   */
  async findAll(query?: { page?: number; limit?: number; projectId?: string }) {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const where = query?.projectId ? { projectId: query.projectId } : {};

    const [data, total] = await Promise.all([
      this.prisma.milestone.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.milestone.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Créer un nouveau milestone
   */
  async create(createMilestoneDto: CreateMilestoneDto) {
    const { projectId, ownerId, ...data } = createMilestoneDto;

    return this.prisma.milestone.create({
      data: {
        projectId,
        ownerId,
        name: data.name,
        description: data.description || '',
        code: data.code || '',
        type: data.type || 'MINOR',
        dueDate: new Date(createMilestoneDto.dueDate),
        startDate: data.startDate ? new Date(data.startDate) : null,
        followsTasks: data.followsTasks ?? false,
        isKeyDate: data.isKeyDate ?? false,
        deliverables: data.deliverables || [],
        successCriteria: data.successCriteria || [],
        reviewers: data.reviewers || [],
        completionRate: data.completionRate ?? 0,
        dependsOn: data.dependsOn || [],
        epicIds: data.epicIds || [],
        taskIds: data.taskIds || [],
        validationRequired: data.validationRequired ?? false,
        impact: data.impact || 'MEDIUM',
        affectedTeams: data.affectedTeams || [],
        color: data.color || '#3b82f6',
        icon: data.icon,
        showOnRoadmap: data.showOnRoadmap ?? true,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer tous les milestones d'un projet
   */
  async findByProject(projectId: string) {
    return this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: { dueDate: 'asc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer les milestones par statut
   */
  async findByProjectAndStatus(projectId: string, status: MilestoneStatus) {
    return this.prisma.milestone.findMany({
      where: {
        projectId,
        status,
      },
      orderBy: { dueDate: 'asc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer les milestones à risque (date dépassée, non complétés)
   */
  async findAtRisk(projectId: string) {
    const now = new Date();
    return this.prisma.milestone.findMany({
      where: {
        projectId,
        dueDate: {
          lt: now,
        },
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
        completionRate: {
          lt: 100,
        },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer les milestones à venir (dans les N prochains jours)
   */
  async findUpcoming(projectId: string, days: number = 30) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return this.prisma.milestone.findMany({
      where: {
        projectId,
        dueDate: {
          gte: now,
          lte: futureDate,
        },
        status: {
          not: 'COMPLETED',
        },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer un milestone par ID
   */
  async findOne(id: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }

    return milestone;
  }

  /**
   * Mettre à jour un milestone
   */
  async update(id: string, updateMilestoneDto: UpdateMilestoneDto) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }

    const updateData: any = { ...updateMilestoneDto };

    // Convert date strings to Date objects
    if (updateMilestoneDto.dueDate) {
      updateData.dueDate = new Date(updateMilestoneDto.dueDate);
    }
    if (updateMilestoneDto.startDate) {
      updateData.startDate = new Date(updateMilestoneDto.startDate);
    }

    // Remove fields that shouldn't be updated via this method
    delete updateData.projectId;
    delete updateData.ownerId;

    return this.prisma.milestone.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Mettre à jour le statut d'un milestone
   */
  async updateStatus(id: string, status: MilestoneStatus) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }

    const updateData: any = { status };

    // Si marqué comme COMPLETED, mettre completionRate à 100
    if (status === 'COMPLETED') {
      updateData.completionRate = 100;
    }

    return this.prisma.milestone.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Valider un milestone
   */
  async validate(id: string, validatorId: string, notes?: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }

    return this.prisma.milestone.update({
      where: { id },
      data: {
        validatedBy: validatorId,
        validatedAt: new Date(),
        validationNotes: notes,
        status: 'COMPLETED',
        completionRate: 100,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Supprimer un milestone
   */
  async remove(id: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }

    return this.prisma.milestone.delete({
      where: { id },
    });
  }

  /**
   * Calculer les métriques des milestones d'un projet
   */
  async getProjectMetrics(projectId: string) {
    const milestones = await this.prisma.milestone.findMany({
      where: { projectId },
    });

    const atRisk = await this.findAtRisk(projectId);
    const upcoming = await this.findUpcoming(projectId);

    const totalCompletion = milestones.reduce(
      (sum, m) => sum + (m.completionRate || 0),
      0,
    );

    return {
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter((m) => m.status === 'COMPLETED')
        .length,
      atRiskMilestones: atRisk.length,
      upcomingMilestones: upcoming.length,
      averageCompletion:
        milestones.length > 0
          ? Math.round(totalCompletion / milestones.length)
          : 0,
      keyDatesCount: milestones.filter((m) => m.isKeyDate).length,
    };
  }
}
