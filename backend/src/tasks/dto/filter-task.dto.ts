import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsISO8601,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus, Priority } from '@prisma/client';

/**
 * DTO pour filtrer et paginer les tâches
 */
export class FilterTaskDto {
  @ApiPropertyOptional({
    description: 'Recherche textuelle (titre, description)',
    example: 'architecture',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par projet',
    example: 'b387b5f3-6c78-440f-b500-f17776a177af',
  })
  @IsOptional()
  @IsUUID('all', { message: 'L\'ID du projet doit être un UUID valide' })
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par utilisateur assigné',
    example: '502bce39-ae6c-4423-9a07-72dd93c5c544',
  })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par statut',
    enum: TaskStatus,
    example: 'IN_PROGRESS',
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Statut invalide' })
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Filtrer par priorité',
    enum: Priority,
    example: 'HIGH',
  })
  @IsOptional()
  @IsEnum(Priority, { message: 'Priorité invalide' })
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'Date d\'échéance après (inclus)',
    example: '2025-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'La date doit être au format ISO 8601' })
  dueDateAfter?: string;

  @ApiPropertyOptional({
    description: 'Date d\'échéance avant (inclus)',
    example: '2026-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'La date doit être au format ISO 8601' })
  dueDateBefore?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par tag',
    example: 'urgent',
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    description: 'Tâches terminées ou non',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  completed?: boolean;

  @ApiPropertyOptional({
    description: 'Tâches avec ou sans assigné',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  unassigned?: boolean;

  @ApiPropertyOptional({
    description: 'Numéro de page',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Champ pour le tri',
    example: 'dueDate',
    default: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Ordre du tri',
    example: 'asc',
    default: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'L\'ordre doit être asc ou desc' })
  sortOrder?: 'asc' | 'desc';
}
