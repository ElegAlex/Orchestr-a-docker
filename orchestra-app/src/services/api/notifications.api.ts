import api from './client';

// Types
export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'PROJECT_UPDATED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'COMMENT_ADDED'
  | 'DEADLINE_APPROACHING'
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  resourceType?: string; // 'project', 'task', 'leave', etc.
  resourceId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export interface FilterNotificationRequest {
  userId?: string;
  isRead?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

/**
 * Notifications API Client
 * Gestion des notifications utilisateur
 */
class NotificationsAPI {
  /**
   * Créer une notification (ADMIN uniquement)
   */
  async create(data: CreateNotificationRequest): Promise<Notification> {
    const response = await api.post('/notifications', data);
    return response.data;
  }

  /**
   * Récupérer toutes les notifications avec filtres
   */
  async findAll(filters?: FilterNotificationRequest): Promise<Notification[]> {
    const response = await api.get('/notifications', { params: filters });
    return response.data;
  }

  /**
   * Compter les notifications non lues
   */
  async getUnreadCount(): Promise<{ count: number }> {
    const response = await api.get('/notifications/unread/count');
    return response.data;
  }

  /**
   * Récupérer une notification par ID
   */
  async findOne(id: string): Promise<Notification> {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(id: string): Promise<Notification> {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  }

  /**
   * Marquer une notification comme non lue
   */
  async markAsUnread(id: string): Promise<Notification> {
    const response = await api.patch(`/notifications/${id}/unread`);
    return response.data;
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(): Promise<{ message: string; count: number }> {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  }

  /**
   * Supprimer une notification
   */
  async remove(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  }

  /**
   * Supprimer toutes les notifications lues
   */
  async removeAllRead(): Promise<{ message: string; count: number }> {
    const response = await api.delete('/notifications/read/all');
    return response.data;
  }
}

export const notificationsAPI = new NotificationsAPI();
