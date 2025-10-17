import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { FilterActivityDto } from './dto/filter-activity.dto';
import { Prisma } from '@prisma/client';

/**
 * Service de gestion des logs d'activité
 *
 * Fonctionnalités:
 * - Création de logs d'activité
 * - Recherche et filtrage avancés
 * - Statistiques
 * - Export (à implémenter)
 */
@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer une nouvelle entrée d'activité (log)
   */
  async create(createActivityDto: CreateActivityDto) {
    const {
      userId,
      action,
      resource,
      resourceId,
      projectId,
      taskId,
      status,
      error,
      duration,
      metadata,
    } = createActivityDto;

    // Créer le log d'activité
    const activity = await this.prisma.activity.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        projectId,
        taskId,
        status,
        error,
        duration,
        metadata,
      },
      include: {
        user: userId
          ? {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            }
          : false,
        project: projectId
          ? {
              select: {
                id: true,
                name: true,
              },
            }
          : false,
        task: taskId
          ? {
              select: {
                id: true,
                title: true,
              },
            }
          : false,
      },
    });

    return activity;
  }

  /**
   * Récupérer toutes les activités avec filtrage et pagination
   */
  async findAll(filterDto: FilterActivityDto) {
    const {
      userId,
      action,
      resource,
      projectId,
      taskId,
      status,
      timestampFrom,
      timestampTo,
      search,
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = filterDto;

    // Construction des filtres
    const where: Prisma.ActivityWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (resource) {
      where.resource = resource;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (taskId) {
      where.taskId = taskId;
    }

    if (status) {
      where.status = status;
    }

    if (timestampFrom || timestampTo) {
      where.timestamp = {};
      if (timestampFrom) {
        where.timestamp.gte = new Date(timestampFrom);
      }
      if (timestampTo) {
        where.timestamp.lte = new Date(timestampTo);
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Exécution des requêtes
    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
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
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupérer une activité par ID
   */
  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({
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

    if (!activity) {
      throw new NotFoundException('Activité non trouvée');
    }

    return activity;
  }

  /**
   * Supprimer une activité (ADMIN uniquement)
   */
  async remove(id: string) {
    const existingActivity = await this.prisma.activity.findUnique({
      where: { id },
    });

    if (!existingActivity) {
      throw new NotFoundException('Activité non trouvée');
    }

    await this.prisma.activity.delete({
      where: { id },
    });

    return {
      message: 'Activité supprimée avec succès',
    };
  }

  /**
   * Supprimer toutes les activités (ADMIN uniquement)
   * Utile pour nettoyer les vieux logs
   */
  async removeAll() {
    const result = await this.prisma.activity.deleteMany({});

    return {
      message: `${result.count} activité(s) supprimée(s)`,
      count: result.count,
    };
  }

  /**
   * Récupérer les statistiques d'activité
   */
  async getStats() {
    // Total d'activités
    const total = await this.prisma.activity.count();

    // Par statut
    const byStatus = await this.prisma.activity.groupBy({
      by: ['status'],
      _count: true,
    });

    // Par action (top 10)
    const byAction = await this.prisma.activity.groupBy({
      by: ['action'],
      _count: true,
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
      take: 10,
    });

    // Par utilisateur (top 10)
    const byUser = await this.prisma.activity.groupBy({
      by: ['userId'],
      _count: true,
      where: {
        userId: { not: null },
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    });

    // Activités des dernières 24h
    const last24h = await this.prisma.activity.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      total,
      last24h,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      byAction: byAction.map((a) => ({
        action: a.action,
        count: a._count,
      })),
      byUser: byUser.map((u) => ({
        userId: u.userId,
        count: u._count,
      })),
    };
  }

  /**
   * Méthode utilitaire pour logger une activité depuis d'autres services
   */
  async log(
    action: string,
    userId?: string,
    options?: {
      resource?: string;
      resourceId?: string;
      projectId?: string;
      taskId?: string;
      status?: 'success' | 'error';
      error?: string;
      duration?: number;
      metadata?: any;
    },
  ) {
    return this.create({
      userId,
      action,
      resource: options?.resource,
      resourceId: options?.resourceId,
      projectId: options?.projectId,
      taskId: options?.taskId,
      status: options?.status || 'success',
      error: options?.error,
      duration: options?.duration,
      metadata: options?.metadata,
    });
  }
}
