import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  IsISO8601,
  IsArray,
  Min,
} from 'class-validator';
import { TaskStatus, Priority } from '@prisma/client';

/**
 * DTO pour mettre à jour une tâche
 * Tous les champs sont optionnels
 */
export class UpdateTaskDto {
  @ApiPropertyOptional({
    description: 'Titre de la tâche',
    example: 'Réaliser le plan architectural (modifié)',
  })
  @IsOptional()
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Description détaillée de la tâche',
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  description?: string;

  @ApiPropertyOptional({
    description: 'ID de l\'utilisateur assigné à la tâche',
    example: '502bce39-ae6c-4423-9a07-72dd93c5c544',
  })
  @IsOptional()
  @IsUUID('4', { message: 'L\'ID de l\'assigné doit être un UUID valide' })
  assigneeId?: string;

  @ApiPropertyOptional({
    description: 'Statut de la tâche',
    enum: TaskStatus,
    example: 'IN_PROGRESS',
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Statut invalide' })
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Priorité de la tâche',
    enum: Priority,
    example: 'CRITICAL',
  })
  @IsOptional()
  @IsEnum(Priority, { message: 'Priorité invalide' })
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'Nombre d\'heures estimées',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: 'Les heures estimées doivent être un entier' })
  @Min(0, { message: 'Les heures estimées doivent être positives' })
  estimatedHours?: number;

  @ApiPropertyOptional({
    description: 'Nombre d\'heures réelles',
    example: 8,
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: 'Les heures réelles doivent être un entier' })
  @Min(0, { message: 'Les heures réelles doivent être positives' })
  actualHours?: number;

  @ApiPropertyOptional({
    description: 'Date d\'échéance de la tâche',
    example: '2026-01-20T23:59:59.999Z',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'La date d\'échéance doit être au format ISO 8601' })
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Date de complétion de la tâche (auto-remplie quand status = COMPLETED)',
    example: '2026-01-18T14:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'La date de complétion doit être au format ISO 8601' })
  completedAt?: string;

  @ApiPropertyOptional({
    description: 'IDs des tâches dépendantes',
    example: ['uuid1', 'uuid2'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Les dépendances doivent être un tableau' })
  @IsUUID('4', { each: true, message: 'Chaque dépendance doit être un UUID valide' })
  dependencies?: string[];

  @ApiPropertyOptional({
    description: 'Tags pour catégoriser la tâche',
    example: ['architecture', 'critique'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Les tags doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque tag doit être une chaîne' })
  tags?: string[];
}
