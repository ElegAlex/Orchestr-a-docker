import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsArray, IsUUID } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Nom du document',
    example: 'Plan architecture.pdf',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'ID du projet associé (optionnel)',
    example: 'b387b5f3-6c78-440f-b500-f17776a177af',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({
    description: 'ID de la tâche associée (optionnel)',
    example: 'cd0024ea-1cca-46e4-8547-8e5ca87636a2',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiProperty({
    description: 'Le document est-il public ?',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: 'Tags du document',
    example: ['important', 'architecture'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Métadonnées supplémentaires (JSON)',
    example: { category: 'technical', version: '1.0' },
    required: false,
  })
  @IsOptional()
  metadata?: any;
}
