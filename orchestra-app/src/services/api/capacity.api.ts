/**
 * API Client pour le service Capacity
 * Gestion des contrats, allocations et calculs de capacité
 */

import { apiClient } from './client';

// ==========================================
// TYPES
// ==========================================

export enum ContractType {
  CDI = 'CDI',
  CDD = 'CDD',
  FREELANCE = 'FREELANCE',
  INTERN = 'INTERN',
  PART_TIME = 'PART_TIME',
}

export enum WeekDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export enum AlertType {
  OVERALLOCATION = 'OVERALLOCATION',
  UNDERUTILIZATION = 'UNDERUTILIZATION',
  LEAVE_CONFLICT = 'LEAVE_CONFLICT',
  DEADLINE_RISK = 'DEADLINE_RISK',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface WorkContract {
  id: string;
  userId: string;
  type: ContractType;
  workingTimePercentage: number;
  weeklyHours: number;
  workingDays: WeekDay[];
  workingSchedule?: any;
  startDate: string;
  endDate?: string;
  paidLeaveDays: number;
  rttDays: number;
  isRemoteAllowed: boolean;
  maxRemoteDaysPerWeek?: number;
  hourlyRate?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface ResourceAllocation {
  id: string;
  userId: string;
  projectId: string;
  allocationPercentage: number;
  estimatedDays: number;
  startDate: string;
  endDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    status: string;
  };
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface DatePeriod {
  startDate: string;
  endDate: string;
  label?: string;
}

export interface CapacityAlert {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  suggestedActions?: string[];
  affectedProjects?: string[];
}

export interface UserCapacity {
  userId: string;
  period: DatePeriod;
  theoreticalDays: number;
  availableDays: number;
  plannedDays: number;
  remainingDays: number;
  overallocationDays: number;
  holidayDays: number;
  leaveDays: number;
  workingDaysInPeriod: number[];
  alerts: CapacityAlert[];
}

export interface UserCapacityCache {
  id: string;
  userId: string;
  periodStartDate: string;
  periodEndDate: string;
  periodLabel?: string;
  theoreticalDays: number;
  availableDays: number;
  plannedDays: number;
  remainingDays: number;
  overallocationDays: number;
  holidayDays: number;
  leaveDays: number;
  workingDaysInPeriod?: any;
  alerts?: any;
  calculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// DTOs
// ==========================================

export interface CreateContractDto {
  type: ContractType;
  workingTimePercentage: number;
  weeklyHours: number;
  workingDays: WeekDay[];
  workingSchedule?: any;
  startDate: string;
  endDate?: string;
  paidLeaveDays?: number;
  rttDays?: number;
  isRemoteAllowed?: boolean;
  maxRemoteDaysPerWeek?: number;
  hourlyRate?: number;
}

export interface UpdateContractDto {
  type?: ContractType;
  workingTimePercentage?: number;
  weeklyHours?: number;
  workingDays?: WeekDay[];
  workingSchedule?: any;
  startDate?: string;
  endDate?: string;
  paidLeaveDays?: number;
  rttDays?: number;
  isRemoteAllowed?: boolean;
  maxRemoteDaysPerWeek?: number;
  hourlyRate?: number;
}

export interface CreateAllocationDto {
  userId: string;
  projectId: string;
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface UpdateAllocationDto {
  allocationPercentage?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

// ==========================================
// API CLIENT
// ==========================================

export const capacityApi = {
  // ==========================================
  // CONTRACTS
  // ==========================================

  /**
   * Récupère le contrat actif d'un utilisateur
   */
  getUserContract: async (userId: string): Promise<WorkContract> => {
    return await apiClient.get<WorkContract>(`/capacity/contracts/${userId}`);
  },

  /**
   * Récupère tous les contrats d'un utilisateur
   */
  getUserContracts: async (userId: string): Promise<WorkContract[]> => {
    return await apiClient.get<WorkContract[]>(`/capacity/contracts/${userId}/all`);
  },

  /**
   * Récupère mon contrat actif
   */
  getMyContract: async (): Promise<WorkContract> => {
    return await apiClient.get<WorkContract>('/capacity/contracts/me/current');
  },

  /**
   * Crée un contrat pour un utilisateur
   */
  createContract: async (
    userId: string,
    dto: CreateContractDto
  ): Promise<WorkContract> => {
    return await apiClient.post<WorkContract>(
      `/capacity/contracts/${userId}`,
      dto
    );
  },

  /**
   * Met à jour un contrat
   */
  updateContract: async (
    contractId: string,
    dto: UpdateContractDto
  ): Promise<WorkContract> => {
    return await apiClient.put<WorkContract>(
      `/capacity/contracts/${contractId}`,
      dto
    );
  },

  /**
   * Supprime un contrat
   */
  deleteContract: async (contractId: string): Promise<void> => {
    return await apiClient.delete<void>(`/capacity/contracts/${contractId}`);
  },

  // ==========================================
  // ALLOCATIONS
  // ==========================================

  /**
   * Récupère les allocations d'un utilisateur
   */
  getUserAllocations: async (
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ResourceAllocation[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return await apiClient.get<ResourceAllocation[]>(
      `/capacity/allocations/user/${userId}?${params.toString()}`
    );
  },

  /**
   * Récupère les allocations d'un projet
   */
  getProjectAllocations: async (
    projectId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ResourceAllocation[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return await apiClient.get<ResourceAllocation[]>(
      `/capacity/allocations/project/${projectId}?${params.toString()}`
    );
  },

  /**
   * Récupère mes allocations
   */
  getMyAllocations: async (
    startDate?: string,
    endDate?: string
  ): Promise<ResourceAllocation[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return await apiClient.get<ResourceAllocation[]>(
      `/capacity/allocations/me?${params.toString()}`
    );
  },

  /**
   * Crée une allocation de ressource
   */
  createAllocation: async (
    dto: CreateAllocationDto
  ): Promise<ResourceAllocation> => {
    return await apiClient.post<ResourceAllocation>('/capacity/allocations', dto);
  },

  /**
   * Met à jour une allocation
   */
  updateAllocation: async (
    allocationId: string,
    dto: UpdateAllocationDto
  ): Promise<ResourceAllocation> => {
    return await apiClient.put<ResourceAllocation>(
      `/capacity/allocations/${allocationId}`,
      dto
    );
  },

  /**
   * Supprime une allocation
   */
  deleteAllocation: async (allocationId: string): Promise<void> => {
    return await apiClient.delete<void>(`/capacity/allocations/${allocationId}`);
  },

  // ==========================================
  // CALCUL DE CAPACITÉ
  // ==========================================

  /**
   * Calcule la capacité d'un utilisateur pour une période
   */
  calculateUserCapacity: async (
    userId: string,
    startDate: string,
    endDate: string,
    label?: string
  ): Promise<UserCapacity> => {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (label) params.append('label', label);

    return await apiClient.get<UserCapacity>(
      `/capacity/calculate/${userId}?${params.toString()}`
    );
  },

  /**
   * Calcule ma capacité pour une période
   */
  calculateMyCapacity: async (
    startDate: string,
    endDate: string,
    label?: string
  ): Promise<UserCapacity> => {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (label) params.append('label', label);

    return await apiClient.get<UserCapacity>(
      `/capacity/calculate/me/current?${params.toString()}`
    );
  },

  /**
   * Récupère la capacité en cache
   */
  getCachedCapacity: async (
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<UserCapacityCache | null> => {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);

    return await apiClient.get<UserCapacityCache | null>(
      `/capacity/cached/${userId}?${params.toString()}`
    );
  },

  /**
   * Génère des périodes prédéfinies
   */
  generatePeriods: async (
    type: 'month' | 'quarter' | 'year',
    year: number
  ): Promise<DatePeriod[]> => {
    const params = new URLSearchParams();
    params.append('type', type);
    params.append('year', year.toString());

    return await apiClient.get<DatePeriod[]>(
      `/capacity/periods?${params.toString()}`
    );
  },
};
