import { IsDateString, IsOptional, IsString } from 'class-validator';

export class GetPresencesDto {
  @IsDateString()
  date: string; // ISO date string

  @IsString()
  @IsOptional()
  departmentId?: string; // Filter by department
}
