import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { TriggerWebhookDto } from './dto/trigger-webhook.dto';
import { WebhookEvent, WebhookStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Créer un nouveau webhook
   */
  async create(userId: string, createWebhookDto: CreateWebhookDto) {
    return this.prisma.webhook.create({
      data: {
        ...createWebhookDto,
        createdBy: userId,
      },
    });
  }

  /**
   * Récupérer tous les webhooks de l'utilisateur
   */
  async findAll(userId: string) {
    return this.prisma.webhook.findMany({
      where: {
        createdBy: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Récupérer un webhook par ID
   */
  async findOne(id: string, userId: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: {
        id,
        createdBy: userId,
      },
      include: {
        logs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20, // Derniers 20 logs
        },
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook non trouvé');
    }

    return webhook;
  }

  /**
   * Mettre à jour un webhook
   */
  async update(id: string, userId: string, updateWebhookDto: UpdateWebhookDto) {
    // Vérifier que le webhook existe et appartient à l'utilisateur
    await this.findOne(id, userId);

    return this.prisma.webhook.update({
      where: { id },
      data: {
        ...updateWebhookDto,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Supprimer un webhook
   */
  async remove(id: string, userId: string) {
    // Vérifier que le webhook existe et appartient à l'utilisateur
    await this.findOne(id, userId);

    await this.prisma.webhook.delete({
      where: { id },
    });

    return { message: 'Webhook supprimé avec succès' };
  }

  /**
   * Récupérer les logs d'un webhook
   */
  async getLogs(id: string, userId: string, limit = 50) {
    // Vérifier que le webhook existe et appartient à l'utilisateur
    await this.findOne(id, userId);

    return this.prisma.webhookLog.findMany({
      where: {
        webhookId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Déclencher manuellement un webhook (pour tests)
   */
  async trigger(id: string, userId: string, triggerDto: TriggerWebhookDto) {
    const webhook = await this.findOne(id, userId);

    if (!webhook.isActive) {
      throw new Error('Le webhook est désactivé');
    }

    // Créer un log
    const log = await this.prisma.webhookLog.create({
      data: {
        webhookId: id,
        event: triggerDto.event,
        payload: triggerDto.payload,
        status: WebhookStatus.PENDING,
      },
    });

    // Exécuter le webhook en arrière-plan
    this.executeWebhook(webhook, log.id, triggerDto.event, triggerDto.payload).catch((error) => {
      this.logger.error(`Failed to execute webhook ${id}: ${error.message}`);
    });

    return { message: 'Webhook déclenché', logId: log.id };
  }

  /**
   * Déclencher tous les webhooks pour un événement donné
   */
  async triggerEvent(event: WebhookEvent, payload: Record<string, any>) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        isActive: true,
        events: {
          has: event,
        },
      },
    });

    this.logger.log(`Triggering ${webhooks.length} webhooks for event ${event}`);

    for (const webhook of webhooks) {
      const log = await this.prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event,
          payload,
          status: WebhookStatus.PENDING,
        },
      });

      // Exécuter le webhook en arrière-plan
      this.executeWebhook(webhook, log.id, event, payload).catch((error) => {
        this.logger.error(`Failed to execute webhook ${webhook.id}: ${error.message}`);
      });
    }
  }

  /**
   * Exécuter un webhook avec retry logic
   */
  private async executeWebhook(
    webhook: any,
    logId: string,
    event: WebhookEvent,
    payload: Record<string, any>,
    retryCount = 0,
  ) {
    const retryConfig = webhook.retryConfig || {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
    };

    try {
      // Préparer les headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
        'X-Webhook-ID': webhook.id,
        'X-Webhook-Signature': this.generateSignature(webhook.secret, payload),
        ...(webhook.headers || {}),
      };

      // Faire la requête HTTP
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let responseJson: any;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { body: responseText };
      }

      if (response.ok) {
        // Succès
        await this.prisma.webhookLog.update({
          where: { id: logId },
          data: {
            status: WebhookStatus.SUCCESS,
            statusCode: response.status,
            response: responseJson,
            executedAt: new Date(),
            retryCount,
          },
        });

        await this.prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastTriggeredAt: new Date(),
            triggerCount: { increment: 1 },
          },
        });

        this.logger.log(`Webhook ${webhook.id} executed successfully`);
      } else {
        // Échec, tentative de retry
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
    } catch (error) {
      this.logger.error(`Webhook ${webhook.id} execution failed (attempt ${retryCount + 1}): ${error.message}`);

      if (retryCount < retryConfig.maxRetries) {
        // Calculer le délai avec backoff exponentiel
        const delay = retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, retryCount);
        const nextRetryAt = new Date(Date.now() + delay);

        await this.prisma.webhookLog.update({
          where: { id: logId },
          data: {
            status: WebhookStatus.RETRYING,
            error: error.message,
            retryCount: retryCount + 1,
            nextRetryAt,
          },
        });

        // Programmer le retry
        setTimeout(() => {
          this.executeWebhook(webhook, logId, event, payload, retryCount + 1).catch((err) => {
            this.logger.error(`Retry failed: ${err.message}`);
          });
        }, delay);
      } else {
        // Échec définitif après tous les retries
        await this.prisma.webhookLog.update({
          where: { id: logId },
          data: {
            status: WebhookStatus.FAILED,
            error: error.message,
            executedAt: new Date(),
            retryCount,
          },
        });

        await this.prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            failureCount: { increment: 1 },
          },
        });

        this.logger.error(`Webhook ${webhook.id} failed after ${retryCount + 1} attempts`);
      }
    }
  }

  /**
   * Générer une signature HMAC pour sécuriser le webhook
   */
  private generateSignature(secret: string | null, payload: any): string {
    if (!secret) {
      return '';
    }

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Obtenir les statistiques d'un webhook
   */
  async getStats(id: string, userId: string) {
    const webhook = await this.findOne(id, userId);

    const totalLogs = await this.prisma.webhookLog.count({
      where: { webhookId: id },
    });

    const successLogs = await this.prisma.webhookLog.count({
      where: {
        webhookId: id,
        status: WebhookStatus.SUCCESS,
      },
    });

    const failedLogs = await this.prisma.webhookLog.count({
      where: {
        webhookId: id,
        status: WebhookStatus.FAILED,
      },
    });

    const successRate = totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 0;

    return {
      webhookId: id,
      totalCalls: totalLogs,
      successfulCalls: successLogs,
      failedCalls: failedLogs,
      successRate,
      triggerCount: webhook.triggerCount,
      failureCount: webhook.failureCount,
      lastTriggeredAt: webhook.lastTriggeredAt,
    };
  }
}
