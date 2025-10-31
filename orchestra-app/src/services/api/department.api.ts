import api from './client';
import { Department, CreateDepartmentRequest } from '../../types';

export const departmentApi = {
  /**
   * Récupérer tous les départements
   */
  getAll: async (includeInactive = false): Promise<Department[]> => {
    return await api.get(`/departments`, {
      params: { includeInactive: includeInactive.toString() },
    });
  },

  /**
   * Récupérer un département par son ID
   */
  getById: async (id: string): Promise<Department> => {
    return await api.get(`/departments/${id}`);
  },

  /**
   * Récupérer les utilisateurs d'un département
   */
  getUsersByDepartment: async (departmentId: string) => {
    return await api.get(`/departments/${departmentId}/users`);
  },

  /**
   * Créer un nouveau département
   */
  create: async (data: CreateDepartmentRequest): Promise<Department> => {
    return await api.post('/departments', data);
  },

  /**
   * Mettre à jour un département
   */
  update: async (id: string, data: Partial<CreateDepartmentRequest>): Promise<Department> => {
    return await api.patch(`/departments/${id}`, data);
  },

  /**
   * Désactiver un département
   */
  deactivate: async (id: string): Promise<Department> => {
    return await api.patch(`/departments/${id}/deactivate`);
  },

  /**
   * Activer un département
   */
  activate: async (id: string): Promise<Department> => {
    return await api.patch(`/departments/${id}/activate`);
  },

  /**
   * Supprimer un département
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/departments/${id}`);
  },
};
