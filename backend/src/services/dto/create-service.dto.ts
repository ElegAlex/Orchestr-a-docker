import { IsString, IsOptional, IsNumber, IsNotEmpty, Matches } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Color must be a valid hex color (e.g., #3B82F6)',
  })
  color: string;

  @IsOptional()
  @IsString()
  manager?: string; // userId

  @IsOptional()
  @IsNumber()
  budget?: number;
}
