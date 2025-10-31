import { PartialType } from '@nestjs/mapped-types';
import { CreateMilestoneDto } from './create-milestone.dto';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';

export enum MilestoneStatus {
  UPCOMING = 'UPCOMING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DELAYED = 'DELAYED',
  CANCELLED = 'CANCELLED',
}

export class UpdateMilestoneDto extends PartialType(CreateMilestoneDto) {
  @IsEnum(MilestoneStatus)
  @IsOptional()
  status?: MilestoneStatus;
}

export class ValidateMilestoneDto {
  @IsString()
  @IsOptional()
  validationNotes?: string;
}

export class UpdateStatusDto {
  @IsEnum(MilestoneStatus)
  status: MilestoneStatus;
}
