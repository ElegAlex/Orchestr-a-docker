import { Task, Project, User } from '../types';
import { usersAPI } from './api/users.api';
import { tasksAPI } from './api/tasks.api';
import { projectsAPI } from './api/projects.api';
import { milestoneApi } from './api/milestone.api';

export interface ProjectWithMilestones {
  project: Project;
  milestones: MilestoneWithTasks[];
}

export interface MilestoneWithTasks {
  milestoneId?: string;
  milestoneName: string;
  tasks: Task[];
}

class TeamSupervisionService {
  /**
   * Récupère les membres de l'équipe selon le rôle
   * - Admin : tous les utilisateurs
   * - Responsable : tous les utilisateurs du département
   * - Manager : utilisateurs avec managerId = userId OU même département si pas de managerId défini
   */
  async getTeamMembers(userId: string, userRole: string, userDepartment?: string): Promise<User[]> {
    try {
      let teamMembers: User[] = [];

      if (userRole === 'ADMIN' || userRole === 'admin') {
        // Admin voit tous les utilisateurs
        const response = await usersAPI.getUsers();
        teamMembers = response.data;
      } else if (userRole === 'RESPONSABLE' || userRole === 'responsable') {
        // Responsable voit tout son département
        if (!userDepartment) throw new Error('Le responsable doit avoir un département assigné');
        const response = await usersAPI.getUsers({ departmentId: userDepartment });
        teamMembers = response.data;
      } else if (userRole === 'MANAGER' || userRole === 'manager') {
        // Manager voit :
        // 1. Les utilisateurs dont il est le manager (managerId === userId)
        // 2. Fallback : utilisateurs du même département si pas de managerId défini

        // Requête 1 : Utilisateurs avec ce manager
        const directReportsResponse = await usersAPI.getUsers({ managerId: userId });
        const directReports = directReportsResponse.data;

        // Requête 2 : Utilisateurs du département sans manager assigné (fallback)
        if (userDepartment) {
          const deptResponse = await usersAPI.getUsers({ departmentId: userDepartment });
          const deptMembers = deptResponse.data.filter(u =>
            u.id !== userId && // Exclure le manager lui-même
            (!u.managerId || u.managerId === '') // Sans manager assigné
          );

          // Combiner et dédupliquer
          const allMembers = [...directReports, ...deptMembers];
          const uniqueIds = new Set<string>();
          teamMembers = allMembers.filter(u => {
            if (uniqueIds.has(u.id)) return false;
            uniqueIds.add(u.id);
            return true;
          });
        } else {
          teamMembers = directReports;
        }
      } else {
        return [];
      }

      // Trier par nom pour faciliter la sélection
      return teamMembers.sort((a, b) =>
        (a.displayName || a.email).localeCompare(b.displayName || b.email)
      );
    } catch (error) {
      console.error('Erreur récupération membres équipe:', error);
      throw error;
    }
  }

  /**
   * Récupère les tâches d'un agent spécifique organisées par projet/jalon
   * - Uniquement tâches où l'agent est ASSIGNÉ (assigneeId)
   * - Uniquement tâches NON terminées (pas DONE/COMPLETED)
   * - Uniquement tâches de projets ACTIFS
   * - Pas de tâches BACKLOG
   * - Classement par date d'échéance projet (ordre chronologique)
   */
  async getAgentTasksByProject(agentId: string): Promise<ProjectWithMilestones[]> {
    try {
      // 1. Récupérer toutes les tâches assignées à l'agent
      const allTasks = await tasksAPI.getUserTasks(agentId);

      // Filtrer : pas DONE/COMPLETED, pas BACKLOG
      const tasks = allTasks.filter(
        t => !['DONE', 'COMPLETED', 'BACKLOG'].includes(t.status)
      );

      if (tasks.length === 0) {
        return [];
      }

      // 2. Récupérer les projets associés (uniquement ACTIVE)
      const projectIds = [...new Set(tasks.map(t => t.projectId))];
      const projectsMap = new Map<string, Project>();

      await Promise.all(
        projectIds.map(async (projectId) => {
          try {
            const project = await projectsAPI.getProject(projectId);
            // Filtrer uniquement projets actifs
            if (project.status === 'ACTIVE' || project.status === 'active') {
              projectsMap.set(projectId, project);
            }
          } catch (error) {
            console.warn(`Projet ${projectId} non trouvé ou erreur:`, error);
          }
        })
      );

      // 3. Filtrer les tâches pour ne garder que celles de projets actifs
      const activeTasks = tasks.filter(t => projectsMap.has(t.projectId));

      // 4. Récupérer les jalons
      const milestoneIds = [
        ...new Set(
          activeTasks.map(t => (t as any).milestoneId).filter(Boolean)
        ),
      ];
      const milestonesDataMap = new Map<string, { name: string; code: string }>();

      await Promise.all(
        milestoneIds.map(async (milestoneId) => {
          try {
            const milestone = await milestoneApi.getById(milestoneId);
            milestonesDataMap.set(milestoneId, {
              name: milestone.name || milestone.code || milestoneId,
              code: milestone.code || '',
            });
          } catch (error) {
            console.warn(`Jalon ${milestoneId} non trouvé:`, error);
          }
        })
      );

      // 5. Organiser par projet puis par jalon
      const projectsWithMilestones: ProjectWithMilestones[] = [];

      for (const [projectId, project] of projectsMap.entries()) {
        const projectTasks = activeTasks.filter(t => t.projectId === projectId);

        // Grouper par jalon
        const milestonesMap = new Map<string, Task[]>();

        projectTasks.forEach(task => {
          const milestoneKey = (task as any).milestoneId || 'no-milestone';
          if (!milestonesMap.has(milestoneKey)) {
            milestonesMap.set(milestoneKey, []);
          }
          milestonesMap.get(milestoneKey)!.push(task);
        });

        // Créer les groupes de jalons
        const milestones: MilestoneWithTasks[] = Array.from(
          milestonesMap.entries()
        ).map(([key, tasks]) => {
          if (key === 'no-milestone') {
            return {
              milestoneId: undefined,
              milestoneName: 'Sans jalon',
              tasks,
            };
          }

          const milestoneData = milestonesDataMap.get(key);
          return {
            milestoneId: key,
            milestoneName: milestoneData?.name || key,
            tasks,
          };
        });

        projectsWithMilestones.push({
          project,
          milestones,
        });
      }

      // 6. Trier par date d'échéance projet (ordre chronologique)
      projectsWithMilestones.sort((a, b) => {
        const dateA = new Date(a.project.dueDate).getTime();
        const dateB = new Date(b.project.dueDate).getTime();
        return dateA - dateB;
      });

      return projectsWithMilestones;
    } catch (error) {
      console.error('Erreur récupération tâches agent:', error);
      throw error;
    }
  }

}

export const teamSupervisionService = new TeamSupervisionService();
