import { analyticsApi, KPIMetric, ProjectMetrics, ResourceMetrics, ExecutiveReport } from './api/analytics.api';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subWeeks,
  subDays,
  format,
  differenceInDays,
  differenceInHours
} from 'date-fns';
import { fr } from 'date-fns/locale';

// =======================================================================================
// TYPES & INTERFACES (re-exported from API)
// =======================================================================================

export type { KPIMetric, ProjectMetrics, ResourceMetrics, ExecutiveReport };

export interface BurndownPoint {
  date: Date;
  remaining: number;
  planned: number;
}

export interface VelocityPoint {
  sprint: string;
  completed: number;
  planned: number;
}

export interface WorkloadPoint {
  date: Date;
  workload: number;
  capacity: number;
}

export interface TrendAnalysis {
  productivity: TrendPoint[];
  velocity: TrendPoint[];
  evolution: TrendPoint[];
}

export interface TrendPoint {
  date?: string;
  period?: string;
  sprint?: string;
  project?: string;
  value: number;
  label?: string;
}

export interface AnomalyDetection {
  id: string;
  type: 'spike' | 'drop' | 'trend_change' | 'outlier';
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  detectedAt: Date;
}

export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  projects?: string[];
  users?: string[];
  teams?: string[];
  categories?: string[];
  tags?: string[];
}

// =======================================================================================
// SERVICE PRINCIPAL - MIGRÉ VERS API REST
// =======================================================================================

class AnalyticsService {
  // =======================================================================================
  // CALCUL DES MÉTRIQUES (via API REST)
  // =======================================================================================

  /**
   * Calculer les KPIs globaux
   */
  async calculateGlobalKPIs(filter?: AnalyticsFilter): Promise<KPIMetric[]> {
    try {
      const apiFilter = {
        startDate: filter?.startDate?.toISOString(),
        endDate: filter?.endDate?.toISOString(),
        projects: filter?.projects,
        users: filter?.users,
      };

      const kpis = await analyticsApi.getGlobalKPIs(apiFilter);

      // Convert date strings to Date objects
      return kpis.map(kpi => ({
        ...kpi,
        updatedAt: new Date(kpi.updatedAt)
      }));
    } catch (error) {
      console.error('Error calculating global KPIs:', error);
      return [];
    }
  }

  /**
   * Calculer les métriques détaillées d'un projet
   */
  async getProjectMetrics(projectId: string, dateRange?: { start: Date; end: Date }): Promise<ProjectMetrics | null> {
    try {
      const apiDateRange = dateRange ? {
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      } : undefined;

      const metrics = await analyticsApi.getProjectMetrics(projectId, apiDateRange);

      // Convert date strings to Date objects
      return {
        ...metrics,
        lastUpdated: new Date(metrics.lastUpdated)
      };
    } catch (error) {
      console.error('Error getting project metrics:', error);
      return null;
    }
  }

  /**
   * Calculer les métriques d'une ressource
   */
  async getResourceMetrics(userId: string, dateRange?: { start: Date; end: Date }): Promise<ResourceMetrics | null> {
    try {
      const apiDateRange = dateRange ? {
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      } : undefined;

      const metrics = await analyticsApi.getResourceMetrics(userId, apiDateRange);

      // Convert date strings to Date objects
      return {
        ...metrics,
        lastActive: new Date(metrics.lastActive)
      };
    } catch (error) {
      console.error('Error getting resource metrics:', error);
      return null;
    }
  }

  /**
   * Calculer les métriques de l'utilisateur courant
   */
  async getMyResourceMetrics(dateRange?: { start: Date; end: Date }): Promise<ResourceMetrics | null> {
    try {
      const apiDateRange = dateRange ? {
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      } : undefined;

      const metrics = await analyticsApi.getMyResourceMetrics(apiDateRange);

      // Convert date strings to Date objects
      return {
        ...metrics,
        lastActive: new Date(metrics.lastActive)
      };
    } catch (error) {
      console.error('Error getting my resource metrics:', error);
      return null;
    }
  }

  // =======================================================================================
  // GÉNÉRATION DE RAPPORTS (via API REST)
  // =======================================================================================

  /**
   * Générer un rapport exécutif
   */
  async generateExecutiveReport(
    period: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR',
    userId?: string
  ): Promise<ExecutiveReport> {
    try {
      const report = await analyticsApi.generateExecutiveReport(period);

      // Convert date strings to Date objects
      return {
        ...report,
        startDate: new Date(report.startDate),
        endDate: new Date(report.endDate),
        generatedAt: new Date(report.generatedAt)
      };
    } catch (error) {
      console.error('Error generating executive report:', error);
      throw error;
    }
  }

