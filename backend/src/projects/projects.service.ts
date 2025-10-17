import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FilterProjectDto } from './dto/filter-project.dto';
import { AddMemberDto } from './dto/add-member.dto';

/**
 * Service de gestion des projets
 *
 * Fonctionnalités :
 * - CRUD complet
 * - Gestion des membres
 * - Recherche et filtrage
 * - Pagination
 * - Statistiques
 */
@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un nouveau projet
   */
  async create(createProjectDto: CreateProjectDto) {
    const { managerId, startDate, dueDate, ...rest } = createProjectDto;

    // Vérifier que le chef de projet existe
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      throw new NotFoundException('Chef de projet non trouvé');
    }

    // Vérifier les dates
    if (new Date(startDate) > new Date(dueDate)) {
      throw new BadRequestException(
        'La date de début doit être antérieure à la date de fin',
      );
    }

    // Créer le projet
    const project = await this.prisma.project.create({
      data: {
        ...rest,
        managerId,
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
      } as any,
      include: {
        members: {
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
        },
        _count: {
          select: {
            tasks: true,
            documents: true,
            milestones: true,
          },
        },
      },
    });

    return project;
  }

  /**
   * Récupérer tous les projets avec filtrage et pagination
   */
  async findAll(filterDto: FilterProjectDto) {
    const {
      search,
      status,
      priority,
      managerId,
      startDateAfter,
      dueDateBefore,
      tag,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    // Construction des filtres WHERE
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (managerId) {
      where.managerId = managerId;
    }

    if (startDateAfter) {
      where.startDate = { gte: new Date(startDateAfter) };
    }

    if (dueDateBefore) {
      where.dueDate = { lte: new Date(dueDateBefore) };
    }

    if (tag) {
      where.tags = { has: tag };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Exécuter les requêtes en parallèle
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          members: {
            take: 5, // Limiter à 5 membres pour la liste
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
          },
          _count: {
            select: {
              tasks: true,
              documents: true,
              milestones: true,
              members: true,
            },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupérer un projet par ID
   */
  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        members: {
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
        },
        tasks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
        milestones: {
          orderBy: { dueDate: 'asc' },
        },
        _count: {
          select: {
            tasks: true,
            documents: true,
            milestones: true,
            members: true,
            activities: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Projet non trouvé');
    }

    return project;
  }

  /**
   * Mettre à jour un projet
   */
  async update(id: string, updateProjectDto: UpdateProjectDto) {
    // Vérifier que le projet existe
    const existingProject = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      throw new NotFoundException('Projet non trouvé');
    }

    // Si le chef de projet est modifié, vérifier qu'il existe
    if (updateProjectDto.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: updateProjectDto.managerId },
      });

      if (!manager) {
        throw new NotFoundException('Chef de projet non trouvé');
      }
    }

    // Vérifier les dates si modifiées
    const startDate = updateProjectDto.startDate
      ? new Date(updateProjectDto.startDate)
      : existingProject.startDate;
    const dueDate = updateProjectDto.dueDate
      ? new Date(updateProjectDto.dueDate)
      : existingProject.dueDate;

    if (startDate > dueDate) {
      throw new BadRequestException(
        'La date de début doit être antérieure à la date de fin',
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = { ...updateProjectDto };
    if (updateProjectDto.startDate) {
      updateData.startDate = new Date(updateProjectDto.startDate);
    }
    if (updateProjectDto.dueDate) {
      updateData.dueDate = new Date(updateProjectDto.dueDate);
    }

    // Mettre à jour le projet
    const project = await this.prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        members: {
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
        },
        _count: {
          select: {
            tasks: true,
            documents: true,
            milestones: true,
          },
        },
      },
    });

    return project;
  }

  /**
   * Supprimer un projet
   */
  async remove(id: string) {
    // Vérifier que le projet existe
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Projet non trouvé');
    }

    // Empêcher la suppression si des tâches existent
    if (project._count.tasks > 0) {
      throw new BadRequestException(
        `Impossible de supprimer ce projet : ${project._count.tasks} tâche(s) associée(s)`,
      );
    }

    // Supprimer le projet
    await this.prisma.project.delete({
      where: { id },
    });

    return { message: 'Projet supprimé avec succès' };
  }

  /**
   * Ajouter un membre au projet
   */
  async addMember(projectId: string, addMemberDto: AddMemberDto) {
    const { userId, role } = addMemberDto;

    // Vérifier que le projet existe
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Projet non trouvé');
    }

    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier que l'utilisateur n'est pas déjà membre
    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('Cet utilisateur est déjà membre du projet');
    }

    // Ajouter le membre
    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role,
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

    return member;
  }

  /**
   * Retirer un membre du projet
   */
  async removeMember(projectId: string, userId: string) {
    // Vérifier que le membre existe
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Membre non trouvé dans ce projet');
    }

    // Supprimer le membre
    await this.prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    return { message: 'Membre retiré avec succès' };
  }

  /**
   * Récupérer les statistiques d'un projet
   */
  async getProjectStats(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        startDate: true,
        dueDate: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Projet non trouvé');
    }

    // Statistiques des tâches par statut
    const tasksByStatus = await this.prisma.task.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true,
    });

    // Statistiques des tâches par priorité
    const tasksByPriority = await this.prisma.task.groupBy({
      by: ['priority'],
      where: { projectId },
      _count: true,
    });

    // Nombre total de documents, membres, activités
    const counts = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        _count: {
          select: {
            tasks: true,
            documents: true,
            members: true,
            milestones: true,
            activities: true,
          },
        },
      },
    });

    return {
      project,
      tasksByStatus,
      tasksByPriority,
      counts: counts?._count,
    };
  }
}
