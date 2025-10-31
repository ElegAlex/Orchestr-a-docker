import { ApiProperty } from '@nestjs/swagger';

export class AttachmentStatsDto {
  @ApiProperty({ description: 'Nombre total de fichiers' })
  totalFiles: number;

  @ApiProperty({ description: 'Taille totale en bytes' })
  totalSize: number;

  @ApiProperty({ description: 'Répartition par type de fichier', type: 'object' })
  fileTypes: Record<string, number>;

  @ApiProperty({ description: 'Uploads récents (dernières 24h)' })
  recentUploads: number;
}
