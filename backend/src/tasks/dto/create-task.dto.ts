import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
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
 * DTO pour créer une nouvelle tâche
 */
export class CreateTaskDto {
  @ApiProperty({
    description: 'Titre de la tâche',
    example: 'Réaliser le plan architectural',
  })
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le titre est requis' })
  title: string;

  @ApiPropertyOptional({
    description: 'Description détaillée de la tâche',
    example: 'Élaborer les plans détaillés du bâtiment selon les normes...',
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  description?: string;

  @ApiProperty({
    description: 'ID du projet auquel appartient la tâche',
    example: 'b387b5f3-6c78-440f-b500-f17776a177af',
  })
  @IsUUID('4', { message: 'L\'ID du projet doit être un UUID valide' })
  @IsNotEmpty({ message: 'L\'ID du projet est requis' })
  projectId: string;

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
    example: 'TODO',
    default: 'TODO',
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Statut invalide' })
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Priorité de la tâche',
    enum: Priority,
    example: 'HIGH',
    default: 'MEDIUM',
  })
  @IsOptional()
  @IsEnum(Priority, { message: 'Priorité invalide' })
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'Nombre d\'heures estimées',
    example: 8,
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: 'Les heures estimées doivent être un entier' })
  @Min(0, { message: 'Les heures estimées doivent être positives' })
  estimatedHours?: number;

  @ApiPropertyOptional({
    description: 'Nombre d\'heures réelles',
    example: 6,
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: 'Les heures réelles doivent être un entier' })
  @Min(0, { message: 'Les heures réelles doivent être positives' })
  actualHours?: number;

  @ApiPropertyOptional({
    description: 'Date d\'échéance de la tâche',
    example: '2026-01-15T23:59:59.999Z',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'La date d\'échéance doit être au format ISO 8601' })
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'IDs des tâches dépendantes (doit être terminées avant)',
    example: ['uuid1', 'uuid2'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Les dépendances doivent être un tableau' })
  @IsUUID('4', { each: true, message: 'Chaque dépendance doit être un UUID valide' })
  dependencies?: string[];

  @ApiPropertyOptional({
    description: 'Tags pour catégoriser la tâche',
    example: ['architecture', 'urgent'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Les tags doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque tag doit être une chaîne' })
  tags?: string[];
}
