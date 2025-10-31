/**
 * Service Capacity - Migration REST API
 * Gestion des contrats, allocations et calculs de capacité
 *
 * ✅ REFONTE COMPLÈTE - 20 Oct 2025
 * - Gestion correcte des contrats virtuels
 * - Conversion automatique des dates
 * - Gestion robuste des erreurs
 */

import { capacityApi, ContractType, WeekDay } from './api/capacity.api';
import type {
  WorkContract,
  ResourceAllocation,
  DatePeriod,
  UserCapacity,
  CreateContractDto,
  UpdateContractDto,
  CreateAllocationDto,
  UpdateAllocationDto,
} from './api/capacity.api';

/**
 * Fonction helper pour convertir Date → ISO string (YYYY-MM-DD)
 */
function toISODateString(date: any): string {
  if (!date) return new Date().toISOString().split('T')[0];
  if (date instanceof Date) return date.toISOString().split('T')[0];
  if (typeof date === 'string') return date.split('T')[0];
  return new Date().toISOString().split('T')[0];
}

/**
 * Fonction helper pour normaliser les jours de la semaine en MAJUSCULES
 */
function normalizeWorkingDays(days: any[]): WeekDay[] {
  if (!Array.isArray(days)) return [];
  return days.map(day => {
    const dayStr = String(day).toUpperCase();
    return dayStr as WeekDay;
  });
}

class CapacityService {
  // ========================================
  // GESTION DES CONTRATS
  // ========================================

