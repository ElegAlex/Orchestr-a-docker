import { IsEnum } from 'class-validator';
import { AnalyticsPeriod } from '@prisma/client';

export class GenerateReportDto {
  @IsEnum(AnalyticsPeriod)
  period: AnalyticsPeriod;
}
