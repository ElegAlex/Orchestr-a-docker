import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({
    description: 'Nouveau contenu du commentaire',
    example: 'Tâche en cours, j\'ai terminé la phase de conception et testé le prototype.',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  content: string;
}
