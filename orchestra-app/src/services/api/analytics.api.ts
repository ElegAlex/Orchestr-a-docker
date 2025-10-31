import api from './client';
import { AnalyticsFilterDto } from './types';

// =======================================================================================
// TYPES
// =======================================================================================

export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  unit?: string;
  target?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
  category: 'project' | 'task' | 'resource' | 'financial' | 'quality' | 'workflow';
  updatedAt: Date;
}

export interface ProjectMetrics {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageTaskDuration: number;
  teamSize: number;
  lastUpdated: Date;
}

export interface ResourceMetrics {
  userId: string;
  userName: string;
  totalTasks: number;
  completedTasks: number;
  averageTaskDuration: number;
  totalHours: number;
  billableHours: number;
  utilization: number;
  productivity: number;
  lastActive: Date;
}

export interface ExecutiveReport {
  id: string;
  period: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  startDate: string;
  endDate: string;
  globalKPIs: {
    projectsCompleted: number;
    tasksCompleted: number;
    teamProductivity: number;
    budgetUtilization: number;
    clientSatisfaction: number;
    resourceUtilization: number;
  };
  departmentMetrics?: Record<string, any>;
  trends?: {
    projectDelivery: 'improving' | 'stable' | 'declining';
    teamPerformance: 'improving' | 'stable' | 'declining';
    budgetControl: 'improving' | 'stable' | 'declining';
  };
  alerts?: Array<{
    type: 'budget' | 'deadline' | 'resource' | 'quality';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    projectId?: string;
    userId?: string;
  }>;
  generatedAt: string;
  generatedBy: string;
}

// =======================================================================================
// API CALLS
// =======================================================================================

export const analyticsApi = {
  // ==========================================
  // KPIs
  // ==========================================

  async getGlobalKPIs(filters?: AnalyticsFilterDto): Promise<KPIMetric[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.projects) filters.projects.forEach(p => params.append('projects[]', p));
    if (filters?.users) filters.users.forEach(u => params.append('users[]', u));

    const response = await api.get<KPIMetric[]>(`/analytics/kpis?${params.toString()}`);
    return response.data;
  },

  // ==========================================
  // MÉTRIQUES PROJET
  // ==========================================

  async getProjectMetrics(
    projectId: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<ProjectMetrics> {
    const params = new URLSearchParams();
    if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange?.endDate) params.append('endDate', dateRange.endDate);

    const response = await api.get<ProjectMetrics>(
      `/analytics/projects/${projectId}?${params.toString()}`
    );
    return response.data;
  },

  // ==========================================
  // MÉTRIQUES RESSOURCE
  // ==========================================

  async getResourceMetrics(
    userId: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<ResourceMetrics> {
    const params = new URLSearchParams();
    if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange?.endDate) params.append('endDate', dateRange.endDate);

    const response = await api.get<ResourceMetrics>(
      `/analytics/resources/${userId}?${params.toString()}`
    );
    return response.data;
  },

  async getMyResourceMetrics(
    dateRange?: { startDate: string; endDate: string }
  ): Promise<ResourceMetrics> {
    const params = new URLSearchParams();
    if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange?.endDate) params.append('endDate', dateRange.endDate);

    const response = await api.get<ResourceMetrics>(
      `/analytics/resources/me/metrics?${params.toString()}`
    );
    return response.data;
  },

  // ==========================================
  // RAPPORTS EXÉCUTIFS
  // ==========================================

  async generateExecutiveReport(
    period: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'
  ): Promise<ExecutiveReport> {
    const response = await api.post<ExecutiveReport>('/analytics/reports', { period });
    return response.data;
  },

  async getReports(filters?: {
    period?: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
    startDate?: string;
    endDate?: string;
  }): Promise<ExecutiveReport[]> {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get<ExecutiveReport[]>(`/analytics/reports?${params.toString()}`);
    return response.data;
  },

  async getReportById(id: string): Promise<ExecutiveReport> {
    const response = await api.get<ExecutiveReport>(`/analytics/reports/${id}`);
    return response.data;
  },

  // ==========================================
  // CACHE
  // ==========================================

  async getCachedMetrics(key: string): Promise<any> {
    const response = await api.get(`/analytics/cache/${key}`);
    return response.data;
  },

  async clearCache(type?: string): Promise<{ message: string }> {
    const params = type ? `?type=${type}` : '';
    const response = await api.delete<{ message: string }>(`/analytics/cache${params}`);
    return response.data;
  },

  async cleanExpiredCache(): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>('/analytics/cache/expired');
    return response.data;
  },

  // ==========================================
  // HR ANALYTICS
  // ==========================================

  async getHRMetrics(filters: {
    startDate: string;
    endDate: string;
    label?: string;
  }): Promise<HRMetricsResponse> {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);
    if (filters.label) params.append('label', filters.label);

    const response = await api.get<HRMetricsResponse>(
      `/analytics/hr/metrics?${params.toString()}`
    );
    return response.data;
  },

  async analyzeLeavePatterns(filters: {
    startDate: string;
    endDate: string;
  }): Promise<LeavePatternAnalysisResponse> {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);

    const response = await api.get<LeavePatternAnalysisResponse>(
      `/analytics/hr/leave-patterns?${params.toString()}`
    );
    return response.data;
  },

  async forecastTeamCapacity(filters: {
    startDate: string;
    endDate: string;
    label?: string;
  }): Promise<TeamCapacityForecastResponse> {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);
    if (filters.label) params.append('label', filters.label);

    const response = await api.get<TeamCapacityForecastResponse>(
      `/analytics/hr/team-capacity-forecast?${params.toString()}`
    );
    return response.data;
  },
};

// ==========================================
// TYPES HR ANALYTICS
// ==========================================

export interface LeaveTypeStats {
  type: string;
  count: number;
  totalDays: number;
  averageDuration: number;
  approvalRate: number;
}

export interface MonthlyLeaveStats {
  month: string;
  year: number;
  totalRequests: number;
  totalDays: number;
  approvedDays: number;
  rejectedDays: number;
}

export interface DepartmentLeaveStats {
  department: string;
  employeeCount: number;
  totalLeaveDays: number;
  averageLeaveDaysPerEmployee: number;
  absenteeismRate: number;
  mostPopularLeaveType: string;
}

export interface UserLeaveStats {
  userId: string;
  displayName: string;
  department: string;
  totalLeaveDays: number;
  leaveRequestsCount: number;
  averageRequestDuration: number;
  lastLeaveDate: Date | null;
}

export interface HRMetricsResponse {
  period: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
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

export interface SeasonalTrend {
  month: number;
  averageDays: number;
  requestCount: number;
  pattern: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface WeeklyPattern {
  dayOfWeek: number;
  frequency: number;
}

export interface DurationDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface LeavePatternAnalysisResponse {
  seasonalTrends: SeasonalTrend[];
  weeklyPatterns: WeeklyPattern[];
  durationDistribution: DurationDistribution[];
}

export interface DepartmentCapacity {
  name: string;
  totalCapacity: number;
  plannedAbsence: number;
  availableCapacity: number;
  utilizationRate: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
}

export interface TeamCapacityForecastResponse {
  period: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  departments: DepartmentCapacity[];
};
