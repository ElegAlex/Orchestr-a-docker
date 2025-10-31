import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';

/**
 * Service de gestion des tâches
 *
 * Fonctionnalités :
 * - CRUD complet
 * - Gestion des assignations
 * - Recherche et filtrage avancés
 * - Pagination
 * - Validation des dépendances
 * - Statistiques par projet
 */
@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer une nouvelle tâche
   */
  async create(createTaskDto: CreateTaskDto) {
    const { projectId, assigneeId, dueDate, dependencies, ...rest } =
      createTaskDto;

    // Vérifier que le projet existe
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Projet non trouvé');
    }

    // Si un assigné est spécifié, vérifier qu'il existe
    if (assigneeId) {
      const assignee = await this.prisma.user.findUnique({
        where: { id: assigneeId },
      });

      if (!assignee) {
        throw new NotFoundException('Utilisateur assigné non trouvé');
      }
    }

    // Valider les dépendances si spécifiées
    if (dependencies && dependencies.length > 0) {
      const existingTasks = await this.prisma.task.findMany({
        where: {
          id: { in: dependencies },
          projectId, // Les dépendances doivent être dans le même projet
        },
      });

      if (existingTasks.length !== dependencies.length) {
        throw new BadRequestException(
          'Une ou plusieurs tâches dépendantes n\'existent pas ou ne sont pas dans le même projet',
        );
      }
    }

    // Créer la tâche
    const task = await this.prisma.task.create({
      data: {
        ...rest,
        projectId,
        assigneeId,
        dueDate: dueDate ? new Date(dueDate) : null,
        dependencies: dependencies || [],
        status: (createTaskDto.status as any) || 'TODO',
        priority: (createTaskDto.priority as any) || 'MEDIUM',
      } as any,
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            comments: true,
            documents: true,
          },
        },
      },
    });

    return task;
  }

  /**
   * Récupérer toutes les tâches avec filtrage et pagination
   * 🔒 Isolation par département : Filtre les tâches via l'assignee du département
   */
  async findAll(filterDto: FilterTaskDto) {
    const {
      search,
      projectId,
      assigneeId,
      departmentId,
      status,
      priority,
      dueDateAfter,
      dueDateBefore,
      tag,
      completed,
      unassigned,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    // Construction des filtres WHERE
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    // 🔒 Filtre par département : tâches assignées à un user du département
    if (departmentId) {
      where.assignee = {
        departmentId: departmentId,
      };
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (dueDateAfter) {
      where.dueDate = { ...where.dueDate, gte: new Date(dueDateAfter) };
    }

    if (dueDateBefore) {
      where.dueDate = { ...where.dueDate, lte: new Date(dueDateBefore) };
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (completed !== undefined) {
      if (completed) {
        where.status = 'COMPLETED';
      } else {
        where.status = { not: 'COMPLETED' };
      }
    }

    if (unassigned !== undefined) {
      if (unassigned) {
        where.assigneeId = null;
      } else {
        where.assigneeId = { not: null };
      }
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Exécuter les requêtes en parallèle
    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignee: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          _count: {
            select: {
              comments: true,
              documents: true,
            },
          },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupérer une tâche par ID
   */
  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            managerId: true,
          },
        },
        comments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            documents: true,
            activities: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    return task;
  }

  /**
   * BUG-06 FIX: Vérifier si un utilisateur est membre de l'équipe d'un projet
   */
  private async isProjectTeamMember(
    projectId: string,
    userId: string,
  ): Promise<boolean> {
    const member = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });
    return !!member;
  }

  /**
   * Mettre à jour une tâche
   * BUG-06 FIX: Les membres de l'équipe projet peuvent modifier le statut
   */
  async update(id: string, updateTaskDto: UpdateTaskDto, currentUserId?: string) {
    // Vérifier que la tâche existe
    const existingTask = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            managerId: true,
          },
        },
      },
    });

    if (!existingTask) {
      throw new NotFoundException('Tâche non trouvée');
    }

    // BUG-06 FIX: Vérifier les permissions si un userId est fourni
    if (currentUserId) {
      // Récupérer le rôle de l'utilisateur
      const user = await this.prisma.user.findUnique({
        where: { id: currentUserId },
        select: { role: true },
      });

      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      // Les ADMIN, RESPONSABLE, MANAGER ont tous les droits
      const hasAdminRights = ['ADMIN', 'RESPONSABLE', 'MANAGER'].includes(user.role);

      // L'assigné peut modifier sa tâche
      const isAssignee = existingTask.assigneeId === currentUserId;

      // Le manager du projet peut modifier
      const isProjectManager = existingTask.project.managerId === currentUserId;

      // Membre de l'équipe projet peut modifier
      const isTeamMember = await this.isProjectTeamMember(
        existingTask.project.id,
        currentUserId,
      );

      if (!hasAdminRights && !isAssignee && !isProjectManager && !isTeamMember) {
        throw new ForbiddenException(
          'Vous devez être membre de l\'équipe projet, assigné à la tâche, ou avoir les droits de gestion pour modifier cette tâche',
        );
      }
    }

    // Si l'assigné est modifié, vérifier qu'il existe
    if (updateTaskDto.assigneeId) {
      const assignee = await this.prisma.user.findUnique({
        where: { id: updateTaskDto.assigneeId },
      });

      if (!assignee) {
        throw new NotFoundException('Utilisateur assigné non trouvé');
      }
    }

    // Valider les dépendances si modifiées
    if (updateTaskDto.dependencies && updateTaskDto.dependencies.length > 0) {
      const existingTasks = await this.prisma.task.findMany({
        where: {
          id: { in: updateTaskDto.dependencies },
          projectId: existingTask.projectId,
        },
      });

      if (existingTasks.length !== updateTaskDto.dependencies.length) {
        throw new BadRequestException(
          'Une ou plusieurs tâches dépendantes n\'existent pas ou ne sont pas dans le même projet',
        );
      }

      // Vérifier qu'on ne crée pas de dépendance circulaire
      if (updateTaskDto.dependencies.includes(id)) {
        throw new BadRequestException(
          'Une tâche ne peut pas dépendre d\'elle-même',
        );
      }
    }

    // Si le statut passe à COMPLETED, ajouter la date de complétion
    const updateData: any = { ...updateTaskDto };
    if (updateTaskDto.status === 'COMPLETED' && !existingTask.completedAt) {
      updateData.completedAt = new Date();
    }

    // Si le statut repasse à autre chose que COMPLETED, retirer la date de complétion
    if (
      updateTaskDto.status &&
      updateTaskDto.status !== 'COMPLETED' &&
      existingTask.completedAt
    ) {
      updateData.completedAt = null;
    }

    // Convertir les dates
    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }
    if (updateTaskDto.completedAt) {
      updateData.completedAt = new Date(updateTaskDto.completedAt);
    }

    // Mettre à jour la tâche
    const task = await this.prisma.task.update({
      where: { id },
      data: updateData as any,
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            comments: true,
            documents: true,
          },
        },
      },
    });

    return task;
  }

  /**
   * Supprimer une tâche
   */
  async remove(id: string) {
    // Vérifier que la tâche existe
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    // Vérifier que d'autres tâches ne dépendent pas de celle-ci
    const dependentTasks = await this.prisma.task.findMany({
      where: {
        dependencies: { has: id },
      },
    });

    if (dependentTasks.length > 0) {
      throw new BadRequestException(
        `Impossible de supprimer cette tâche : ${dependentTasks.length} tâche(s) en dépendent`,
      );
    }

    // Supprimer la tâche
    await this.prisma.task.delete({
      where: { id },
    });

    return { message: 'Tâche supprimée avec succès' };
  }

  /**
   * Récupérer les statistiques des tâches d'un projet
   */
  async getProjectTaskStats(projectId: string) {
    // Vérifier que le projet existe
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Projet non trouvé');
    }

    // Statistiques par statut
    const tasksByStatus = await this.prisma.task.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true,
    });

    // Statistiques par priorité
    const tasksByPriority = await this.prisma.task.groupBy({
      by: ['priority'],
      where: { projectId },
      _count: true,
    });

    // Tâches assignées vs non assignées
    const assignedCount = await this.prisma.task.count({
      where: {
        projectId,
        assigneeId: { not: null },
      },
    });

    const unassignedCount = await this.prisma.task.count({
      where: {
        projectId,
        assigneeId: null,
      },
    });

    // Total des heures estimées et réelles
    const hoursAggregate = await this.prisma.task.aggregate({
      where: { projectId },
      _sum: {
        estimatedHours: true,
        actualHours: true,
      },
    });

    return {
      project,
      tasksByStatus,
      tasksByPriority,
      assignedCount,
      unassignedCount,
      totalEstimatedHours: hoursAggregate._sum.estimatedHours || 0,
      totalActualHours: hoursAggregate._sum.actualHours || 0,
    };
  }

  /**
   * Récupérer les tâches assignées à un utilisateur
   */
  async getUserTasks(userId: string, filterDto: FilterTaskDto) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Appliquer le filtre avec l'assigneeId forcé
    return this.findAll({
      ...filterDto,
      assigneeId: userId,
    });
  }
}
