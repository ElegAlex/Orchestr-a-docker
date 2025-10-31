import { IsString, IsOptional, IsArray, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAttachmentDto {
  @ApiProperty({ description: 'Nom original du fichier', example: 'document.pdf' })
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @ApiProperty({ description: 'Type MIME du fichier', example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ description: 'Taille du fichier en bytes', example: 1024000 })
  @IsNotEmpty()
  fileSize: number;

  @ApiPropertyOptional({ description: 'ID de la tâche associée' })
  @IsString()
  @IsOptional()
  taskId?: string;

  @ApiPropertyOptional({ description: 'ID du projet associé' })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Description de la pièce jointe' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Tags associés', type: [String], example: ['Spécification', 'Design'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Fichier public ou privé', example: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
