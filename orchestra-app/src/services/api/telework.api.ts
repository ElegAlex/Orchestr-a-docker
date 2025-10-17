import { apiClient } from './client';

// ==================================================
// Types & Enums
// ==================================================

export enum TeleworkMode {
  REMOTE = 'REMOTE',
  ONSITE = 'ONSITE',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface WeeklyPattern {
  monday: 'default' | 'remote' | 'office' | 'off';
  tuesday: 'default' | 'remote' | 'office' | 'off';
  wednesday: 'default' | 'remote' | 'office' | 'off';
  thursday: 'default' | 'remote' | 'office' | 'off';
  friday: 'default' | 'remote' | 'office' | 'off';
  saturday: 'default' | 'remote' | 'office' | 'off';
  sunday: 'default' | 'remote' | 'office' | 'off';
}

export interface ProfileConstraints {
  maxRemoteDaysPerWeek: number;
  maxConsecutiveRemoteDays: number;
  requiresApproval: boolean;
}

export interface UserTeleworkProfile {
  id: string;
  userId: string;
  displayName: string;
  defaultMode: TeleworkMode;
  weeklyPattern: WeeklyPattern;
  constraints: ProfileConstraints;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface TeleworkOverride {
  id: string;
  userId: string;
  date: string;
  mode: TeleworkMode;
  approvalStatus: ApprovalStatus;
  reason?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  expiresAt?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface WeeklyRecurrence {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export interface Recurrence {
  type: 'weekly' | 'specific_dates';
  weeklyPattern?: WeeklyRecurrence;
  specificDates?: string[];
}

export interface TeamTeleworkRule {
  id: string;
  name: string;
  description?: string;
  teamId?: string;
  departmentId?: string;
  affectedUserIds: string[];
  exemptions: string[];
  requiredMode: TeleworkMode;
  recurrence: Recurrence;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface TeleworkConflict {
  type: 'constraint_violation' | 'team_rule_conflict' | 'other';
  severity: 'error' | 'warning' | 'info';
  message: string;
  source: string;
  resolutionSuggestions: string[];
}

export interface ValidationResult {
  isValid: boolean;
  canProceed: boolean;
  reason?: string;
  conflicts: TeleworkConflict[];
  requiresApproval: boolean;
}

// ==================================================
// Request DTOs
// ==================================================

export interface CreateUserTeleworkProfileRequest {
  userId: string;
  displayName: string;
  defaultMode?: TeleworkMode;
  weeklyPattern?: WeeklyPattern;
  constraints?: ProfileConstraints;
  isActive?: boolean;
  createdBy: string;
}

export interface UpdateUserTeleworkProfileRequest {
  displayName?: string;
  defaultMode?: TeleworkMode;
  weeklyPattern?: WeeklyPattern;
  constraints?: ProfileConstraints;
  isActive?: boolean;
  updatedBy: string;
}

export interface CreateTeleworkOverrideRequest {
  userId: string;
  date: string; // ISO format
  mode: TeleworkMode;
  reason?: string;
  createdBy: string;
}

export interface UpdateTeleworkOverrideRequest {
  mode?: TeleworkMode;
  reason?: string;
  updatedBy?: string;
}

export interface ApproveTeleworkOverrideRequest {
  approvedBy: string;
  rejectionReason?: string;
}

export interface CreateTeamTeleworkRuleRequest {
  name: string;
  description?: string;
  teamId?: string;
  departmentId?: string;
  affectedUserIds: string[];
  exemptions?: string[];
  requiredMode: TeleworkMode;
  recurrence: Recurrence;
  isActive?: boolean;
  createdBy: string;
}

export interface UpdateTeamTeleworkRuleRequest {
  name?: string;
  description?: string;
  teamId?: string;
  departmentId?: string;
  affectedUserIds?: string[];
  exemptions?: string[];
  requiredMode?: TeleworkMode;
  recurrence?: Recurrence;
  isActive?: boolean;
  updatedBy?: string;
}

export interface GetOverridesQueryParams {
  userId?: string;
  startDate?: string;
  endDate?: string;
  status?: ApprovalStatus;
}

export interface ValidateOverrideRequest {
  userId: string;
  date: string;
  requestedMode: TeleworkMode;
}

// ==================================================
// API Client
// ==================================================

export const teleworkAPI = {
  // ==================== PROFILES ====================

  /**
   * Create a default telework profile for a user
   */
  createProfile: (data: CreateUserTeleworkProfileRequest): Promise<UserTeleworkProfile> =>
    apiClient.post('/telework/profiles', data).then((res) => res.data),

  /**
   * Get all telework profiles
   */
  getAllProfiles: (): Promise<UserTeleworkProfile[]> =>
    apiClient.get('/telework/profiles').then((res) => res.data),

  /**
   * Get a user's telework profile
   */
  getUserProfile: (userId: string): Promise<UserTeleworkProfile | null> =>
    apiClient.get(`/telework/profiles/${userId}`).then((res) => res.data),

  /**
   * Update a user's telework profile
   */
  updateUserProfile: (
    userId: string,
    data: UpdateUserTeleworkProfileRequest
  ): Promise<UserTeleworkProfile> =>
    apiClient.patch(`/telework/profiles/${userId}`, data).then((res) => res.data),

  /**
   * Get or create a user's telework profile
   */
  getOrCreateProfile: (
    userId: string,
    displayName: string,
    createdBy: string
  ): Promise<UserTeleworkProfile> =>
    apiClient
      .post(`/telework/profiles/${userId}/get-or-create`, { displayName, createdBy })
      .then((res) => res.data),

  // ==================== OVERRIDES ====================

  /**
   * Request a telework override
   */
  requestOverride: (data: CreateTeleworkOverrideRequest): Promise<TeleworkOverride> =>
    apiClient.post('/telework/overrides', data).then((res) => res.data),

  /**
   * Get telework overrides with optional filters
   */
  getOverrides: (params?: GetOverridesQueryParams): Promise<TeleworkOverride[]> =>
    apiClient.get('/telework/overrides', { params }).then((res) => res.data),

  /**
   * Get pending telework overrides
   */
  getPendingOverrides: (): Promise<TeleworkOverride[]> =>
    apiClient.get('/telework/overrides/pending').then((res) => res.data),

  /**
   * Get user's telework overrides
   */
  getUserOverrides: (
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<TeleworkOverride[]> =>
    apiClient
      .get(`/telework/overrides/user/${userId}`, {
        params: { startDate, endDate },
      })
      .then((res) => res.data),

  /**
   * Approve a telework override
   */
  approveOverride: (id: string, data: ApproveTeleworkOverrideRequest): Promise<TeleworkOverride> =>
    apiClient.patch(`/telework/overrides/${id}/approve`, data).then((res) => res.data),

  /**
   * Reject a telework override
   */
  rejectOverride: (id: string, data: ApproveTeleworkOverrideRequest): Promise<TeleworkOverride> =>
    apiClient.patch(`/telework/overrides/${id}/reject`, data).then((res) => res.data),

  /**
   * Delete a telework override
   */
  deleteOverride: (id: string): Promise<void> =>
    apiClient.delete(`/telework/overrides/${id}`).then((res) => res.data),

  /**
   * Validate a telework override request
   */
  validateOverrideRequest: (data: ValidateOverrideRequest): Promise<ValidationResult> =>
    apiClient.post('/telework/overrides/validate', data).then((res) => res.data),

  /**
   * Cleanup expired telework overrides
   */
  cleanupExpiredOverrides: (): Promise<{ deleted: number }> =>
    apiClient.delete('/telework/overrides/cleanup').then((res) => res.data),

  // ==================== TEAM RULES ====================

  /**
   * Create a team telework rule
   */
  createTeamRule: (data: CreateTeamTeleworkRuleRequest): Promise<TeamTeleworkRule> =>
    apiClient.post('/telework/team-rules', data).then((res) => res.data),

  /**
   * Get all team telework rules
   */
  getAllTeamRules: (): Promise<TeamTeleworkRule[]> =>
    apiClient.get('/telework/team-rules').then((res) => res.data),

  /**
   * Get team telework rules for a specific user
   */
  getTeamRulesForUser: (userId: string): Promise<TeamTeleworkRule[]> =>
    apiClient.get(`/telework/team-rules/user/${userId}`).then((res) => res.data),

  /**
   * Update a team telework rule
   */
  updateTeamRule: (id: string, data: UpdateTeamTeleworkRuleRequest): Promise<TeamTeleworkRule> =>
    apiClient.patch(`/telework/team-rules/${id}`, data).then((res) => res.data),

  /**
   * Delete a team telework rule
   */
  deleteTeamRule: (id: string): Promise<void> =>
    apiClient.delete(`/telework/team-rules/${id}`).then((res) => res.data),
};