  /**
   * Récupérer la liste des rapports
   */
  async getReports(filters?: {
    period?: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
    startDate?: Date;
    endDate?: Date;
  }): Promise<ExecutiveReport[]> {
    try {
      const apiFilters = {
        period: filters?.period,
        startDate: filters?.startDate?.toISOString(),
        endDate: filters?.endDate?.toISOString()
      };

      const reports = await analyticsApi.getReports(apiFilters);

      // Convert date strings to Date objects
      return reports.map(report => ({
        ...report,
        startDate: new Date(report.startDate),
        endDate: new Date(report.endDate),
        generatedAt: new Date(report.generatedAt)
      }));
    } catch (error) {
      console.error('Error getting reports:', error);
      return [];
    }
  }

  /**
   * Récupérer un rapport par ID
   */
  async getReportById(id: string): Promise<ExecutiveReport | null> {
    try {
      const report = await analyticsApi.getReportById(id);

      // Convert date strings to Date objects
      return {
        ...report,
        startDate: new Date(report.startDate),
        endDate: new Date(report.endDate),
        generatedAt: new Date(report.generatedAt)
      };
    } catch (error) {
      console.error('Error getting report by ID:', error);
      return null;
    }
  }

  // =======================================================================================
  // CACHE ET PERFORMANCE (via API REST)
  // =======================================================================================

  /**
   * Récupérer des métriques depuis le cache
   */
  async getCachedMetrics(key: string): Promise<any | null> {
    try {
      return await analyticsApi.getCachedMetrics(key);
    } catch (error) {
      console.error('Error getting cached metrics:', error);
      return null;
    }
  }

