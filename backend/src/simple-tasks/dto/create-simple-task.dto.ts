import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum SimpleTaskPriority {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
}

export class TimeSlotDto {
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'timeSlot.start must be in format HH:mm' })
  start: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'timeSlot.end must be in format HH:mm' })
  end: string;
}

export class CreateSimpleTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  date: string; // ISO date string

  @ValidateNested()
  @Type(() => TimeSlotDto)
  timeSlot: TimeSlotDto;

  @IsEnum(SimpleTaskPriority)
  priority: SimpleTaskPriority;

  @IsString()
  @IsNotEmpty()
  assignedTo: string; // User ID

  @IsString()
  @IsNotEmpty()
  createdBy: string; // User ID
}

export class CreateMultipleSimpleTasksDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ValidateNested()
  @Type(() => TimeSlotDto)
  timeSlot: TimeSlotDto;

  @IsEnum(SimpleTaskPriority)
  priority: SimpleTaskPriority;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  userIds: string[]; // Multiple user IDs

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
