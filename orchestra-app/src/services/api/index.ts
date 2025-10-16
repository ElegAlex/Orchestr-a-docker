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
