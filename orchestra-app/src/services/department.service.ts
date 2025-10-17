import { departmentApi } from './api/department.api';
import { userService } from './user.service';
import { Department, CreateDepartmentRequest, User } from '../types';

export class DepartmentService {
  /**
   * Crée un nouveau département
   */
  async createDepartment(departmentData: CreateDepartmentRequest): Promise<string> {
    try {
      const department = await departmentApi.create({
        ...departmentData,
        isActive: true,
      });
      return department.id;
    } catch (error: any) {
      console.error('Error creating department:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la création du département');
    }
  }

  /**
   * Met à jour un département
   */
  async updateDepartment(departmentData: Partial<Department> & { id: string }): Promise<void> {
    try {
      const { id, ...updateData } = departmentData;
      await departmentApi.update(id, updateData);
    } catch (error: any) {
      console.error('Error updating department:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du département');
    }
  }

  /**
   * Supprime un département (soft delete via deactivate)
   */
  async deleteDepartment(departmentId: string): Promise<void> {
    try {
      // Vérifier s'il y a des utilisateurs assignés à ce département
      const usersInDepartment = await this.getUsersInDepartment(departmentId);
      if (usersInDepartment.length > 0) {
        throw new Error(
          `Impossible de supprimer le département : ${usersInDepartment.length} utilisateur(s) y sont encore assignés`
        );
      }

      await departmentApi.deactivate(departmentId);
    } catch (error: any) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  /**
   * Supprime définitivement un département
   */
  async permanentDeleteDepartment(departmentId: string): Promise<void> {
    try {
      // Vérifier s'il y a des utilisateurs assignés à ce département
      const usersInDepartment = await this.getUsersInDepartment(departmentId);
      if (usersInDepartment.length > 0) {
        throw new Error(
          `Impossible de supprimer définitivement le département : ${usersInDepartment.length} utilisateur(s) y sont encore assignés`
        );
      }

      await departmentApi.delete(departmentId);
    } catch (error: any) {
      console.error('Error permanently deleting department:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les départements actifs
   */
  async getAllDepartments(): Promise<Department[]> {
    try {
      const departments = await departmentApi.getAll(false);
      // Déjà trié par nom côté backend
      return departments;
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des départements');
    }
  }

  /**
   * Récupère un département par son ID
   */
  async getDepartmentById(departmentId: string): Promise<Department | null> {
    try {
      const department = await departmentApi.getById(departmentId);
      return department;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching department:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération du département');
    }
  }

  /**
   * Récupère les utilisateurs d'un département
   */
  async getUsersInDepartment(departmentId: string): Promise<User[]> {
    try {
      const users = await departmentApi.getUsersByDepartment(departmentId);

      // EXCLURE l'admin technique des ressources RH
      return users.filter((user: User) =>
        user.email !== 'elegalex1980@gmail.com' &&
        user.role !== 'ADMIN' &&
        user.role !== 'admin'
      );
    } catch (error: any) {
      console.error('Error fetching users in department:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des utilisateurs du département');
    }
  }

  /**
   * Assigne un utilisateur à un département
   */
  async assignUserToDepartment(userId: string, departmentId: string | null): Promise<void> {
    try {
      // Utiliser le service utilisateur pour mettre à jour le département
      await userService.updateUser(userId, {
        departmentId: departmentId || undefined,
      });
    } catch (error: any) {
      console.error('Error assigning user to department:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'assignation de l\'utilisateur au département');
    }
  }

  /**
   * Récupère les statistiques des départements
   */
  async getDepartmentStats(): Promise<{
    totalDepartments: number;
    activeDepartments: number;
    totalUsersAssigned: number;
    unassignedUsers: number;
    departmentBreakdown: Array<{
      departmentId: string;
      departmentName: string;
      userCount: number;
      users: User[];
    }>;
  }> {
    try {
      // Récupérer tous les départements actifs
      const departments = await this.getAllDepartments();

      // Vérifier que departments est un tableau
      if (!Array.isArray(departments)) {
        console.warn('getAllDepartments returned non-array:', departments);
        throw new Error('Impossible de récupérer la liste des départements');
      }

      // Récupérer tous les utilisateurs actifs
      const allUsers = await userService.getAllUsers();

      // Vérifier que allUsers est un tableau
      if (!Array.isArray(allUsers)) {
        console.warn('getAllUsers returned non-array:', allUsers);
        throw new Error('Impossible de récupérer la liste des utilisateurs');
      }

      // EXCLURE l'admin technique des ressources RH
      const filteredUsers = allUsers.filter((user: User) =>
        user.email !== 'elegalex1980@gmail.com' &&
        user.role !== 'ADMIN' &&
        user.role !== 'admin'
      );

      // Compter les utilisateurs assignés et non assignés
      const usersWithDepartment = filteredUsers.filter((user: User) => user.departmentId);
      const unassignedUsers = filteredUsers.filter((user: User) => !user.departmentId);

      // Créer le breakdown par département
      const departmentBreakdown = departments.map(dept => {
        const deptUsers = filteredUsers.filter((user: User) => user.departmentId === dept.id);
        return {
          departmentId: dept.id,
          departmentName: dept.name,
          userCount: deptUsers.length,
          users: deptUsers
        };
      });

      return {
        totalDepartments: departments.length,
        activeDepartments: departments.filter(d => d.isActive).length,
        totalUsersAssigned: usersWithDepartment.length,
        unassignedUsers: unassignedUsers.length,
        departmentBreakdown
      };
    } catch (error: any) {
      console.error('Error fetching department stats:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des statistiques des départements');
    }
  }

  /**
   * Transfère tous les utilisateurs d'un département vers un autre
   */
  async transferUsersBetweenDepartments(
    fromDepartmentId: string,
    toDepartmentId: string | null
  ): Promise<void> {
    try {
      const usersToTransfer = await this.getUsersInDepartment(fromDepartmentId);

      if (usersToTransfer.length === 0) {
        return;
      }

      // Mettre à jour chaque utilisateur
      await Promise.all(
        usersToTransfer.map((user: User) =>
          userService.updateUser(user.id, {
            departmentId: toDepartmentId || undefined,
          })
        )
      );
    } catch (error: any) {
      console.error('Error transferring users between departments:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors du transfert des utilisateurs entre départements');
    }
  }

  /**
   * Récupère les utilisateurs non assignés à un département
   */
  async getUnassignedUsers(): Promise<User[]> {
    try {
      const allUsers = await userService.getAllUsers();

      const unassignedUsers = allUsers.filter((user: User) => !user.departmentId);

      // EXCLURE l'admin technique des ressources RH
      const filteredUsers = unassignedUsers.filter((user: User) =>
        user.email !== 'elegalex1980@gmail.com' &&
        user.role !== 'ADMIN' &&
        user.role !== 'admin'
      );

      return filteredUsers;
    } catch (error: any) {
      console.error('Error fetching unassigned users:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des utilisateurs non assignés');
    }
  }
}

export const departmentService = new DepartmentService();