  /**
   * Récupère le contrat actif d'un utilisateur
   * Retourne TOUJOURS un contrat (virtuel si pas de contrat réel)
   */
  async getUserContract(userId: string): Promise<WorkContract> {
    try {
      const apiContract = await capacityApi.getUserContract(userId);

      // Convertir les dates string en objets Date
      // IMPORTANT: Gérer null/undefined pour éviter Invalid Date
      const contract: WorkContract = {
        ...apiContract,
        startDate: apiContract.startDate ? new Date(apiContract.startDate) : new Date(),
        endDate: apiContract.endDate ? new Date(apiContract.endDate) : undefined,
        createdAt: apiContract.createdAt ? new Date(apiContract.createdAt) : new Date(),
        updatedAt: apiContract.updatedAt ? new Date(apiContract.updatedAt) : new Date(),
      };

      return contract;
    } catch (error: any) {
      console.error('[CapacityService] Erreur récupération contrat:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les contrats d'un utilisateur
   */
  async getUserContracts(userId: string): Promise<WorkContract[]> {
    try {
      return await capacityApi.getUserContracts(userId);
    } catch (error) {
      console.error('[CapacityService] Erreur récupération contrats:', error);
      throw error;
    }
  }

  /**
   * Récupère mon contrat actif
   */
  async getMyContract(): Promise<WorkContract> {
    try {
      return await capacityApi.getMyContract();
    } catch (error) {
      console.error('[CapacityService] Erreur récupération mon contrat:', error);
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
      const dto: CreateContractDto = {
        type: contractData.type || ContractType.CDI,
        workingTimePercentage: contractData.workingTimePercentage || 100,
        weeklyHours: contractData.weeklyHours || 35,
        workingDays: contractData.workingDays
          ? normalizeWorkingDays(contractData.workingDays)
          : [WeekDay.MONDAY, WeekDay.TUESDAY, WeekDay.WEDNESDAY, WeekDay.THURSDAY, WeekDay.FRIDAY],
        startDate: toISODateString(contractData.startDate),
        endDate: contractData.endDate ? toISODateString(contractData.endDate) : undefined,
        paidLeaveDays: contractData.paidLeaveDays || 25,
        rttDays: contractData.rttDays || 0,
        isRemoteAllowed: contractData.isRemoteAllowed || false,
        maxRemoteDaysPerWeek: contractData.maxRemoteDaysPerWeek,
        hourlyRate: contractData.hourlyRate,
        workingSchedule: contractData.workingSchedule,
      };

      const apiResult = await capacityApi.createContract(userId, dto);

      // Convertir les dates string en objets Date
      // IMPORTANT: Gérer null/undefined pour éviter Invalid Date
      const result: WorkContract = {
        ...apiResult,
        startDate: apiResult.startDate ? new Date(apiResult.startDate) : new Date(),
        endDate: apiResult.endDate ? new Date(apiResult.endDate) : undefined,
        createdAt: apiResult.createdAt ? new Date(apiResult.createdAt) : new Date(),
        updatedAt: apiResult.updatedAt ? new Date(apiResult.updatedAt) : new Date(),
      };

      return result;
    } catch (error) {
      console.error('[CapacityService] Erreur création contrat:', error);
      throw error;
    }
  }

  /**
   * Crée un contrat par défaut pour un utilisateur
   */
  async createDefaultContract(userId: string): Promise<WorkContract> {
    try {
      return await this.createContract(userId, {});
    } catch (error) {
      console.error('[CapacityService] Erreur création contrat par défaut:', error);
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
      // Convertir les dates et normaliser les données avant l'envoi
      const dto: Partial<UpdateContractDto> = { ...updates };

      if (updates.startDate) {
        dto.startDate = toISODateString(updates.startDate);
      }

      if (updates.endDate !== undefined) {
        dto.endDate = toISODateString(updates.endDate);
      }

      if (updates.workingDays) {
        dto.workingDays = normalizeWorkingDays(updates.workingDays);
      }

      const apiResult = await capacityApi.updateContract(contractId, dto);

      // Convertir les dates string en objets Date
      // IMPORTANT: Gérer null/undefined pour éviter Invalid Date
      const result: WorkContract = {
        ...apiResult,
        startDate: apiResult.startDate ? new Date(apiResult.startDate) : new Date(),
        endDate: apiResult.endDate ? new Date(apiResult.endDate) : undefined,
        createdAt: apiResult.createdAt ? new Date(apiResult.createdAt) : new Date(),
        updatedAt: apiResult.updatedAt ? new Date(apiResult.updatedAt) : new Date(),
      };

      return result;
    } catch (error) {
      console.error('[CapacityService] Erreur mise à jour contrat:', error);
      throw error;
    }
  }

  /**
   * Supprime un contrat
   */
  async deleteContract(contractId: string): Promise<void> {
    try {
      await capacityApi.deleteContract(contractId);
    } catch (error) {
      console.error('[CapacityService] Erreur suppression contrat:', error);
      throw error;
    }
  }

  // ========================================
  // GESTION DES ALLOCATIONS
  // ========================================

  async getUserAllocations(
    userId: string,
    period?: DatePeriod
  ): Promise<ResourceAllocation[]> {
    try {
      return await capacityApi.getUserAllocations(
        userId,
        period?.startDate,
        period?.endDate
      );
    } catch (error) {
      console.error('[CapacityService] Erreur récupération allocations utilisateur:', error);
      throw error;
    }
  }

  async getProjectAllocations(
    projectId: string,
    period?: DatePeriod
  ): Promise<ResourceAllocation[]> {
    try {
      return await capacityApi.getProjectAllocations(
        projectId,
        period?.startDate,
        period?.endDate
      );
    } catch (error) {
      console.error('[CapacityService] Erreur récupération allocations projet:', error);
      throw error;
    }
  }

  async getMyAllocations(period?: DatePeriod): Promise<ResourceAllocation[]> {
    try {
      return await capacityApi.getMyAllocations(
        period?.startDate,
        period?.endDate
      );
    } catch (error) {
      console.error('[CapacityService] Erreur récupération mes allocations:', error);
      throw error;
    }
  }

  async createAllocation(
    allocationData: CreateAllocationDto
  ): Promise<ResourceAllocation> {
    try {
      return await capacityApi.createAllocation(allocationData);
    } catch (error) {
      console.error('[CapacityService] Erreur création allocation:', error);
      throw error;
    }
  }

  async updateAllocation(
    allocationId: string,
    updates: UpdateAllocationDto
  ): Promise<ResourceAllocation> {
    try {
      return await capacityApi.updateAllocation(allocationId, updates);
    } catch (error) {
      console.error('[CapacityService] Erreur mise à jour allocation:', error);
      throw error;
    }
  }

  async deleteAllocation(allocationId: string): Promise<void> {
    try {
      await capacityApi.deleteAllocation(allocationId);
    } catch (error) {
      console.error('[CapacityService] Erreur suppression allocation:', error);
      throw error;
    }
  }

  // ========================================
  // CALCUL DE CAPACITÉ
  // ========================================

  async calculateUserCapacity(
    userId: string,
    period: DatePeriod
  ): Promise<UserCapacity> {
    try {
      return await capacityApi.calculateUserCapacity(
        userId,
        period.startDate,
        period.endDate,
        period.label
      );
    } catch (error) {
      console.error('[CapacityService] Erreur calcul capacité:', error);
      throw error;
    }
  }

  async calculateMyCapacity(period: DatePeriod): Promise<UserCapacity> {
    try {
      return await capacityApi.calculateMyCapacity(
        period.startDate,
        period.endDate,
        period.label
      );
    } catch (error) {
      console.error('[CapacityService] Erreur calcul ma capacité:', error);
      throw error;
    }
  }

  async getCachedCapacity(userId: string, period: DatePeriod) {
    try {
      return await capacityApi.getCachedCapacity(
        userId,
        period.startDate,
        period.endDate
      );
    } catch (error) {
      console.error('[CapacityService] Erreur récupération capacité en cache:', error);
      throw error;
    }
  }

  // ========================================
  // GÉNÉRATION DE PÉRIODES
  // ========================================

  async generatePeriods(
    type: 'month' | 'quarter' | 'year',
    year: number
  ): Promise<DatePeriod[]> {
    try {
      return await capacityApi.generatePeriods(type, year);
    } catch (error) {
      console.error('[CapacityService] Erreur génération périodes:', error);
      throw error;
    }
  }

  async generateMonthlyPeriods(year: number): Promise<DatePeriod[]> {
    return this.generatePeriods('month', year);
  }

  async generateQuarterlyPeriods(year: number): Promise<DatePeriod[]> {
    return this.generatePeriods('quarter', year);
  }

  async generateYearlyPeriod(year: number): Promise<DatePeriod[]> {
    return this.generatePeriods('year', year);
  }

  // ========================================
  // MÉTHODES UTILITAIRES
  // ========================================

  async calculateDailyCapacityForPeriod(
    userId: string,
    period: DatePeriod
  ): Promise<number[]> {
    try {
      const capacity = await this.calculateUserCapacity(userId, period);
      return capacity.workingDaysInPeriod;
    } catch (error) {
      console.error('[CapacityService] Erreur calcul capacité journalière:', error);
      throw error;
    }
  }

  isDateInPeriod(date: Date | string, period: DatePeriod): boolean {
    const checkDate = typeof date === 'string' ? new Date(date) : date;
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);
    return checkDate >= startDate && checkDate <= endDate;
  }

  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

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

  /**
   * Vérifie si un contrat est virtuel (pas encore créé en base)
   */
  isVirtualContract(contract: WorkContract | null): boolean {
    if (!contract) return true;
    if (!contract.id) return true;
    if (contract.id.startsWith('virtual-')) return true;
    return false;
  }
}

export const capacityService = new CapacityService();
export default capacityService;
