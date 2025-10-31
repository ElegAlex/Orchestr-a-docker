import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSimpleTaskDto, CreateMultipleSimpleTasksDto } from './dto/create-simple-task.dto';
import { UpdateSimpleTaskDto } from './dto/update-simple-task.dto';

@Injectable()
export class SimpleTasksService {
  constructor(private prisma: PrismaService) {}

  async create(createSimpleTaskDto: CreateSimpleTaskDto) {
    const { timeSlot, date, ...rest } = createSimpleTaskDto;

    return this.prisma.simpleTask.create({
      data: {
        ...rest,
        date: new Date(date),
        timeStart: timeSlot.start,
        timeEnd: timeSlot.end,
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
        creator: {
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

  async createMultiple(createMultipleDto: CreateMultipleSimpleTasksDto) {
    const { timeSlot, date, userIds, createdBy, ...taskData } = createMultipleDto;

    const tasks = await Promise.all(
      userIds.map((userId) =>
        this.prisma.simpleTask.create({
          data: {
            ...taskData,
            date: new Date(date),
            timeStart: timeSlot.start,
            timeEnd: timeSlot.end,
            assignedTo: userId,
            createdBy,
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
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        }),
      ),
    );

    return tasks;
  }

  async findAll() {
    return this.prisma.simpleTask.findMany({
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.simpleTask.findMany({
      where: {
        assignedTo: userId,
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
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findByUserAndDateRange(userId: string, startDate: string, endDate: string) {
    return this.prisma.simpleTask.findMany({
      where: {
        assignedTo: userId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
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
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.simpleTask.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`SimpleTask with id ${id} not found`);
    }

    return task;
  }

  async update(id: string, updateSimpleTaskDto: UpdateSimpleTaskDto) {
    await this.findOne(id); // Vérifier que la tâche existe

    const { timeSlot, date, ...rest } = updateSimpleTaskDto;

    const updateData: any = { ...rest };

    if (date) {
      updateData.date = new Date(date);
    }

    if (timeSlot) {
      updateData.timeStart = timeSlot.start;
      updateData.timeEnd = timeSlot.end;
    }

    return this.prisma.simpleTask.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
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

  async updateStatus(id: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') {
    await this.findOne(id);

    return this.prisma.simpleTask.update({
      where: { id },
      data: { status },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
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
   * BUG-04 FIX: Suppression avec vérification des permissions
   * Seul le créateur ou l'assigné peut supprimer une tâche simple
   */
  async remove(id: string, currentUserId: string) {
    const task = await this.findOne(id);

    // Vérifier que l'utilisateur est soit le créateur, soit l'assigné
    if (task.createdBy !== currentUserId && task.assignedTo !== currentUserId) {
      throw new ForbiddenException(
        'You can only delete simple tasks that you created or that are assigned to you'
      );
    }

    return this.prisma.simpleTask.delete({
      where: { id },
    });
  }
}
