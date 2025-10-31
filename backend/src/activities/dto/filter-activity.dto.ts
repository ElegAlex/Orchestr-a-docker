import { IsOptional, IsUUID, IsString, IsInt, Min, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour filtrer et paginer les activités
 */
export class FilterActivityDto {
  @ApiProperty({
    description: 'ID de l\'utilisateur',
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'Filtrer par département (via l\'utilisateur)',
    example: 'general-dept-default-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({
    description: 'Action effectuée',
    example: 'CREATE_TASK',
    required: false,
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiProperty({
    description: 'Type de ressource',
    example: 'task',
    required: false,
  })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiProperty({
    description: 'ID du projet',
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({
    description: 'ID de la tâche',
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiProperty({
    description: 'Statut',
    example: 'success',
    enum: ['success', 'error'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['success', 'error'])
  status?: string;

  @ApiProperty({
    description: 'Date de début (ISO 8601)',
    example: '2025-10-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  timestampFrom?: string;

  @ApiProperty({
    description: 'Date de fin (ISO 8601)',
    example: '2025-10-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  timestampTo?: string;

  @ApiProperty({
    description: 'Recherche dans action et resource',
    example: 'CREATE',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Numéro de page',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Nombre d\'éléments par page',
    example: 50,
    default: 50,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @ApiProperty({
    description: 'Champ de tri',
    example: 'timestamp',
    default: 'timestamp',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'timestamp';

  @ApiProperty({
    description: 'Ordre de tri',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false,
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
