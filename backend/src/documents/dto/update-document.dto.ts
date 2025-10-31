import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsArray, IsUUID } from 'class-validator';

export class UpdateDocumentDto {
  @ApiPropertyOptional({
    description: 'Nouveau nom du document',
    example: 'Plan architecture v2.pdf',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'ID du projet associé',
    example: 'b387b5f3-6c78-440f-b500-f17776a177af',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'ID de la tâche associée',
    example: 'cd0024ea-1cca-46e4-8547-8e5ca87636a2',
  })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiPropertyOptional({
    description: 'Le document est-il public ?',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Tags du document',
    example: ['important', 'architecture', 'approuvé'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Métadonnées supplémentaires (JSON)',
    example: { category: 'technical', version: '2.0', status: 'approved' },
  })
  @IsOptional()
  metadata?: any;
}
