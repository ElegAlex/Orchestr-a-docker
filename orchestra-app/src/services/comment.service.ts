/**
 * CommentService - Wrapper autour de commentsAPI pour compatibilité avec le code existant
 *
 * Cette classe maintient la même interface que l'ancien service Firebase
 * mais utilise l'API REST backend en interne.
 *
 * Note: Fichier Firebase original sauvegardé dans comment.service.ts.firebase-backup
 */

import { commentsAPI } from './api/comments.api';
import type { TaskComment, CommentReaction } from '../types';

class CommentService {
  /**
   * Récupère tous les commentaires d'une tâche
   */
  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    try {
      const comments = await commentsAPI.getCommentsByTask(taskId);

      // Trier par date de création (ordre chronologique)
      return comments.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
        return dateA.getTime() - dateB.getTime();
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des commentaires:', error);
      return [];
    }
  }

  /**
   * Écouter les commentaires en temps réel
   * Note: Pour l'instant, on utilise du polling simple
   * TODO: Implémenter WebSocket pour le temps réel
   */
  subscribeToTaskComments(
    taskId: string,
    callback: (comments: TaskComment[]) => void
  ): () => void {
    // Charger immédiatement
    this.getTaskComments(taskId).then(callback);

    // Polling toutes les 5 secondes
    const intervalId = setInterval(async () => {
      try {
        const comments = await this.getTaskComments(taskId);
        callback(comments);
      } catch (error) {
        console.error('Erreur lors du polling des commentaires:', error);
      }
    }, 5000);

    // Retourner la fonction de désinscription
    return () => clearInterval(intervalId);
  }

  /**
   * Ajouter un commentaire
   */
  async addComment(comment: Omit<TaskComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskComment> {
    try {
      const commentData = {
        taskId: comment.taskId,
        userId: comment.userId,
        content: comment.content
      };

      return await commentsAPI.createComment(commentData);
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un commentaire
   */
  async updateComment(commentId: string, updates: Partial<TaskComment>): Promise<void> {
    try {
      if (updates.content) {
        await commentsAPI.updateComment(commentId, updates.content);
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du commentaire:', error);
      throw error;
    }
  }

  /**
   * Supprimer un commentaire
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      await commentsAPI.deleteComment(commentId);
    } catch (error: any) {
      console.error('Erreur lors de la suppression du commentaire:', error);
      throw error;
    }
  }

  /**
   * Ajouter une réaction à un commentaire
   * TODO: Implémenter dans l'API backend
   */
  async addReaction(commentId: string, userId: string, emoji: string): Promise<void> {
    console.warn('addReaction not yet implemented in API');
    // TODO: Appeler l'API quand elle sera disponible
    // await commentsAPI.addReaction(commentId, { userId, emoji });
  }

  /**
   * Supprimer une réaction
   * TODO: Implémenter dans l'API backend
   */
  async removeReaction(commentId: string, userId: string, emoji: string): Promise<void> {
    console.warn('removeReaction not yet implemented in API');
    // TODO: Appeler l'API quand elle sera disponible
    // await commentsAPI.removeReaction(commentId, { userId, emoji });
  }

  /**
   * Marquer comme lu
   * TODO: Implémenter dans l'API backend
   */
  async markAsRead(commentId: string, userId: string): Promise<void> {
    console.warn('markAsRead not yet implemented in API');
    // TODO: Appeler l'API quand elle sera disponible
  }

  /**
   * Obtenir le nombre de commentaires non lus
   * TODO: Implémenter dans l'API backend
   */
  async getUnreadCount(taskId: string, userId: string): Promise<number> {
    console.warn('getUnreadCount not yet implemented in API');
    return 0;
  }
}

export const commentService = new CommentService();
export default commentService;
