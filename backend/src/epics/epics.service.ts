import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEpicDto } from './dto/create-epic.dto';
import {
  UpdateEpicDto,
  UpdateEpicProgressDto,
  UpdateEpicStatusDto,
} from './dto/update-epic.dto';

@Injectable()
export class EpicsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un nouvel epic
   */
  async create(createDto: CreateEpicDto) {
    // Générer le code si non fourni
    const code =
      createDto.code ||
      `EP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    return this.prisma.epic.create({
      data: {
        projectId: createDto.projectId,
        code,
        name: createDto.name,
        description: createDto.description || '',
        status: createDto.status || 'UPCOMING',
        priority: createDto.priority || 'MEDIUM',
        risk: createDto.risk || 'MEDIUM',
        startDate: createDto.startDate ? new Date(createDto.startDate) : null,
        endDate: createDto.endDate ? new Date(createDto.endDate) : null,
        progress: createDto.progress || 0,
        ownerId: createDto.ownerId,
        stakeholders: createDto.stakeholders || [],
        taskIds: createDto.taskIds || [],
        taskCount: createDto.taskIds?.length || 0,
        businessValue: createDto.businessValue,
        tags: createDto.tags || [],
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
   * Récupérer tous les epics (avec pagination)
   */
  async findAll(query?: { page?: number; limit?: number; projectId?: string }) {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const where = query?.projectId ? { projectId: query.projectId } : {};

    const [data, total] = await Promise.all([
      this.prisma.epic.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.epic.count({ where }),
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
   * Récupérer les epics d'un projet
   */
  async findByProject(projectId: string) {
    return this.prisma.epic.findMany({
      where: { projectId },
      orderBy: [{ status: 'asc' }, { priority: 'desc' }],
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
   * Récupérer un epic par ID
   */
  async findOne(id: string) {
    const epic = await this.prisma.epic.findUnique({
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

    if (!epic) {
      throw new NotFoundException(`Epic with ID ${id} not found`);
    }

    return epic;
  }

  /**
   * Récupérer les tâches associées à un epic
   */
  async findEpicTasks(id: string) {
    const epic = await this.findOne(id);

    if (epic.taskIds.length === 0) {
      return [];
    }

    return this.prisma.task.findMany({
      where: {
        id: {
          in: epic.taskIds,
        },
      },
      include: {
        assignee: {
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
   * Mettre à jour un epic
   */
  async update(id: string, updateDto: UpdateEpicDto) {
    const epic = await this.prisma.epic.findUnique({
      where: { id },
    });

    if (!epic) {
      throw new NotFoundException(`Epic with ID ${id} not found`);
    }

    const updateData: any = { ...updateDto };

    // Convert dates
    if (updateDto.startDate) {
      updateData.startDate = new Date(updateDto.startDate);
    }
    if (updateDto.endDate) {
      updateData.endDate = new Date(updateDto.endDate);
    }

    // Update task count if taskIds changed
    if (updateDto.taskIds) {
      updateData.taskCount = updateDto.taskIds.length;
    }

    // Remove fields that shouldn't be updated
    delete updateData.projectId;
    delete updateData.ownerId;

    return this.prisma.epic.update({
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
   * Mettre à jour la progression d'un epic
   */
  async updateProgress(id: string, progressDto: UpdateEpicProgressDto) {
    const epic = await this.prisma.epic.findUnique({
      where: { id },
    });

    if (!epic) {
      throw new NotFoundException(`Epic with ID ${id} not found`);
    }

    // Auto-update status based on progress
    let status = epic.status;
    if (progressDto.progress === 100 && status !== 'COMPLETED') {
      status = 'COMPLETED';
    } else if (
      progressDto.progress > 0 &&
      progressDto.progress < 100 &&
      status === 'UPCOMING'
    ) {
      status = 'IN_PROGRESS';
    }

    return this.prisma.epic.update({
      where: { id },
      data: {
        progress: progressDto.progress,
        status,
      },
    });
  }

  /**
   * Mettre à jour le statut d'un epic
   */
  async updateStatus(id: string, statusDto: UpdateEpicStatusDto) {
    const epic = await this.prisma.epic.findUnique({
      where: { id },
    });

    if (!epic) {
      throw new NotFoundException(`Epic with ID ${id} not found`);
    }

    return this.prisma.epic.update({
      where: { id },
      data: {
        status: statusDto.status,
      },
    });
  }

  /**
   * Supprimer un epic
   */
  async remove(id: string) {
    const epic = await this.prisma.epic.findUnique({
      where: { id },
    });

    if (!epic) {
      throw new NotFoundException(`Epic with ID ${id} not found`);
    }

    return this.prisma.epic.delete({
      where: { id },
    });
  }
}
