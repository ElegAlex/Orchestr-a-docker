import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAttachmentDto {
  @ApiPropertyOptional({ description: 'Description de la pièce jointe' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Tags associés', type: [String], example: ['Documentation', 'Test'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Fichier public ou privé', example: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
