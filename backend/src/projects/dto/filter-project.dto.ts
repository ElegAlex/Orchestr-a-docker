import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterProjectDto {
  @ApiProperty({
    example: 'renovation',
    description: 'Recherche par nom ou description',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Filtrer par statut',
    enum: ['DRAFT', 'ACTIVE', 'SUSPENDED', 'COMPLETED', 'CANCELLED'],
    required: false,
  })
  @IsEnum(['DRAFT', 'ACTIVE', 'SUSPENDED', 'COMPLETED', 'CANCELLED'])
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: 'HIGH',
    description: 'Filtrer par priorité',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: false,
  })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  @IsOptional()
  priority?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filtrer par chef de projet',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  managerId?: string;

  @ApiProperty({
    example: '2025-11-01',
    description: 'Filtrer par date de début (après cette date)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDateAfter?: string;

  @ApiProperty({
    example: '2026-12-31',
    description: 'Filtrer par date de fin (avant cette date)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dueDateBefore?: string;

  @ApiProperty({
    example: 'travaux',
    description: 'Filtrer par tag',
    required: false,
  })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiProperty({
    example: 1,
    description: 'Numéro de page (commence à 1)',
    required: false,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    example: 20,
    description: 'Nombre d\'éléments par page',
    required: false,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({
    example: 'createdAt',
    description: 'Champ de tri',
    enum: ['createdAt', 'updatedAt', 'name', 'startDate', 'dueDate', 'priority'],
    required: false,
    default: 'createdAt',
  })
  @IsEnum(['createdAt', 'updatedAt', 'name', 'startDate', 'dueDate', 'priority'])
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    example: 'desc',
    description: 'Ordre de tri',
    enum: ['asc', 'desc'],
    required: false,
    default: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
