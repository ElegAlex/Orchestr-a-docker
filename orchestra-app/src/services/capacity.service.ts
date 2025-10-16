/**
 * Service Capacity - Migration REST API
 * Gestion des contrats, allocations et calculs de capacité
 */

import {
  capacityApi,
  ContractType,
  WeekDay,
  WorkContract,
  ResourceAllocation,
  DatePeriod,
  UserCapacity,
  CreateContractDto,
  UpdateContractDto,
  CreateAllocationDto,
  UpdateAllocationDto,
} from './api';

class CapacityService {
  // ========================================
  // GESTION DES CONTRATS
  // ========================================

  /**
   * Récupère le contrat actif d'un utilisateur
   */
  async getUserContract(userId: string): Promise<WorkContract> {
    try {
      console.log('📝 CapacityService.getUserContract:', { userId });
      return await capacityApi.getUserContract(userId);
    } catch (error) {
      console.error('Erreur lors de la récupération du contrat:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les contrats d'un utilisateur
   */
  async getUserContracts(userId: string): Promise<WorkContract[]> {
    try {
      console.log('📝 CapacityService.getUserContracts:', { userId });
      return await capacityApi.getUserContracts(userId);
    } catch (error) {
      console.error('Erreur lors de la récupération des contrats:', error);
      throw error;
    }
  }

  /**
   * Récupère mon contrat actif
   */
  async getMyContract(): Promise<WorkContract> {
    try {
      console.log('📝 CapacityService.getMyContract');
      return await capacityApi.getMyContract();
    } catch (error) {
      console.error('Erreur lors de la récupération de mon contrat:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau contrat de travail
   */
  async createContract(
    userId: string,
    contractData: Partial<CreateContractDto>
  ): Promise<WorkContract> {
    try {
      console.log('📝 CapacityService.createContract:', { userId, contractData });

      const dto: CreateContractDto = {
        type: contractData.type || ContractType.CDI,
        workingTimePercentage: contractData.workingTimePercentage || 100,
        weeklyHours: contractData.weeklyHours || 35,
        workingDays: contractData.workingDays || [
          WeekDay.MONDAY,
          WeekDay.TUESDAY,
          WeekDay.WEDNESDAY,
          WeekDay.THURSDAY,
          WeekDay.FRIDAY,
        ],
        startDate:
          contractData.startDate || new Date().toISOString().split('T')[0],
        endDate: contractData.endDate,
        paidLeaveDays: contractData.paidLeaveDays || 25,
        rttDays: contractData.rttDays || 0,
        isRemoteAllowed: contractData.isRemoteAllowed || false,
        maxRemoteDaysPerWeek: contractData.maxRemoteDaysPerWeek,
        hourlyRate: contractData.hourlyRate,
        workingSchedule: contractData.workingSchedule,
      };

      return await capacityApi.createContract(userId, dto);
    } catch (error) {
      console.error('Erreur lors de la création du contrat:', error);
      throw error;
    }
  }

  /**
   * Crée un contrat par défaut pour un utilisateur
   */
  async createDefaultContract(userId: string): Promise<WorkContract> {
    try {
      console.log('📝 CapacityService.createDefaultContract:', { userId });
      return await this.createContract(userId, {});
    } catch (error) {
      console.error('Erreur lors de la création du contrat par défaut:', error);
      throw error;
    }
  }

  /**
   * Met à jour un contrat
   */
  async updateContract(
    contractId: string,
    updates: Partial<UpdateContractDto>
  ): Promise<WorkContract> {
    try {
      console.log('📝 CapacityService.updateContract:', { contractId, updates });
      return await capacityApi.updateContract(contractId, updates);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du contrat:', error);
      throw error;
    }
  }

  /**
   * Supprime un contrat
   */
  async deleteContract(contractId: string): Promise<void> {
    try {
      console.log('📝 CapacityService.deleteContract:', { contractId });
      await capacityApi.deleteContract(contractId);
    } catch (error) {
      console.error('Erreur lors de la suppression du contrat:', error);
      throw error;
    }
  }

  // ========================================
  // GESTION DES ALLOCATIONS
  // ========================================

  /**
   * Récupère les allocations d'un utilisateur
   */
  async getUserAllocations(
    userId: string,
    period?: DatePeriod
  ): Promise<ResourceAllocation[]> {
    try {
      console.log('📝 CapacityService.getUserAllocations:', { userId, period });
      return await capacityApi.getUserAllocations(
        userId,
        period?.startDate,
        period?.endDate
      );
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des allocations utilisateur:',
        error
      );
      throw error;
    }
  }

  /**
   * Récupère les allocations d'un projet
   */
  async getProjectAllocations(
    projectId: string,
    period?: DatePeriod
  ): Promise<ResourceAllocation[]> {
    try {
      console.log('📝 CapacityService.getProjectAllocations:', {
        projectId,
        period,
      });
      return await capacityApi.getProjectAllocations(
        projectId,
        period?.startDate,
        period?.endDate
      );
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des allocations projet:',
        error
      );
      throw error;
    }
  }

  /**
   * Récupère mes allocations
   */
  async getMyAllocations(period?: DatePeriod): Promise<ResourceAllocation[]> {
    try {
      console.log('📝 CapacityService.getMyAllocations:', { period });
      return await capacityApi.getMyAllocations(
        period?.startDate,
        period?.endDate
      );
    } catch (error) {
      console.error(
        'Erreur lors de la récupération de mes allocations:',
        error
      );
      throw error;
    }
  }

  /**
   * Crée une allocation de ressource
   */
  async createAllocation(
    allocationData: CreateAllocationDto
  ): Promise<ResourceAllocation> {
    try {
      console.log('📝 CapacityService.createAllocation:', { allocationData });
      return await capacityApi.createAllocation(allocationData);
    } catch (error) {
      console.error('Erreur lors de la création de l\'allocation:', error);
      throw error;
    }
  }

  /**
   * Met à jour une allocation
   */
  async updateAllocation(
    allocationId: string,
    updates: UpdateAllocationDto
  ): Promise<ResourceAllocation> {
    try {
      console.log('📝 CapacityService.updateAllocation:', {
        allocationId,
        updates,
      });
      return await capacityApi.updateAllocation(allocationId, updates);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'allocation:', error);
      throw error;
    }
  }

  /**
   * Supprime une allocation
   */
  async deleteAllocation(allocationId: string): Promise<void> {
    try {
      console.log('📝 CapacityService.deleteAllocation:', { allocationId });
      await capacityApi.deleteAllocation(allocationId);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'allocation:', error);
      throw error;
    }
  }

  // ========================================
  // CALCUL DE CAPACITÉ
  // ========================================

  /**
   * Calcule la capacité complète d'un utilisateur pour une période
   */
  async calculateUserCapacity(
    userId: string,
    period: DatePeriod
  ): Promise<UserCapacity> {
    try {
      console.log('📝 CapacityService.calculateUserCapacity:', {
        userId,
        period,
      });

      return await capacityApi.calculateUserCapacity(
        userId,
        period.startDate,
        period.endDate,
        period.label
      );
    } catch (error) {
      console.error('Erreur lors du calcul de la capacité:', error);
      throw error;
    }
  }

  /**
   * Calcule ma capacité pour une période
   */
  async calculateMyCapacity(period: DatePeriod): Promise<UserCapacity> {
    try {
      console.log('📝 CapacityService.calculateMyCapacity:', { period });

      return await capacityApi.calculateMyCapacity(
        period.startDate,
        period.endDate,
        period.label
      );
    } catch (error) {
      console.error('Erreur lors du calcul de ma capacité:', error);
      throw error;
    }
  }

  /**
   * Récupère la capacité en cache
   */
  async getCachedCapacity(userId: string, period: DatePeriod) {
    try {
      console.log('📝 CapacityService.getCachedCapacity:', { userId, period });

      return await capacityApi.getCachedCapacity(
        userId,
        period.startDate,
        period.endDate
      );
    } catch (error) {
      console.error(
        'Erreur lors de la récupération de la capacité en cache:',
        error
      );
      throw error;
    }
  }

  // ========================================
  // GÉNÉRATION DE PÉRIODES
  // ========================================

  /**
   * Génère des périodes prédéfinies (mois, trimestre, année)
   */
  async generatePeriods(
    type: 'month' | 'quarter' | 'year',
    year: number
  ): Promise<DatePeriod[]> {
    try {
      console.log('📝 CapacityService.generatePeriods:', { type, year });
      return await capacityApi.generatePeriods(type, year);
    } catch (error) {
      console.error('Erreur lors de la génération des périodes:', error);
      throw error;
    }
  }

  /**
   * Génère les périodes mensuelles pour une année
   */
  async generateMonthlyPeriods(year: number): Promise<DatePeriod[]> {
    return this.generatePeriods('month', year);
  }

  /**
   * Génère les périodes trimestrielles pour une année
   */
  async generateQuarterlyPeriods(year: number): Promise<DatePeriod[]> {
    return this.generatePeriods('quarter', year);
  }

  /**
   * Génère la période annuelle
   */
  async generateYearlyPeriod(year: number): Promise<DatePeriod[]> {
    return this.generatePeriods('year', year);
  }

  // ========================================
  // MÉTHODES UTILITAIRES
  // ========================================

  /**
   * Calcule la capacité journalière pour une période
   * Note: Cette méthode est conservée pour compatibilité mais pourrait être supprimée
   * car le backend gère maintenant tous les calculs
   */
  async calculateDailyCapacityForPeriod(
    userId: string,
    period: DatePeriod
  ): Promise<number[]> {
    try {
      // Récupérer la capacité complète (qui inclut workingDaysInPeriod)
      const capacity = await this.calculateUserCapacity(userId, period);
      return capacity.workingDaysInPeriod;
    } catch (error) {
      console.error(
        'Erreur lors du calcul de la capacité journalière:',
        error
      );
      throw error;
    }
  }

  /**
   * Vérifie si une date est dans une période
   */
  isDateInPeriod(date: Date | string, period: DatePeriod): boolean {
    const checkDate = typeof date === 'string' ? new Date(date) : date;
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);

    return checkDate >= startDate && checkDate <= endDate;
  }

  /**
   * Formate une date pour l'API (YYYY-MM-DD)
   */
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Crée une période à partir de dates
   */
  createPeriod(
    startDate: Date | string,
    endDate: Date | string,
    label?: string
  ): DatePeriod {
    return {
      startDate:
        typeof startDate === 'string'
          ? startDate
          : this.formatDateForAPI(startDate),
      endDate:
        typeof endDate === 'string' ? endDate : this.formatDateForAPI(endDate),
      label,
    };
  }
}

export const capacityService = new CapacityService();
export default capacityService;
