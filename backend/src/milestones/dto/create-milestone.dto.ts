import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsArray,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MilestoneType {
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  RELEASE = 'RELEASE',
  REVIEW = 'REVIEW',
  DECISION = 'DECISION',
}

export enum ImpactLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateMilestoneDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @IsEnum(MilestoneType)
  @IsOptional()
  type?: MilestoneType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsBoolean()
  @IsOptional()
  followsTasks?: boolean;

  @IsBoolean()
  @IsOptional()
  isKeyDate?: boolean;

  @IsOptional()
  deliverables?: any; // JSON field

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  successCriteria?: string[];

  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  reviewers?: string[];

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  completionRate?: number;

  @IsOptional()
  dependsOn?: any; // JSON field

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  epicIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  taskIds?: string[];

  @IsBoolean()
  @IsOptional()
  validationRequired?: boolean;

  @IsEnum(ImpactLevel)
  @IsOptional()
  impact?: ImpactLevel;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  affectedTeams?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  icon?: string;

  @IsBoolean()
  @IsOptional()
  showOnRoadmap?: boolean;
}
