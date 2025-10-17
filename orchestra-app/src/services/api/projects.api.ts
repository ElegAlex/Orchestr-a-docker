import { apiClient, PaginatedResponse } from './client';
import { Project, ProjectStatus, Priority } from '../../types';

/**
 * DTO pour créer un projet
 */
export interface CreateProjectDto {
  name: string;
  description?: string;
  managerId: string;
  status?: ProjectStatus;
  priority?: Priority;
  startDate: string; // ISO 8601 date string
  dueDate: string; // ISO 8601 date string
  budget?: number;
  tags?: string[];
}

/**
 * DTO pour mettre à jour un projet
 */
export interface UpdateProjectDto {
  name?: string;
  description?: string;
  managerId?: string;
  status?: ProjectStatus;
  priority?: Priority;
  startDate?: string;
  dueDate?: string;
  actualDueDate?: string;
  budget?: number;
  tags?: string[];
}

/**
 * Paramètres de requête pour filtrer les projets
 */
export interface ProjectsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
  priority?: Priority;
  managerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Membre d'équipe projet
 */
export interface ProjectMember {
  userId: string;
  role: 'owner' | 'manager' | 'member';
  joinedAt: Date;
}

/**
 * DTO pour ajouter un membre
 */
export interface AddMemberDto {
  userId: string;
  role: 'owner' | 'manager' | 'member';
}

/**
 * Statistiques projet
 */
export interface ProjectStats {
  project: Project;
  tasksByStatus: {
    TODO: number;
    IN_PROGRESS: number;
    REVIEW: number;
    DONE: number;
  };
  tasksByPriority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
  counts: {
    totalTasks: number;
    completedTasks: number;
    teamMembers: number;
  };
  progress: number;
}

/**
 * Service API pour la gestion des projets
 *
 * Routes backend correspondantes:
 * - GET /projects
 * - GET /projects/:id
 * - GET /projects/:id/stats
 * - POST /projects
 * - PATCH /projects/:id
 * - DELETE /projects/:id
 * - GET /projects/:id/members
 * - POST /projects/:id/members
 * - DELETE /projects/:id/members/:userId
 */
export class ProjectsAPI {
  /**
   * Récupérer la liste des projets (paginée)
   */
  async getProjects(params?: ProjectsQueryParams): Promise<PaginatedResponse<Project>> {
    try {
      return await apiClient.get<PaginatedResponse<Project>>('/projects', { params });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer un projet par son ID
   */
  async getProject(id: string): Promise<Project> {
    try {
      return await apiClient.get<Project>(`/projects/${id}`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les statistiques d'un projet
   */
  async getProjectStats(id: string): Promise<ProjectStats> {
    try {
      return await apiClient.get<ProjectStats>(`/projects/${id}/stats`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Créer un nouveau projet
   */
  async createProject(data: CreateProjectDto): Promise<Project> {
    try {
      return await apiClient.post<Project>('/projects', data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Mettre à jour un projet
   */
  async updateProject(id: string, data: UpdateProjectDto): Promise<Project> {
    try {
      return await apiClient.patch<Project>(`/projects/${id}`, data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Supprimer un projet
   */
  async deleteProject(id: string): Promise<void> {
    try {
      await apiClient.delete(`/projects/${id}`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les membres d'un projet
   */
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    try {
      return await apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Ajouter un membre à un projet
   */
  async addMember(projectId: string, data: AddMemberDto): Promise<ProjectMember> {
    try {
      return await apiClient.post<ProjectMember>(`/projects/${projectId}/members`, data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Retirer un membre d'un projet
   */
  async removeMember(projectId: string, userId: string): Promise<void> {
    try {
      await apiClient.delete(`/projects/${projectId}/members/${userId}`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Rechercher des projets par nom
   */
  async searchProjects(query: string, limit = 10): Promise<Project[]> {
    try {
      const response = await this.getProjects({
        search: query,
        limit,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les projets d'un manager
   */
  async getProjectsByManager(managerId: string): Promise<Project[]> {
    try {
      const response = await this.getProjects({
        managerId,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les projets par statut
   */
  async getProjectsByStatus(status: ProjectStatus): Promise<Project[]> {
    try {
      const response = await this.getProjects({
        status,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les projets actifs (ACTIVE, IN_PROGRESS)
   */
  async getActiveProjects(): Promise<Project[]> {
    try {
      // Note: Le backend ne supporte pas encore de filtre multiple sur status
      // On devra filtrer côté client ou créer une route dédiée
      const response = await this.getProjects({
        status: 'ACTIVE' as ProjectStatus,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Gérer les erreurs de manière standardisée
   */
  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || error.response.statusText;
      const statusCode = error.response.status;

      switch (statusCode) {
        case 400:
          return new Error(`Données invalides: ${message}`);
        case 401:
          return new Error('Non authentifié');
        case 403:
          return new Error('Accès refusé: permissions insuffisantes');
        case 404:
          return new Error('Projet non trouvé');
        case 409:
          return new Error('Conflit: ' + message);
        default:
          return new Error(message || 'Une erreur est survenue');
      }
    }
    return new Error('Erreur réseau. Vérifiez votre connexion.');
  }
}

/**
 * Instance globale de l'API Projects
 */
export const projectsAPI = new ProjectsAPI();
