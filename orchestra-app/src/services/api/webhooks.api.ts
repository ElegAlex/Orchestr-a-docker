import api from './client';
import { WebhookEvent } from '@prisma/client';

// Types
export interface Webhook {
  id: string;
  name: string;
  description?: string;
  url: string;
  secret?: string;
  events: WebhookEvent[];
  headers?: Record<string, string>;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  isActive: boolean;
  createdBy: string;
  lastTriggeredAt?: string;
  triggerCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
  logs?: WebhookLog[];
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: Record<string, any>;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING';
  statusCode?: number;
  response?: Record<string, any>;
  error?: string;
  retryCount: number;
  nextRetryAt?: string;
  createdAt: string;
  executedAt?: string;
}

export interface WebhookStats {
  webhookId: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number;
  triggerCount: number;
  failureCount: number;
  lastTriggeredAt?: string;
}

export interface CreateWebhookRequest {
  name: string;
  description?: string;
  url: string;
  secret?: string;
  events: WebhookEvent[];
  headers?: Record<string, string>;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  isActive?: boolean;
}

export interface UpdateWebhookRequest {
  name?: string;
  description?: string;
  url?: string;
  secret?: string;
  events?: WebhookEvent[];
  headers?: Record<string, string>;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  isActive?: boolean;
}

export interface TriggerWebhookRequest {
  event: WebhookEvent;
  payload: Record<string, any>;
}

/**
 * Webhooks API Client
 * Gestion des webhooks pour intégrations externes
 */
class WebhooksAPI {
  /**
   * Créer un nouveau webhook
   */
  async create(data: CreateWebhookRequest): Promise<Webhook> {
    const response = await api.post('/webhooks', data);
    return response.data;
  }

  /**
   * Récupérer tous les webhooks de l'utilisateur
   */
  async findAll(): Promise<Webhook[]> {
    const response = await api.get('/webhooks');
    return response.data;
  }

  /**
   * Récupérer un webhook par ID (avec logs)
   */
  async findOne(id: string): Promise<Webhook> {
    const response = await api.get(`/webhooks/${id}`);
    return response.data;
  }

  /**
   * Mettre à jour un webhook
   */
  async update(id: string, data: UpdateWebhookRequest): Promise<Webhook> {
    const response = await api.put(`/webhooks/${id}`, data);
    return response.data;
  }

  /**
   * Supprimer un webhook
   */
  async remove(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/webhooks/${id}`);
    return response.data;
  }

  /**
   * Récupérer les logs d'un webhook
   */
  async getLogs(id: string, limit = 50): Promise<WebhookLog[]> {
    const response = await api.get(`/webhooks/${id}/logs`, {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Récupérer les statistiques d'un webhook
   */
  async getStats(id: string): Promise<WebhookStats> {
    const response = await api.get(`/webhooks/${id}/stats`);
    return response.data;
  }

  /**
   * Déclencher manuellement un webhook
   */
  async trigger(id: string, data: TriggerWebhookRequest): Promise<{ message: string; logId: string }> {
    const response = await api.post(`/webhooks/${id}/trigger`, data);
    return response.data;
  }

  /**
   * Tester un webhook avec un payload d'exemple
   */
  async test(id: string): Promise<{ message: string; logId: string }> {
    const response = await api.post(`/webhooks/${id}/test`);
    return response.data;
  }
}

export const webhooksAPI = new WebhooksAPI();
