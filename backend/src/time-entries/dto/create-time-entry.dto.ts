import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export enum TimeEntryType {
  TASK = 'TASK',
  MEETING = 'MEETING',
  SUPPORT = 'SUPPORT',
  DEVELOPMENT = 'DEVELOPMENT',
  OTHER = 'OTHER',
}

export class CreateTimeEntryDto {
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsUUID()
  @IsOptional()
  taskId?: string;

  @IsEnum(TimeEntryType)
  @IsOptional()
  type?: TimeEntryType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  date: string; // ISO date string

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  duration: number; // Durée en minutes

  @IsBoolean()
  @IsOptional()
  isBillable?: boolean;
}