  /**
   * Vider le cache
   */
  async clearCache(type?: string): Promise<void> {
    try {
      await analyticsApi.clearCache(type);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Nettoyer le cache expiré
   */
  async cleanExpiredCache(): Promise<void> {
    try {
      await analyticsApi.cleanExpiredCache();
    } catch (error) {
      console.error('Error cleaning expired cache:', error);
    }
  }

  // =======================================================================================
  // MÉTHODES AVANCÉES (CLIENT-SIDE UNIQUEMENT)
  // =======================================================================================

  /**
   * Analyse de tendances avec filtres
   * NOTE: Cette méthode reste côté client car elle génère des données simulées
   */
  async getTrendAnalysis(filters?: AnalyticsFilter): Promise<TrendAnalysis> {
    try {
      // Productivité dans le temps
      const productivityTrend = await this.generateProductivityTrend(filters);

      // Vélocité des équipes
      const velocityTrend = await this.generateVelocityTrend(filters);

      // Évolution globale des métriques
      const evolutionTrend = await this.generateEvolutionTrend(filters);

      return {
        productivity: productivityTrend,
        velocity: velocityTrend,
        evolution: evolutionTrend
      };
    } catch (error) {
      console.error('Error generating trend analysis:', error);
      return {
        productivity: [],
        velocity: [],
        evolution: []
      };
    }
  }

  /**
   * Détection d'anomalies
   * NOTE: Cette méthode reste côté client car elle génère des données simulées
   */
  async detectAnomalies(filters?: AnalyticsFilter): Promise<AnomalyDetection[]> {
    try {
      const anomalies: AnomalyDetection[] = [];

      // Récupérer les données historiques
      const historicalData = await this.getHistoricalMetrics(filters);
      const currentData = await this.getCurrentMetrics(filters);

      // Analyser chaque métrique
      for (const metric of ['productivity', 'completion_rate', 'velocity', 'budget_utilization']) {
        const historical = historicalData[metric] || [];
        const current = currentData[metric] || 0;

        if (historical.length < 5) continue; // Pas assez de données

        const anomaly = this.detectMetricAnomaly(metric, historical, current);
        if (anomaly) {
          anomalies.push(anomaly);
        }
      }

      return anomalies.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return [];
    }
  }

  /**
   * Export complet des données analytiques
   */
  async exportAnalyticsData(filters?: AnalyticsFilter): Promise<any> {
    try {
      const [
        kpis,
        trends
      ] = await Promise.all([
        this.calculateGlobalKPIs(filters),
        this.getTrendAnalysis(filters)
      ]);

      // Générer un rapport du mois en cours
      const report = await this.generateExecutiveReport('MONTH');

      return {
        exportDate: new Date().toISOString(),
        filters: filters || {},
        data: {
          kpis,
          trends,
          executiveReport: report
        },
        metadata: {
          totalKPIs: kpis.length,
          generatedBy: 'Orchestr\'A Analytics Engine',
          version: '2.0.0' // Version migré à REST API
        }
      };
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      throw error;
    }
  }

  // =======================================================================================
  // MÉTHODES PRIVÉES POUR LES ANALYTICS AVANCÉS (CLIENT-SIDE)
  // =======================================================================================

  private async generateProductivityTrend(filters?: AnalyticsFilter): Promise<TrendPoint[]> {
    // Simulation de données de productivité
    const startDate = filters?.startDate || subMonths(new Date(), 1);
    const endDate = filters?.endDate || new Date();

    const points: TrendPoint[] = [];
    const days = differenceInDays(endDate, startDate);

    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const baseValue = 75 + Math.sin(i * 0.2) * 10; // Tendance avec variations
      const noise = (Math.random() - 0.5) * 5;

      points.push({
        date: format(date, 'yyyy-MM-dd'),
        value: Math.max(0, Math.min(100, baseValue + noise)),
        label: 'Productivité'
      });
    }

    return points;
  }

  private async generateVelocityTrend(filters?: AnalyticsFilter): Promise<TrendPoint[]> {
    // Simulation de données de vélocité par sprint
    const sprints = ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Sprint 5', 'Sprint 6'];

    return sprints.map((sprint, index) => ({
      sprint,
      value: 20 + Math.random() * 15 + index * 2, // Tendance croissante
      label: 'Points de story'
    }));
  }

  private async generateEvolutionTrend(filters?: AnalyticsFilter): Promise<TrendPoint[]> {
    // Évolution des métriques principales
    const periods = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
    const metrics = ['Projets', 'Tâches', 'Équipe', 'Budget'];

    const points: TrendPoint[] = [];

    periods.forEach(period => {
      metrics.forEach(metric => {
        points.push({
          period,
          value: 50 + Math.random() * 40,
          label: metric
        });
      });
    });

    return points;
  }

  private async getHistoricalMetrics(filters?: AnalyticsFilter): Promise<{[key: string]: number[]}> {
    // Simulation de données historiques
    return {
      productivity: [72, 75, 78, 76, 79, 82, 80, 85],
      completion_rate: [85, 87, 89, 88, 91, 93, 90, 92],
      velocity: [18, 20, 22, 19, 24, 26, 25, 28],
      budget_utilization: [95, 92, 89, 91, 87, 85, 88, 86]
    };
  }

  private async getCurrentMetrics(filters?: AnalyticsFilter): Promise<{[key: string]: number}> {
    // Simulation de données actuelles
    return {
      productivity: 95, // Augmentation significative
      completion_rate: 94,
      velocity: 32, // Augmentation notable
      budget_utilization: 78 // Diminution notable
    };
  }

  private detectMetricAnomaly(metricName: string, historical: number[], current: number): AnomalyDetection | null {
    const mean = historical.reduce((sum, val) => sum + val, 0) / historical.length;
    const variance = historical.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historical.length;
    const stdDev = Math.sqrt(variance);

    const deviation = Math.abs(current - mean);
    const zScore = stdDev > 0 ? deviation / stdDev : 0;

    // Seuils de détection
    if (zScore > 3) {
      return {
        id: `anomaly_${metricName}_${Date.now()}`,
        type: current > mean ? 'spike' : 'drop',
        metric: metricName,
        value: current,
        expectedValue: mean,
        deviation,
        severity: zScore > 4 ? 'critical' : 'high',
        message: `${metricName} présente une anomalie ${current > mean ? 'positive' : 'négative'} significative (${deviation.toFixed(1)} points d'écart)`,
        detectedAt: new Date()
      };
    } else if (zScore > 2) {
      return {
        id: `anomaly_${metricName}_${Date.now()}`,
        type: 'outlier',
        metric: metricName,
        value: current,
        expectedValue: mean,
        deviation,
        severity: 'medium',
        message: `${metricName} sort légèrement des valeurs habituelles (${deviation.toFixed(1)} points d'écart)`,
        detectedAt: new Date()
      };
    }

    return null;
  }
}

export const analyticsService = new AnalyticsService();
