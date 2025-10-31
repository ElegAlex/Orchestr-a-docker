import { IsNotEmpty, IsString, IsOptional, IsUUID, IsInt, IsObject, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour créer une entrée d'activité (log)
 */
export class CreateActivityDto {
  @ApiProperty({
    description: 'ID de l\'utilisateur qui a effectué l\'action',
    example: 'uuid-utilisateur',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'Action effectuée',
    example: 'CREATE_TASK',
  })
  @IsNotEmpty()
  @IsString()
  action: string;

  @ApiProperty({
    description: 'Type de ressource',
    example: 'task',
    required: false,
  })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiProperty({
    description: 'ID de la ressource',
    example: 'uuid-de-la-tache',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiProperty({
    description: 'ID du projet associé',
    example: 'uuid-du-projet',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({
    description: 'ID de la tâche associée',
    example: 'uuid-de-la-tache',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiProperty({
    description: 'Statut de l\'action',
    example: 'success',
    enum: ['success', 'error'],
  })
  @IsNotEmpty()
  @IsEnum(['success', 'error'])
  status: string;

  @ApiProperty({
    description: 'Message d\'erreur si status = error',
    example: 'Échec de la création',
    required: false,
  })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiProperty({
    description: 'Durée de l\'opération en millisecondes',
    example: 150,
    required: false,
  })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiProperty({
    description: 'Métadonnées additionnelles (IP, User-Agent, etc.)',
    example: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0...' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
