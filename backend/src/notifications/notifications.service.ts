import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { FilterNotificationDto } from './dto/filter-notification.dto';
import { Prisma } from '@prisma/client';

/**
 * Service de gestion des notifications
 *
 * Fonctionnalités:
 * - CRUD complet des notifications
 * - Marquage lu/non-lu
 * - Filtrage avancé
 * - Suppression en masse
 */
@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer une nouvelle notification
   */
  async create(createNotificationDto: CreateNotificationDto) {
    const {
      userId,
      type,
      title,
      message,
      resourceType,
      resourceId,
      metadata,
    } = createNotificationDto;

    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Créer la notification
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        resourceType,
        resourceId,
        metadata,
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

    return notification;
  }

  /**
   * Récupérer toutes les notifications avec filtrage et pagination
   * 🔒 Isolation par département : Filtre via l'utilisateur du département
   */
  async findAll(filterDto: FilterNotificationDto) {
    const {
      userId,
      departmentId,
      type,
      isRead,
      resourceType,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    // Construction des filtres
    const where: Prisma.NotificationWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    // 🔒 Filtre par département : notifications d'utilisateurs du département
    if (departmentId) {
      where.user = {
        departmentId: departmentId,
      };
    }

    if (type) {
      where.type = type;
    }

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (resourceType) {
      where.resourceType = resourceType;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Exécution des requêtes
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
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
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupérer une notification par ID
   */
  async findOne(id: string) {
    const notification = await this.prisma.notification.findUnique({
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

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    return notification;
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(id: string, userId: string, userRole: string) {
    const existingNotification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      throw new NotFoundException('Notification non trouvée');
    }

    // Vérifier les permissions (seul le destinataire ou ADMIN)
    if (existingNotification.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Vous n\'êtes pas autorisé à modifier cette notification',
      );
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
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

    return updated;
  }

  /**
   * Marquer une notification comme non lue
   */
  async markAsUnread(id: string, userId: string, userRole: string) {
    const existingNotification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      throw new NotFoundException('Notification non trouvée');
    }

    // Vérifier les permissions (seul le destinataire ou ADMIN)
    if (existingNotification.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Vous n\'êtes pas autorisé à modifier cette notification',
      );
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: false,
        readAt: null,
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

    return updated;
  }

  /**
   * Marquer toutes les notifications d'un utilisateur comme lues
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      message: `${result.count} notification(s) marquée(s) comme lue(s)`,
      count: result.count,
    };
  }

  /**
   * Supprimer une notification
   */
  async remove(id: string, userId: string, userRole: string) {
    const existingNotification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      throw new NotFoundException('Notification non trouvée');
    }

    // Vérifier les permissions (seul le destinataire ou ADMIN)
    if (existingNotification.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Vous n\'êtes pas autorisé à supprimer cette notification',
      );
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    return {
      message: 'Notification supprimée avec succès',
    };
  }

  /**
   * Supprimer toutes les notifications lues d'un utilisateur
   */
  async removeAllRead(userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });

    return {
      message: `${result.count} notification(s) supprimée(s)`,
      count: result.count,
    };
  }

  /**
   * Récupérer le nombre de notifications non lues d'un utilisateur
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return {
      userId,
      unreadCount: count,
    };
  }
}
