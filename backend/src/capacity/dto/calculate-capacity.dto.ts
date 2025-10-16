import { IsDateString, IsString, IsOptional } from 'class-validator';

export class CalculateCapacityDto {
  @IsString()
  userId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  label?: string;
}
