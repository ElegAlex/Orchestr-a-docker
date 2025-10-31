import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsUUID, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterDocumentDto {
  @ApiPropertyOptional({
    description: 'Recherche par nom de document',
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
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par tâche',
    example: 'cd0024ea-1cca-46e4-8547-8e5ca87636a2',
  })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par uploader',
    example: '502bce39-ae6c-4423-9a07-72dd93c5c544',
  })
  @IsOptional()
  @IsUUID()
  uploadedBy?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par type de fichier',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par tag',
    example: 'important',
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par visibilité publique',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Page actuelle (pagination)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Champ de tri',
    example: 'uploadedAt',
    default: 'uploadedAt',
    enum: ['name', 'uploadedAt', 'size', 'type'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['name', 'uploadedAt', 'size', 'type'])
  sortBy?: string = 'uploadedAt';

  @ApiPropertyOptional({
    description: 'Ordre de tri',
    example: 'desc',
    default: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
