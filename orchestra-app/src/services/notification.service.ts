import {
  notificationsAPI,
  Notification,
  NotificationType,
  CreateNotificationRequest,
  FilterNotificationRequest,
} from './api/notifications.api';

/**
 * Notification Service
 * Service métier pour la gestion des notifications utilisateur
 * Migration: Firebase Firestore → REST API
 */
class NotificationService {
  /**
   * Créer une notification (ADMIN uniquement)
   */
  async createNotification(data: CreateNotificationRequest): Promise<Notification> {
    return await notificationsAPI.create(data);
  }

  /**
   * Récupérer les notifications de l'utilisateur connecté
   */
  async getUserNotifications(
    unreadOnly: boolean = false,
    limit: number = 50,
  ): Promise<Notification[]> {
    const filters: FilterNotificationRequest = {
      limit,
    };

    if (unreadOnly) {
      filters.isRead = false;
    }

    return await notificationsAPI.findAll(filters);
  }

  /**
   * Récupérer toutes les notifications avec filtres personnalisés
   */
  async getNotifications(filters?: FilterNotificationRequest): Promise<Notification[]> {
    return await notificationsAPI.findAll(filters);
  }

  /**
   * Compter les notifications non lues
   */
  async getUnreadCount(): Promise<number> {
    const result = await notificationsAPI.getUnreadCount();
    return result.count;
  }

  /**
   * Récupérer une notification par ID
   */
  async getNotification(id: string): Promise<Notification> {
    return await notificationsAPI.findOne(id);
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(id: string): Promise<void> {
    await notificationsAPI.markAsRead(id);
  }

  /**
   * Marquer une notification comme non lue
   */
  async markAsUnread(id: string): Promise<void> {
    await notificationsAPI.markAsUnread(id);
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(): Promise<number> {
    const result = await notificationsAPI.markAllAsRead();
    return result.count;
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(id: string): Promise<void> {
    await notificationsAPI.remove(id);
  }

  /**
   * Supprimer toutes les notifications lues
   */
  async deleteAllRead(): Promise<number> {
    const result = await notificationsAPI.removeAllRead();
    return result.count;
  }

  /**
   * Formater le type de notification pour l'UI
   */
  formatNotificationType(type: NotificationType): { label: string; icon: string; color: string } {
    const formats: Record<NotificationType, { label: string; icon: string; color: string }> = {
      TASK_ASSIGNED: {
        label: 'Tâche assignée',
        icon: '📋',
        color: 'blue',
      },
      TASK_COMPLETED: {
        label: 'Tâche terminée',
        icon: '✅',
        color: 'green',
      },
      PROJECT_UPDATED: {
        label: 'Projet mis à jour',
        icon: '📁',
        color: 'purple',
      },
      LEAVE_APPROVED: {
        label: 'Congé approuvé',
        icon: '✔️',
        color: 'green',
      },
      LEAVE_REJECTED: {
        label: 'Congé refusé',
        icon: '❌',
        color: 'red',
      },
      COMMENT_ADDED: {
        label: 'Nouveau commentaire',
        icon: '💬',
        color: 'gray',
      },
      DEADLINE_APPROACHING: {
        label: 'Échéance proche',
        icon: '⏰',
        color: 'orange',
      },
      SYSTEM: {
        label: 'Notification système',
        icon: '🔔',
        color: 'gray',
      },
    };

    return formats[type] || {
      label: type,
      icon: '🔔',
      color: 'gray',
    };
  }

  /**
   * Formater le temps écoulé pour l'UI
   */
  formatTimeAgo(date: string | Date): string {
    const now = new Date();
    const notificationDate = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'À l\'instant';
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return notificationDate.toLocaleDateString('fr-FR');
    }
  }

  /**
   * Grouper les notifications par date
   */
  groupNotificationsByDate(notifications: Notification[]): Record<string, Notification[]> {
    const groups: Record<string, Notification[]> = {
      "Aujourd'hui": [],
      'Hier': [],
      'Cette semaine': [],
      'Plus ancien': [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    notifications.forEach((notification) => {
      const notifDate = new Date(notification.createdAt);
      const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

      if (notifDay.getTime() === today.getTime()) {
        groups["Aujourd'hui"].push(notification);
      } else if (notifDay.getTime() === yesterday.getTime()) {
        groups['Hier'].push(notification);
      } else if (notifDay.getTime() >= weekAgo.getTime()) {
        groups['Cette semaine'].push(notification);
      } else {
        groups['Plus ancien'].push(notification);
      }
    });

    // Supprimer les groupes vides
    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }

  /**
   * Vérifier si une notification est récente (moins de 5 min)
   */
  isRecent(notification: Notification): boolean {
    const now = new Date();
    const notificationDate = new Date(notification.createdAt);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins < 5;
  }
}

export const notificationService = new NotificationService();
export type { Notification, NotificationType, CreateNotificationRequest, FilterNotificationRequest };
