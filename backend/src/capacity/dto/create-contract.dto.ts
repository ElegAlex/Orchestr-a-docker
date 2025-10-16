import { IsEnum, IsInt, IsNumber, IsArray, IsDateString, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { ContractType, WeekDay } from '@prisma/client';

export class CreateContractDto {
  @IsEnum(ContractType)
  type: ContractType;

  @IsInt()
  @Min(1)
  @Max(100)
  workingTimePercentage: number;

  @IsNumber()
  @Min(1)
  @Max(70)
  weeklyHours: number;

  @IsArray()
  @IsEnum(WeekDay, { each: true })
  workingDays: WeekDay[];

  @IsOptional()
  workingSchedule?: any; // JSON

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  paidLeaveDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  rttDays?: number;

  @IsOptional()
  @IsBoolean()
  isRemoteAllowed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  maxRemoteDaysPerWeek?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;
}
