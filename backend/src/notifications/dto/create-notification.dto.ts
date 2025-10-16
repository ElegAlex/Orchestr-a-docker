import { IsNotEmpty, IsEnum, IsString, IsOptional, IsUUID, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

/**
 * DTO pour créer une notification
 */
export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID de l\'utilisateur destinataire',
    example: 'uuid-utilisateur',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Type de notification',
    enum: NotificationType,
    example: 'TASK_ASSIGNED',
  })
  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Titre de la notification',
    example: 'Nouvelle tâche assignée',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Message de la notification',
    example: 'Vous avez été assigné à la tâche "Étude de faisabilité"',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Type de ressource liée (project, task, leave, etc.)',
    example: 'task',
    required: false,
  })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiProperty({
    description: 'ID de la ressource liée',
    example: 'uuid-de-la-tache',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiProperty({
    description: 'Métadonnées additionnelles (JSON)',
    example: { projectName: 'Rénovation Hôtel de Ville' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
