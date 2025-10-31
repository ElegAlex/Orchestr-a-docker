import api from './client';

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
  };
  task?: {
    id: string;
    title: string;
    status?: string;
    projectId?: string;
  };
}

export interface CreateCommentRequest {
  taskId: string;
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface GetCommentsParams {
  taskId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export const commentsAPI = {
  /**
   * Récupère tous les commentaires avec filtrage optionnel
   */
  async getAll(params?: GetCommentsParams): Promise<Comment[]> {
    const response = await api.get('/comments', { params });
    return response.data || [];
  },

  /**
   * Récupère les commentaires d'une tâche
   */
  async getCommentsByTask(taskId: string): Promise<Comment[]> {
    return this.getAll({ taskId });
  },

  /**
   * Récupère les commentaires d'un utilisateur
   */
  async getCommentsByUser(userId: string): Promise<Comment[]> {
    return this.getAll({ userId });
  },

  /**
   * Récupère un commentaire par ID
   */
  async getById(id: string): Promise<Comment> {
    return await api.get(`/comments/${id}`);
  },

  /**
   * Crée un nouveau commentaire
   */
  async createComment(data: CreateCommentRequest): Promise<Comment> {
    return await api.post('/comments', data);
  },

  /**
   * Met à jour un commentaire
   */
  async updateComment(commentId: string, data: UpdateCommentRequest): Promise<Comment> {
    return await api.patch(`/comments/${commentId}`, data);
  },

  /**
   * Supprime un commentaire
   */
  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/comments/${commentId}`);
  },
};
