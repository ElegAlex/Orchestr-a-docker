import { projectsAPI } from './api';
import type { Project, ProjectStatus, Priority, ProjectCategory } from '../types';

/**
 * ProjectService - Wrapper autour de projectsAPI pour compatibilité avec le code existant
 *
 * Cette classe maintient la même interface que l'ancien service Firebase
 * mais utilise l'API REST backend en interne.
 *
 * Note: Fichier Firebase original sauvegardé dans project.service.ts.firebase-backup
 */

const COLLECTION_NAME = 'projects'; // Conservé pour compatibilité avec les logs

export class ProjectService {
  /**
   * Créer un nouveau projet
   */
  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    try {
      const createDto = {
        name: projectData.name,
        description: projectData.description || '',
        managerId: projectData.managerId,
        status: projectData.status || ('ACTIVE' as ProjectStatus),
        priority: projectData.priority || ('MEDIUM' as Priority),
        startDate: projectData.startDate?.toISOString?.() || new Date(projectData.startDate).toISOString(),
        dueDate: projectData.dueDate?.toISOString?.() || new Date(projectData.dueDate || projectData.deadline).toISOString(),
        budget: projectData.budget,
        tags: projectData.tags || [],
      };

      return await projectsAPI.createProject(createDto);
    } catch (error: any) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  /**
   * Récupérer un projet par son ID
   */
  async getProject(id: string): Promise<Project | null> {
    try {
      return await projectsAPI.getProject(id);
    } catch (error: any) {
      if (error.message?.includes('non trouvé') || error.message?.includes('404')) {
        return null;
      }
      console.error('Error getting project:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un projet
   */
  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    try {
      const updateDto: any = {};

      if (updates.name !== undefined) updateDto.name = updates.name;
      if (updates.description !== undefined) updateDto.description = updates.description;
      if (updates.managerId !== undefined) updateDto.managerId = updates.managerId;
      if (updates.status !== undefined) updateDto.status = updates.status;
      if (updates.priority !== undefined) updateDto.priority = updates.priority;
      if (updates.budget !== undefined) updateDto.budget = updates.budget;
      if (updates.tags !== undefined) updateDto.tags = updates.tags;

      // Gérer les dates
      if (updates.startDate !== undefined) {
        updateDto.startDate = updates.startDate?.toISOString?.() || new Date(updates.startDate).toISOString();
      }
      if (updates.dueDate !== undefined) {
        updateDto.dueDate = updates.dueDate?.toISOString?.() || new Date(updates.dueDate).toISOString();
      } else if (updates.deadline !== undefined) {
        // Support ancien champ deadline
        updateDto.dueDate = updates.deadline?.toISOString?.() || new Date(updates.deadline).toISOString();
      }
      if (updates.actualDueDate !== undefined) {
        updateDto.actualDueDate = updates.actualDueDate?.toISOString?.() || new Date(updates.actualDueDate).toISOString();
      }

      return await projectsAPI.updateProject(id, updateDto);
    } catch (error: any) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  /**
   * Supprimer un projet
   */
  async deleteProject(id: string): Promise<void> {
    try {
      await projectsAPI.deleteProject(id);
    } catch (error: any) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les projets
   */
  async getAllProjects(): Promise<Project[]> {
    try {
      const response = await projectsAPI.getProjects({
        limit: 1000,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting all projects:', error);
      return [];
    }
  }

  /**
   * Récupérer les projets gérés par un utilisateur
   */
  async getProjectsByUser(userId: string): Promise<Project[]> {
    try {
      return await projectsAPI.getProjectsByManager(userId);
    } catch (error: any) {
      console.error('Error getting projects by user:', error);
      return [];
    }
  }

  /**
   * Récupérer les projets où l'utilisateur est membre d'équipe
   */
  async getProjectsByTeamMember(userId: string): Promise<Project[]> {
    try {
      // TODO: Le backend n'a pas encore de route pour filtrer par team member
      // Pour l'instant, récupérer tous les projets et filtrer côté client
      const allProjects = await this.getAllProjects();

      // Filtrer les projets où l'utilisateur est dans teamMembers
      return allProjects.filter((project) =>
        project.teamMembers?.includes(userId)
      );
    } catch (error: any) {
      console.error('Error getting projects by team member:', error);
      return [];
    }
  }

  /**
   * Récupérer les projets par statut
   */
  async getProjectsByStatus(status: ProjectStatus): Promise<Project[]> {
    try {
      return await projectsAPI.getProjectsByStatus(status);
    } catch (error: any) {
      console.error('Error getting projects by status:', error);
      return [];
    }
  }

  /**
   * Récupérer les projets actifs
   */
  async getActiveProjects(): Promise<Project[]> {
    try {
      return await projectsAPI.getActiveProjects();
    } catch (error: any) {
      console.error('Error getting active projects:', error);
      return [];
    }
  }

  /**
   * Récupérer les projets par catégorie
   * NOTE: Le backend n'a pas encore de champ "category"
   */
  async getProjectsByCategory(category: ProjectCategory): Promise<Project[]> {
    console.warn('getProjectsByCategory: Feature not yet fully supported by backend API');
    // TODO: Ajouter le champ category au backend
    return [];
  }

  /**
   * Rechercher des projets
   */
  async searchProjects(
    searchTerm: string,
    filters?: {
      status?: ProjectStatus;
      priority?: Priority;
      managerId?: string;
    }
  ): Promise<Project[]> {
    try {
      return await projectsAPI.searchProjects(searchTerm, 50);
    } catch (error: any) {
      console.error('Error searching projects:', error);
      return [];
    }
  }

  /**
   * Ajouter un membre à l'équipe du projet
   */
  async addTeamMember(
    projectId: string,
    member: {
      userId: string;
      role?: 'owner' | 'manager' | 'member';
    }
  ): Promise<void> {
    try {
      await projectsAPI.addMember(projectId, {
        userId: member.userId,
        role: member.role || 'member',
      });
    } catch (error: any) {
      console.error('Error adding team member:', error);
      throw error;
    }
  }

  /**
   * Retirer un membre de l'équipe du projet
   */
  async removeTeamMember(projectId: string, userId: string): Promise<void> {
    try {
      await projectsAPI.removeMember(projectId, userId);
    } catch (error: any) {
      console.error('Error removing team member:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour la progression du projet
   * NOTE: Calculé automatiquement par le backend
   */
  async updateProjectProgress(projectId: string): Promise<void> {
    console.log('updateProjectProgress: Progress is automatically calculated by backend');
    // Le backend calcule automatiquement la progression basée sur les tâches
    // Pas besoin de faire quoi que ce soit
  }

  /**
   * Dupliquer un projet
   * NOTE: Non supporté par le backend actuellement
   */
  async duplicateProject(projectId: string, newName: string): Promise<Project> {
    console.warn('duplicateProject: Feature not yet supported by backend API');

    // TODO: Implémenter côté backend
    // Pour l'instant, récupérer le projet et le recréer
    const originalProject = await this.getProject(projectId);
    if (!originalProject) {
      throw new Error('Project not found');
    }

    const duplicatedProject = await this.createProject({
      ...originalProject,
      name: newName,
      status: 'PLANNING' as ProjectStatus,
      // Réinitialiser certains champs
      progress: 0,
      teamMembers: [],
    });

    return duplicatedProject;
  }

  /**
   * Archiver un projet
   */
  async archiveProject(projectId: string): Promise<void> {
    try {
      await projectsAPI.updateProject(projectId, {
        status: 'ARCHIVED' as ProjectStatus,
      });
    } catch (error: any) {
      console.error('Error archiving project:', error);
      throw error;
    }
  }

  /**
   * Recalculer la progression de tous les projets
   * NOTE: Le backend calcule automatiquement la progression
   */
  async recalculateAllProjectsProgress(): Promise<void> {
    console.log('recalculateAllProjectsProgress: Progress is automatically calculated by backend');
    // Le backend calcule automatiquement la progression
    // Pas besoin de faire quoi que ce soit
  }

  /**
   * Récupérer les statistiques d'un projet
   */
  async getProjectStats(projectId: string) {
    try {
      return await projectsAPI.getProjectStats(projectId);
    } catch (error: any) {
      console.error('Error getting project stats:', error);
      throw error;
    }
  }

  /**
   * Récupérer les membres d'un projet
   */
  async getProjectMembers(projectId: string) {
    try {
      return await projectsAPI.getProjectMembers(projectId);
    } catch (error: any) {
      console.error('Error getting project members:', error);
      return [];
    }
  }
}

/**
 * Instance globale du service projet
 */
export const projectService = new ProjectService();
