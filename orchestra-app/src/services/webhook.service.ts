import {
  webhooksAPI,
  Webhook,
  WebhookLog,
  WebhookStats,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  TriggerWebhookRequest,
} from './api/webhooks.api';

/**
 * Webhook Service
 * Service métier pour la gestion des webhooks et intégrations externes
 * Migration: Firebase Firestore → REST API
 */
class WebhookService {
  /**
   * Créer un nouveau webhook
   */
  async createWebhook(data: CreateWebhookRequest): Promise<Webhook> {
    return await webhooksAPI.create(data);
  }

  /**
   * Récupérer tous les webhooks de l'utilisateur
   */
  async getWebhooks(): Promise<Webhook[]> {
    return await webhooksAPI.findAll();
  }

  /**
   * Récupérer un webhook par ID
   */
  async getWebhook(id: string): Promise<Webhook> {
    return await webhooksAPI.findOne(id);
  }

  /**
   * Mettre à jour un webhook
   */
  async updateWebhook(id: string, data: UpdateWebhookRequest): Promise<Webhook> {
    return await webhooksAPI.update(id, data);
  }

  /**
   * Supprimer un webhook
   */
  async deleteWebhook(id: string): Promise<void> {
    await webhooksAPI.remove(id);
  }

  /**
   * Activer/désactiver un webhook
   */
  async toggleWebhook(id: string, isActive: boolean): Promise<Webhook> {
    return await webhooksAPI.update(id, { isActive });
  }

  /**
   * Récupérer les logs d'exécution d'un webhook
   */
  async getWebhookLogs(id: string, limit = 50): Promise<WebhookLog[]> {
    return await webhooksAPI.getLogs(id, limit);
  }

  /**
   * Récupérer les statistiques d'un webhook
   */
  async getWebhookStats(id: string): Promise<WebhookStats> {
    return await webhooksAPI.getStats(id);
  }

  /**
   * Déclencher manuellement un webhook (pour tests)
   */
  async triggerWebhook(id: string, data: TriggerWebhookRequest): Promise<{ message: string; logId: string }> {
    return await webhooksAPI.trigger(id, data);
  }

  /**
   * Tester un webhook avec un payload d'exemple
   */
  async testWebhook(id: string): Promise<{ message: string; logId: string }> {
    return await webhooksAPI.test(id);
  }

  /**
   * Valider une URL de webhook
   */
  validateWebhookUrl(url: string): { isValid: boolean; error?: string } {
    try {
      const parsedUrl = new URL(url);

      // Vérifier le protocole (HTTPS requis en production)
      if (parsedUrl.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
        return {
          isValid: false,
          error: 'HTTPS est requis pour les webhooks en production',
        };
      }

      // Vérifier que ce n'est pas localhost en production
      if (process.env.NODE_ENV === 'production' &&
          (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1')) {
        return {
          isValid: false,
          error: 'Les URLs localhost ne sont pas autorisées en production',
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: 'URL invalide',
      };
    }
  }

  /**
   * Formater les événements disponibles pour l'UI
   */
  getAvailableEvents(): Array<{ value: string; label: string; category: string }> {
    return [
      { value: 'PROJECT_CREATED', label: 'Projet créé', category: 'Projets' },
      { value: 'PROJECT_UPDATED', label: 'Projet mis à jour', category: 'Projets' },
      { value: 'PROJECT_DELETED', label: 'Projet supprimé', category: 'Projets' },
      { value: 'TASK_CREATED', label: 'Tâche créée', category: 'Tâches' },
      { value: 'TASK_UPDATED', label: 'Tâche mise à jour', category: 'Tâches' },
      { value: 'TASK_DELETED', label: 'Tâche supprimée', category: 'Tâches' },
      { value: 'TASK_ASSIGNED', label: 'Tâche assignée', category: 'Tâches' },
      { value: 'TASK_COMPLETED', label: 'Tâche terminée', category: 'Tâches' },
      { value: 'TASK_STATUS_CHANGED', label: 'Statut tâche changé', category: 'Tâches' },
      { value: 'COMMENT_CREATED', label: 'Commentaire ajouté', category: 'Commentaires' },
      { value: 'DOCUMENT_UPLOADED', label: 'Document uploadé', category: 'Documents' },
      { value: 'DOCUMENT_DELETED', label: 'Document supprimé', category: 'Documents' },
      { value: 'USER_CREATED', label: 'Utilisateur créé', category: 'Utilisateurs' },
      { value: 'USER_UPDATED', label: 'Utilisateur mis à jour', category: 'Utilisateurs' },
      { value: 'TEAM_MEMBER_ADDED', label: 'Membre ajouté à l\'équipe', category: 'Équipe' },
      { value: 'TEAM_MEMBER_REMOVED', label: 'Membre retiré de l\'équipe', category: 'Équipe' },
      { value: 'LEAVE_REQUESTED', label: 'Congé demandé', category: 'Congés' },
      { value: 'LEAVE_APPROVED', label: 'Congé approuvé', category: 'Congés' },
      { value: 'LEAVE_REJECTED', label: 'Congé refusé', category: 'Congés' },
    ];
  }

  /**
   * Formater un statut de webhook pour l'UI
   */
  formatStatus(status: string): { label: string; color: string } {
    switch (status) {
      case 'PENDING':
        return { label: 'En attente', color: 'gray' };
      case 'SUCCESS':
        return { label: 'Succès', color: 'green' };
      case 'FAILED':
        return { label: 'Échec', color: 'red' };
      case 'RETRYING':
        return { label: 'Nouvelle tentative', color: 'orange' };
      default:
        return { label: status, color: 'gray' };
    }
  }

  /**
   * Exemple de payload pour documentation/tests
   */
  getExamplePayload(event: string): Record<string, any> {
    const examples: Record<string, any> = {
      PROJECT_CREATED: {
        projectId: 'proj-123',
        projectName: 'Nouveau Projet',
        createdBy: 'user-456',
        createdAt: new Date().toISOString(),
      },
      TASK_COMPLETED: {
        taskId: 'task-789',
        taskTitle: 'Implémenter feature X',
        projectId: 'proj-123',
        completedBy: 'user-456',
        completedAt: new Date().toISOString(),
      },
      USER_CREATED: {
        userId: 'user-new',
        email: 'nouvel.utilisateur@example.com',
        firstName: 'Nouvel',
        lastName: 'Utilisateur',
        role: 'CONTRIBUTOR',
        createdAt: new Date().toISOString(),
      },
    };

    return examples[event] || {
      event,
      timestamp: new Date().toISOString(),
      data: {},
    };
  }
}

export const webhookService = new WebhookService();
export type { Webhook, WebhookLog, WebhookStats, CreateWebhookRequest, UpdateWebhookRequest, TriggerWebhookRequest };
