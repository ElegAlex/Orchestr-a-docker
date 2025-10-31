import { IsString, IsInt, IsDateString, IsOptional, Min, Max } from 'class-validator';

export class CreateAllocationDto {
  @IsString()
  userId: string;

  @IsString()
  projectId: string;

  @IsInt()
  @Min(1)
  @Max(100)
  allocationPercentage: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
