import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';

@Injectable()
export class TimeEntriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer une time entry
   */
  async create(userId: string, createDto: CreateTimeEntryDto) {
    return this.prisma.timeEntry.create({
      data: {
        userId,
        projectId: createDto.projectId,
        taskId: createDto.taskId,
        type: createDto.type || 'TASK',
        description: createDto.description,
        date: new Date(createDto.date),
        duration: createDto.duration,
        isBillable: createDto.isBillable ?? true,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer toutes les time entries (avec filtres)
   */
  async findAll(query?: {
    userId?: string;
    projectId?: string;
    taskId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query?.userId) {
      where.userId = query.userId;
    }

    if (query?.projectId) {
      where.projectId = query.projectId;
    }

    if (query?.taskId) {
      where.taskId = query.taskId;
    }

    if (query?.startDate || query?.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.timeEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.timeEntry.count({ where }),
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
   * Récupérer une time entry par ID
   */
  async findOne(id: string, userId: string, isAdmin: boolean = false) {
    const timeEntry = await this.prisma.timeEntry.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!timeEntry) {
      throw new NotFoundException(`TimeEntry with ID ${id} not found`);
    }

    // Vérifier que l'utilisateur est propriétaire ou admin
    if (!isAdmin && timeEntry.userId !== userId) {
      throw new ForbiddenException('You can only access your own time entries');
    }

    return timeEntry;
  }

  /**
   * Mettre à jour une time entry
   */
  async update(
    id: string,
    userId: string,
    updateDto: UpdateTimeEntryDto,
    isAdmin: boolean = false,
  ) {
    // Vérifier que la time entry existe et appartient à l'utilisateur
    await this.findOne(id, userId, isAdmin);

    const updateData: any = { ...updateDto };

    if (updateDto.date) {
      updateData.date = new Date(updateDto.date);
    }

    return this.prisma.timeEntry.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  /**
   * Supprimer une time entry
   */
  async remove(id: string, userId: string, isAdmin: boolean = false) {
    // Vérifier que la time entry existe et appartient à l'utilisateur
    await this.findOne(id, userId, isAdmin);

    return this.prisma.timeEntry.delete({
      where: { id },
    });
  }

  /**
   * Obtenir les statistiques de temps pour un utilisateur
   */
  async getStats(
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const timeEntries = await this.prisma.timeEntry.findMany({
      where,
    });

    const totalMinutes = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const billableMinutes = timeEntries.reduce(
      (sum, entry) => sum + (entry.isBillable ? entry.duration : 0),
      0,
    );

    // Group by type
    const byType: Record<string, number> = {};
    timeEntries.forEach((entry) => {
      byType[entry.type] = (byType[entry.type] || 0) + entry.duration;
    });

    // Group by project
    const byProject: Record<string, number> = {};
    timeEntries.forEach((entry) => {
      if (entry.projectId) {
        byProject[entry.projectId] = (byProject[entry.projectId] || 0) + entry.duration;
      }
    });

    return {
      totalEntries: timeEntries.length,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      billableMinutes,
      billableHours: Math.round((billableMinutes / 60) * 100) / 100,
      nonBillableMinutes: totalMinutes - billableMinutes,
      byType,
      byProject,
    };
  }

  /**
   * Obtenir les statistiques pour un projet
   */
  async getProjectStats(projectId: string, startDate?: string, endDate?: string) {
    const where: any = { projectId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const timeEntries = await this.prisma.timeEntry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const totalMinutes = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);

    // Group by user
    const byUser: Record<string, { name: string; minutes: number }> = {};
    timeEntries.forEach((entry) => {
      const userName = `${entry.user.firstName} ${entry.user.lastName}`;
      if (!byUser[entry.userId]) {
        byUser[entry.userId] = { name: userName, minutes: 0 };
      }
      byUser[entry.userId].minutes += entry.duration;
    });

    return {
      totalEntries: timeEntries.length,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      byUser,
    };
  }
}
