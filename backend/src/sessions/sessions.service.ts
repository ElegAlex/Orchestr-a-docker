import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crée une nouvelle session utilisateur (audit logging)
   */
  async create(createSessionDto: CreateSessionDto) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: createSessionDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createSessionDto.userId} not found`,
      );
    }

    // Calculer lastActivityAt (maintenant)
    const now = new Date();

    return this.prisma.session.create({
      data: {
        userId: createSessionDto.userId,
        userAgent: createSessionDto.userAgent,
        ipAddress: createSessionDto.ipAddress,
        deviceInfo: createSessionDto.deviceInfo || {},
        lastActivityAt: now,
        expiresAt: new Date(createSessionDto.expiresAt),
        isActive: true,
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
  }

  /**
   * Récupère toutes les sessions (avec filtres optionnels)
   */
  async findAll(userId?: string, isActive?: boolean) {
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.session.findMany({
      where,
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
      orderBy: {
        lastActivityAt: 'desc',
      },
    });
  }

  /**
   * Récupère une session par ID
   */
  async findOne(id: string) {
    const session = await this.prisma.session.findUnique({
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

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return session;
  }

  /**
   * Récupère les sessions actives d'un utilisateur
   */
  async findActiveByUser(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        lastActivityAt: 'desc',
      },
    });
  }

  /**
   * Met à jour une session (lastActivityAt, isActive)
   */
  async update(id: string, updateSessionDto: UpdateSessionDto) {
    // Vérifier que la session existe
    await this.findOne(id);

    return this.prisma.session.update({
      where: { id },
      data: {
        ...(updateSessionDto.lastActivityAt && {
          lastActivityAt: new Date(updateSessionDto.lastActivityAt),
        }),
        ...(updateSessionDto.isActive !== undefined && {
          isActive: updateSessionDto.isActive,
        }),
        ...(updateSessionDto.expiresAt && {
          expiresAt: new Date(updateSessionDto.expiresAt),
        }),
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
  }

  /**
   * Met à jour l'activité d'une session
   */
  async updateActivity(id: string) {
    return this.update(id, {
      lastActivityAt: new Date().toISOString(),
    });
  }

  /**
   * Invalide une session (soft delete)
   */
  async invalidate(id: string) {
    return this.update(id, {
      isActive: false,
    });
  }

  /**
   * Invalide toutes les sessions d'un utilisateur
   */
  async invalidateAllUserSessions(userId: string) {
    return this.prisma.session.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Supprime les sessions expirées (nettoyage)
   */
  async cleanupExpiredSessions() {
    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return {
      deletedCount: result.count,
    };
  }

  /**
   * Récupère les statistiques des sessions
   */
  async getStats() {
    const now = new Date();

    const [
      totalSessions,
      activeSessions,
      expiredSessions,
      totalUsers,
      usersWithActiveSessions,
    ] = await Promise.all([
      this.prisma.session.count(),
      this.prisma.session.count({
        where: {
          isActive: true,
          expiresAt: { gte: now },
        },
      }),
      this.prisma.session.count({
        where: {
          expiresAt: { lt: now },
        },
      }),
      this.prisma.user.count(),
      this.prisma.session.findMany({
        where: {
          isActive: true,
          expiresAt: { gte: now },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);

    return {
      totalSessions,
      activeSessions,
      expiredSessions,
      inactiveSessions: totalSessions - activeSessions - expiredSessions,
      totalUsers,
      usersWithActiveSessions: usersWithActiveSessions.length,
      usersWithoutActiveSessions:
        totalUsers - usersWithActiveSessions.length,
    };
  }
}
