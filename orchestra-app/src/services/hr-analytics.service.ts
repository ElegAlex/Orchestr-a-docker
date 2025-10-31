/**
 * HR Analytics Service - Version REST API
 *
 * Ce service a été migré de Firebase vers REST API.
 * Toute la logique de calcul statistique a été déplacée côté backend pour :
 * - Meilleures performances (calculs serveur)
 * - Cache côté serveur (PostgreSQL + Redis)
 * - Cohérence des données
 * - Scalabilité
 *
 * @see /home/alex/Documents/Repository/orchestr-a-docker/backend/src/analytics/analytics.service.ts
 * @see hr-analytics.service.ts.firebase-backup Pour l'ancienne version Firebase
 */

import { analyticsApi } from './api';
import type {
  HRMetricsResponse,
  LeavePatternAnalysisResponse,
  TeamCapacityForecastResponse,
  LeaveTypeStats,
  MonthlyLeaveStats,
  DepartmentLeaveStats,
  UserLeaveStats,
  SeasonalTrend,
  WeeklyPattern,
  DurationDistribution,
  DepartmentCapacity,
} from './api/analytics.api';

// Types pour la compatibilité avec l'ancien code
export interface DatePeriod {
  startDate: Date;
  endDate: Date;
  label?: string;
}

export interface HRMetrics {
  period: DatePeriod;
  totalEmployees: number;
  activeEmployees: number;
  totalLeaveRequests: number;
  totalLeaveDays: number;
  approvedLeaveRequests: number;
  rejectedLeaveRequests: number;
  pendingLeaveRequests: number;
  averageLeaveDaysPerEmployee: number;
  leaveTypeBreakdown: LeaveTypeStats[];
  monthlyTrends: MonthlyLeaveStats[];
  departmentStats: DepartmentLeaveStats[];
  topLeaveUsers: UserLeaveStats[];
  absenteeismRate: number;
  leaveApprovalRate: number;
  averageApprovalTime: number;
}

export interface LeavePatternAnalysis {
  seasonalTrends: SeasonalTrend[];
  weeklyPatterns: WeeklyPattern[];
  durationDistribution: DurationDistribution[];
}

export interface TeamCapacityForecast {
  period: DatePeriod;
  departments: DepartmentCapacity[];
}

// Ré-exporter les types pour la compatibilité
export type {
  LeaveTypeStats,
  MonthlyLeaveStats,
  DepartmentLeaveStats,
  UserLeaveStats,
  SeasonalTrend,
  WeeklyPattern,
  DurationDistribution,
  DepartmentCapacity,
};

class HRAnalyticsService {
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (compatibilité)

  // ========================================
  // MÉTRIQUES PRINCIPALES
  // ========================================

  /**
   * Calcule les métriques RH globales pour une période
   *
   * Tous les calculs sont effectués côté backend pour de meilleures performances.
   * Le cache est géré côté serveur (30 minutes).
   */
  async getHRMetrics(period: DatePeriod): Promise<HRMetrics> {
    try {
      const response = await analyticsApi.getHRMetrics({
        startDate: period.startDate.toISOString(),
        endDate: period.endDate.toISOString(),
        label: period.label,
      });

      // Convertir les dates string en Date objects
      return {
        ...response,
        period: {
          startDate: new Date(response.period.startDate),
          endDate: new Date(response.period.endDate),
          label: response.period.label,
        },
        topLeaveUsers: response.topLeaveUsers.map((user) => ({
          ...user,
          lastLeaveDate: user.lastLeaveDate ? new Date(user.lastLeaveDate) : null,
        })),
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques RH:', error);
      throw error;
    }
  }

  /**
   * Analyse les patterns de congés (saisonniers, hebdomadaires, durée)
   *
   * L'analyse est effectuée sur 1 an de données côté backend.
   */
  async analyzeLeavePatterns(period: DatePeriod): Promise<LeavePatternAnalysis> {
    try {
      const response = await analyticsApi.analyzeLeavePatterns({
        startDate: period.startDate.toISOString(),
        endDate: period.endDate.toISOString(),
      });

      return response;
    } catch (error) {
      console.error('Erreur lors de l\'analyse des patterns:', error);
      throw error;
    }
  }

  /**
   * Prédit la capacité d'équipe future basée sur les congés planifiés
   *
   * Calcule la capacité disponible par département en tenant compte
   * des absences planifiées (congés approuvés).
   */
  async forecastTeamCapacity(futurePeriod: DatePeriod): Promise<TeamCapacityForecast> {
    try {
      const response = await analyticsApi.forecastTeamCapacity({
        startDate: futurePeriod.startDate.toISOString(),
        endDate: futurePeriod.endDate.toISOString(),
        label: futurePeriod.label,
      });

      // Convertir les dates string en Date objects
      return {
        ...response,
        period: {
          startDate: new Date(response.period.startDate),
          endDate: new Date(response.period.endDate),
          label: response.period.label,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la prévision de capacité:', error);
      throw error;
    }
  }

  /**
   * Efface le cache (compatibilité - le cache est maintenant géré côté serveur)
   * @deprecated Le cache est maintenant géré côté backend
   */
  clearCache(): void {
    console.warn('⚠️ clearCache() est obsolète. Le cache est maintenant géré côté backend.');
    // Note: Pour effacer le cache serveur, utiliser analyticsApi.clearCache()
  }
}

export const hrAnalyticsService = new HRAnalyticsService();
