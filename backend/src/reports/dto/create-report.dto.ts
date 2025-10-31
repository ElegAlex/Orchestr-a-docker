import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsBoolean,
  IsDateString,
  IsArray,
  IsNotEmpty,
} from 'class-validator';

export enum ReportType {
  PROJECT_SUMMARY = 'PROJECT_SUMMARY',
  TASK_ANALYSIS = 'TASK_ANALYSIS',
  RESOURCE_UTILIZATION = 'RESOURCE_UTILIZATION',
  LEAVE_SUMMARY = 'LEAVE_SUMMARY',
  SKILL_MATRIX = 'SKILL_MATRIX',
  CUSTOM = 'CUSTOM',
}

export enum ExportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  JSON = 'JSON',
}

export enum ReportTemplate {
  STANDARD = 'STANDARD',
  EXECUTIVE = 'EXECUTIVE',
  DETAILED = 'DETAILED',
  CUSTOM = 'CUSTOM',
}

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ReportType)
  type: ReportType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  parameters: Record<string, any>;

  @IsEnum(ReportTemplate)
  @IsOptional()
  template?: ReportTemplate;

  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sharedWith?: string[];

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
