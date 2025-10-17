import { PartialType } from '@nestjs/mapped-types';
import { CreateReportDto } from './create-report.dto';
import { IsEnum, IsOptional } from 'class-validator';

export enum ReportStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class UpdateReportDto extends PartialType(CreateReportDto) {
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;
}
