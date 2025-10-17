import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsObject,
  IsArray,
  IsInt,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TeleworkMode, ApprovalStatus } from '@prisma/client';

// ==================================================
// User Telework Profile DTOs
// ==================================================

export class WeeklyPatternDto {
  @IsEnum(['default', 'remote', 'office', 'off'])
  monday: string;

  @IsEnum(['default', 'remote', 'office', 'off'])
  tuesday: string;

  @IsEnum(['default', 'remote', 'office', 'off'])
  wednesday: string;

  @IsEnum(['default', 'remote', 'office', 'off'])
  thursday: string;

  @IsEnum(['default', 'remote', 'office', 'off'])
  friday: string;

  @IsEnum(['default', 'remote', 'office', 'off'])
  saturday: string;

  @IsEnum(['default', 'remote', 'office', 'off'])
  sunday: string;
}

export class ProfileConstraintsDto {
  @IsInt()
  @Min(0)
  @Max(7)
  maxRemoteDaysPerWeek: number;

  @IsInt()
  @Min(0)
  @Max(7)
  maxConsecutiveRemoteDays: number;

  @IsBoolean()
  requiresApproval: boolean;
}

export class CreateUserTeleworkProfileDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsEnum(TeleworkMode)
  @IsOptional()
  defaultMode?: TeleworkMode;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => WeeklyPatternDto)
  weeklyPattern?: WeeklyPatternDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileConstraintsDto)
  constraints?: ProfileConstraintsDto;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}

export class UpdateUserTeleworkProfileDto {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsEnum(TeleworkMode)
  @IsOptional()
  defaultMode?: TeleworkMode;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => WeeklyPatternDto)
  weeklyPattern?: WeeklyPatternDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileConstraintsDto)
  constraints?: ProfileConstraintsDto;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsNotEmpty()
  updatedBy: string;
}

// ==================================================
// Telework Override DTOs
// ==================================================

export class CreateTeleworkOverrideDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsDateString()
  date: string;

  @IsEnum(TeleworkMode)
  mode: TeleworkMode;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}

export class UpdateTeleworkOverrideDto {
  @IsEnum(TeleworkMode)
  @IsOptional()
  mode?: TeleworkMode;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  updatedBy?: string;
}

export class ApproveTeleworkOverrideDto {
  @IsString()
  @IsNotEmpty()
  approvedBy: string;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

// ==================================================
// Team Telework Rule DTOs
// ==================================================

export class WeeklyRecurrenceDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export class RecurrenceDto {
  @IsEnum(['weekly', 'specific_dates'])
  type: 'weekly' | 'specific_dates';

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => WeeklyRecurrenceDto)
  weeklyPattern?: WeeklyRecurrenceDto;

  @IsArray()
  @IsOptional()
  @IsDateString({}, { each: true })
  specificDates?: string[];
}

export class CreateTeamTeleworkRuleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  teamId?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsArray()
  @IsString({ each: true })
  affectedUserIds: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  exemptions?: string[];

  @IsEnum(TeleworkMode)
  requiredMode: TeleworkMode;

  @IsObject()
  @ValidateNested()
  @Type(() => RecurrenceDto)
  recurrence: RecurrenceDto;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}

export class UpdateTeamTeleworkRuleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  teamId?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  affectedUserIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  exemptions?: string[];

  @IsEnum(TeleworkMode)
  @IsOptional()
  requiredMode?: TeleworkMode;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrenceDto)
  recurrence?: RecurrenceDto;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  updatedBy?: string;
}

// ==================================================
// Query & Response DTOs
// ==================================================

export class GetOverridesQueryDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(ApprovalStatus)
  @IsOptional()
  status?: ApprovalStatus;
}

export class ValidateOverrideRequestDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsDateString()
  date: string;

  @IsEnum(TeleworkMode)
  requestedMode: TeleworkMode;
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
