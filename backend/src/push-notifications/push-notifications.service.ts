import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendPushDto } from './dto/send-push.dto';
import { DeviceType } from '@prisma/client';

/**
 * Service de gestion des notifications push
 *
 * Fonctionnalités:
 * - Enregistrement/désins inscription tokens FCM
 * - Gestion tokens par utilisateur et appareil
 * - API pour envoi push (Firebase Cloud Messaging)
 *
 * Note: L'envoi réel des notifications push nécessite
 * Firebase Admin SDK côté serveur (non implémenté ici).
 * Ce service fournit l'infrastructure pour stocker et gérer les tokens.
 */
@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Enregistrer un nouveau token push pour un utilisateur
   */
  async registerToken(userId: string, dto: RegisterTokenDto) {
    const { token, deviceType = DeviceType.WEB, userAgent } = dto;

    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier si le token existe déjà
    const existingToken = await this.prisma.pushToken.findUnique({
      where: {
        userId_token: {
          userId,
          token,
        },
      },
    });

    if (existingToken) {
      // Mettre à jour lastUsedAt et is_active si existant
      const updated = await this.prisma.pushToken.update({
        where: { id: existingToken.id },
        data: {
          isActive: true,
          lastUsedAt: new Date(),
          userAgent: userAgent || existingToken.userAgent,
        },
      });

      this.logger.log(`Push token updated for user ${userId}`);
      return updated;
    }

    // Créer nouveau token
    const pushToken = await this.prisma.pushToken.create({
      data: {
        userId,
        token,
        deviceType,
        userAgent,
      },
    });

    this.logger.log(`Push token registered for user ${userId}`);
    return pushToken;
  }

  /**
   * Désinscrire un token push
   */
  async unregisterToken(userId: string, token: string) {
    const pushToken = await this.prisma.pushToken.findUnique({
      where: {
        userId_token: {
          userId,
          token,
        },
      },
    });

    if (!pushToken) {
      throw new NotFoundException('Token non trouvé');
    }

    // Marquer comme inactif plutôt que supprimer (pour l'historique)
    await this.prisma.pushToken.update({
      where: { id: pushToken.id },
      data: {
        isActive: false,
      },
    });

    this.logger.log(`Push token unregistered for user ${userId}`);
    return { message: 'Token désactivé avec succès' };
  }

  /**
   * Obtenir tous les tokens actifs d'un utilisateur
   */
  async getUserTokens(userId: string) {
    const tokens = await this.prisma.pushToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });

    return tokens;
  }

  /**
   * Obtenir un token spécifique
   */
  async getToken(userId: string, token: string) {
    const pushToken = await this.prisma.pushToken.findUnique({
      where: {
        userId_token: {
          userId,
          token,
        },
      },
    });

    if (!pushToken) {
      throw new NotFoundException('Token non trouvé');
    }

    return pushToken;
  }

  /**
   * Nettoyer les tokens inactifs anciens (>30 jours)
   */
  async cleanupInactiveTokens() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.pushToken.deleteMany({
      where: {
        isActive: false,
        lastUsedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} inactive push tokens`);
    return { deleted: result.count };
  }

  /**
   * Envoyer une notification push à un utilisateur
   *
   * Note: Cette méthode stocke la demande d'envoi.
   * L'envoi réel nécessite Firebase Admin SDK configuré côté serveur.
   * Pour une implémentation complète, vous devez:
   * 1. Installer firebase-admin
   * 2. Configurer les credentials Firebase
   * 3. Utiliser admin.messaging().sendMulticast() ou sendToDevice()
   *
   * Exemple avec Firebase Admin SDK (non inclus):
   * ```
   * import * as admin from 'firebase-admin';
   *
   * const message = {
   *   notification: {
   *     title: dto.title,
   *     body: dto.body,
   *   },
   *   tokens: tokens.map(t => t.token),
   * };
   *
   * await admin.messaging().sendMulticast(message);
   * ```
   */
  async sendPush(dto: SendPushDto) {
    const { userId, title, body, icon, actionUrl, data, requireInteraction, silent, actions } = dto;

    // Récupérer les tokens actifs de l'utilisateur
    const tokens = await this.getUserTokens(userId);

    if (tokens.length === 0) {
      throw new BadRequestException('Aucun token push actif pour cet utilisateur');
    }

    // Construire le payload
    const payload = {
      notification: {
        title,
        body,
        icon: icon || '/icons/icon-192x192.png',
      },
      data: {
        actionUrl: actionUrl || '',
        ...data,
      },
    };

    // Log de la demande d'envoi
    this.logger.log(`Push notification request for user ${userId}: ${title}`);
    this.logger.debug(`Payload: ${JSON.stringify(payload)}`);
    this.logger.debug(`Target tokens: ${tokens.length}`);

    // TODO: Intégrer Firebase Admin SDK pour envoi réel
    // Pour l'instant, on retourne juste les informations
    return {
      message: 'Push notification request logged (Firebase Admin SDK not configured)',
      userId,
      tokensCount: tokens.length,
      payload,
      note: 'To enable real push notifications, configure Firebase Admin SDK in the backend',
    };
  }

  /**
   * Obtenir des statistiques sur les tokens push
   */
  async getStats() {
    const total = await this.prisma.pushToken.count();
    const active = await this.prisma.pushToken.count({
      where: { isActive: true },
    });

    const byDevice = await this.prisma.pushToken.groupBy({
      by: ['deviceType'],
      where: { isActive: true },
      _count: true,
    });

    const recentTokens = await this.prisma.pushToken.count({
      where: {
        isActive: true,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 derniers jours
        },
      },
    });

    return {
      total,
      active,
      inactive: total - active,
      byDevice: byDevice.map(d => ({
        deviceType: d.deviceType,
        count: d._count,
      })),
      recentRegistrations: recentTokens,
    };
  }
}
