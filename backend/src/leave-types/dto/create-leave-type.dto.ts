import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsHexColor, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaveTypeDto {
  @ApiProperty({ description: 'Nom du type de congé', example: 'CONGÉ PRINCIPAL' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Code unique du type', example: 'PAID_LEAVE' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Description du type de congé' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Nombre de jours par défaut', example: 25 })
  @IsNumber()
  @Min(0)
  @Max(365)
  defaultDays: number;

  @ApiPropertyOptional({ description: 'Couleur hexadécimale', example: '#1976d2', default: '#1976d2' })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Icône Material-UI', example: 'beach_access', default: 'event' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Nécessite une approbation', default: true })
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ description: 'Congé payé', default: true })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: 'Compte dans le solde', default: true })
  @IsBoolean()
  @IsOptional()
  countInBalance?: boolean;

  @ApiPropertyOptional({ description: 'Ordre de tri', default: 0 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
