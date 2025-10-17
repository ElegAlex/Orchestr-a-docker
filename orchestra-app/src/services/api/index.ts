/**
 * Export centralisé de tous les services API
 *
 * Usage:
 * import { authAPI, usersAPI, projectsAPI, tasksAPI } from '@/services/api';
 */

export { apiClient } from './client';
export type { PaginatedResponse, APIError } from './client';

export { authAPI } from './auth.api';
export type {
  RegisterDto,
  LoginDto,
  AuthResponse,
  ChangePasswordDto,
} from './auth.api';

export { usersAPI } from './users.api';
export type {
  CreateUserDto,
  UpdateUserDto,
  UsersQueryParams,
  UserStats,
} from './users.api';

export { projectsAPI } from './projects.api';
export type {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectsQueryParams,
  ProjectMember,
  AddMemberDto,
  ProjectStats,
} from './projects.api';

export { tasksAPI } from './tasks.api';
export type {
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskDto,
  UpdateTaskDto,
  TasksQueryParams,
  TaskComment,
} from './tasks.api';

export { personalTodosAPI } from './personalTodos.api';
export type {
  PersonalTodo,
  CreatePersonalTodoRequest,
  UpdatePersonalTodoRequest,
  GetPersonalTodosParams,
} from './personalTodos.api';

export { epicsAPI } from './epics.api';
export type {
  Epic,
  EpicStatus,
  RiskLevel,
  CreateEpicRequest,
  UpdateEpicRequest,
  GetEpicsParams,
  PaginatedEpicsResponse,
} from './epics.api';

export { timeEntriesAPI } from './timeEntries.api';
export type {
  TimeEntry,
  TimeEntryType,
  CreateTimeEntryRequest,
  UpdateTimeEntryRequest,
  GetTimeEntriesParams,
  PaginatedTimeEntriesResponse,
  TimeEntryStats,
  ProjectTimeEntryStats,
} from './timeEntries.api';

export { activitiesAPI } from './activities.api';
export type {
  Activity,
  CreateActivityDto,
  ActivitiesQueryParams,
  ActivityStats,
} from './activities.api';

export { leavesAPI } from './leaves.api';
export type {
  Leave,
} from './leaves.api';

export { schoolHolidaysAPI } from './schoolHolidays.api';
export type {
  SchoolHoliday,
  CreateSchoolHolidayRequest,
  UpdateSchoolHolidayRequest,
  GetSchoolHolidaysParams,
  SchoolHolidayStats,
  CheckSchoolHolidayResponse,
} from './schoolHolidays.api';

export { holidaysAPI } from './holidays.api';
export type {
  Holiday,
  CreateHolidayRequest,
  UpdateHolidayRequest,
  GetHolidaysParams,
  HolidayStats,
  CheckHolidayResponse,
  WorkingDaysResponse,
  EasterDateResponse,
} from './holidays.api';

export { settingsAPI } from './settings.api';
export type {
  SystemSettings,
  UpdateSettingsRequest,
  MaintenanceStatus,
  SystemStats,
  EmailTestResult,
} from './settings.api';

export { webhooksAPI } from './webhooks.api';
export type {
  Webhook,
  WebhookEvent,
  WebhookStatus,
  WebhookLog,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  WebhookStats,
} from './webhooks.api';

export { notificationsAPI } from './notifications.api';
export type {
  Notification,
  NotificationType,
  CreateNotificationRequest,
  NotificationFilters,
} from './notifications.api';

export { analyticsApi } from './analytics.api';
export type {
  GlobalKPIs,
  ProjectMetrics,
  ResourceMetrics,
  AnalyticsReport,
  AnalyticsPeriod,
  GenerateReportDto,
  AnalyticsFilterDto,
} from './analytics.api';

export { capacityApi } from './capacity.api';
export type {
  ContractType,
  WeekDay,
  AlertType,
  AlertSeverity,
  WorkContract,
  ResourceAllocation,
  DatePeriod,
  CapacityAlert,
  UserCapacity,
  UserCapacityCache,
  CreateContractDto,
  UpdateContractDto,
  CreateAllocationDto,
  UpdateAllocationDto,
} from './capacity.api';

export { skillsAPI } from './skills.api';
export type {
  Skill,
  SkillCategory,
  SkillLevel,
  UserSkill,
  TaskSkill,
  CreateSkillRequest,
  UpdateSkillRequest,
  CreateUserSkillRequest,
  UpdateUserSkillRequest,
  CreateTaskSkillRequest,
  UpdateTaskSkillRequest,
  SkillMetrics,
  TopDemandSkill,
  ShortageSkill,
  PersonRecommendation,
  CategoryWithSkills,
  InitializeSkillsResponse,
} from './skills.api';

export { reportsAPI } from './reports.api';
export type {
  Report,
  ReportType,
  ExportFormat,
  ReportStatus,
  ReportTemplate,
  CreateReportRequest,
  UpdateReportRequest,
  GetReportsParams,
  CleanupResult,
} from './reports.api';

export { teleworkAPI } from './telework.api';
export type {
  TeleworkMode,
  ApprovalStatus,
  WeeklyPattern,
  ProfileConstraints,
  UserTeleworkProfile,
  TeleworkOverride,
  WeeklyRecurrence,
  Recurrence,
  TeamTeleworkRule,
  TeleworkConflict,
  ValidationResult,
  CreateUserTeleworkProfileRequest,
  UpdateUserTeleworkProfileRequest,
  CreateTeleworkOverrideRequest,
  UpdateTeleworkOverrideRequest,
  ApproveTeleworkOverrideRequest,
  CreateTeamTeleworkRuleRequest,
  UpdateTeamTeleworkRuleRequest,
  GetOverridesQueryParams,
  ValidateOverrideRequest,
} from './telework.api';
