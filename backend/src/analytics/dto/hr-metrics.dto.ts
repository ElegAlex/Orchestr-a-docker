import { IsDateString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

// ==========================================
// DTOs pour les requêtes HR Analytics
// ==========================================

export class HRMetricsFilterDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  label?: string;
}

export class LeavePatternFilterDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class TeamCapacityFilterDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

// ==========================================
// DTOs pour les réponses HR Analytics
// ==========================================

export class LeaveTypeStatsDto {
  type: string;
  count: number;
  totalDays: number;
  averageDuration: number;
  approvalRate: number;
}

export class MonthlyLeaveStatsDto {
  month: string;
  year: number;
  totalRequests: number;
  totalDays: number;
  approvedDays: number;
  rejectedDays: number;
}

export class DepartmentLeaveStatsDto {
  department: string;
  employeeCount: number;
  totalLeaveDays: number;
  averageLeaveDaysPerEmployee: number;
  absenteeismRate: number;
  mostPopularLeaveType: string;
}

export class UserLeaveStatsDto {
  userId: string;
  displayName: string;
  department: string;
  totalLeaveDays: number;
  leaveRequestsCount: number;
  averageRequestDuration: number;
  lastLeaveDate: Date | null;
}

export class HRMetricsDto {
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
  leaveTypeBreakdown: LeaveTypeStatsDto[];
  monthlyTrends: MonthlyLeaveStatsDto[];
  departmentStats: DepartmentLeaveStatsDto[];
  topLeaveUsers: UserLeaveStatsDto[];
  absenteeismRate: number;
  leaveApprovalRate: number;
  averageApprovalTime: number;
}

// ==========================================
// DTOs pour les patterns de congés
// ==========================================

export class SeasonalTrendDto {
  month: number;
  averageDays: number;
  requestCount: number;
  pattern: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class WeeklyPatternDto {
  dayOfWeek: number;
  frequency: number;
}

export class DurationDistributionDto {
  range: string;
  count: number;
  percentage: number;
}

export class LeavePatternAnalysisDto {
  seasonalTrends: SeasonalTrendDto[];
  weeklyPatterns: WeeklyPatternDto[];
  durationDistribution: DurationDistributionDto[];
}

// ==========================================
// DTOs pour la prévision de capacité
// ==========================================

export class DepartmentCapacityDto {
  name: string;
  totalCapacity: number;
  plannedAbsence: number;
  availableCapacity: number;
  utilizationRate: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
}

export class TeamCapacityForecastDto {
  period: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  departments: DepartmentCapacityDto[];
}
