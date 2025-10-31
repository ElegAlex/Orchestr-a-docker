/**
 * Service Management Service - Version REST API
 *
 * Ce service a été migré de Firebase vers REST API.
 *
 * @see /home/alex/Documents/Repository/orchestr-a-docker/backend/src/services
 * @see service.service.ts.firebase-backup Pour l'ancienne version Firebase
 */

import { servicesApi, OrganizationService, CreateServiceDto, UpdateServiceDto, ServiceStats } from './api/services.api';

// Types pour compatibilité avec l'ancien code
export interface Service {
  id: string;
  name: string;
  description?: string;
  color: string;
  manager?: string;
  budget?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  color: string;
  manager?: string;
  budget?: number;
}

export interface UpdateServiceRequest extends Partial<CreateServiceRequest> {
  id: string;
  isActive?: boolean;
}

export class ServiceService {
  /**
   * Récupère tous les services actifs
   */
  async getAllServices(): Promise<Service[]> {
    try {
      const services = await servicesApi.getAll(true);
      return services.map((s) => this.mapToService(s));
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  /**
   * Récupère un service par son ID
   */
  async getServiceById(id: string): Promise<Service | null> {
    try {
      const service = await servicesApi.getById(id);
      return this.mapToService(service);
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        return null;
      }
      console.error('Error fetching service:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau service
   */
  async createService(serviceData: CreateServiceRequest): Promise<string> {
    try {
      const createDto: CreateServiceDto = {
        name: serviceData.name,
        color: serviceData.color,
        description: serviceData.description,
        manager: serviceData.manager,
        budget: serviceData.budget,
      };
      const service = await servicesApi.create(createDto);
      return service.id;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  /**
   * Met à jour un service
   */
  async updateService(updateData: UpdateServiceRequest): Promise<void> {
    try {
      const { id, ...data } = updateData;
      const updateDto: UpdateServiceDto = {
        ...data,
      };
      await servicesApi.update(id, updateDto);
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  /**
   * Supprime un service (soft delete)
   */
  async deleteService(id: string): Promise<void> {
    try {
      await servicesApi.delete(id);
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des services
   */
  async getServicesStats(): Promise<{
    total: number;
    withManager: number;
    totalBudget: number;
  }> {
    try {
      return await servicesApi.getStats();
    } catch (error) {
      console.error('Error fetching services stats:', error);
      throw error;
    }
  }

  /**
   * Convertit un OrganizationService (backend) en Service (frontend)
   */
  private mapToService(s: OrganizationService): Service {
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      color: s.color,
      manager: s.manager || undefined,
      budget: s.budget || undefined,
      isActive: s.isActive,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    };
  }
}

export const serviceService = new ServiceService();
