import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'ID de la tâche associée',
    example: 'cd0024ea-1cca-46e4-8547-8e5ca87636a2',
  })
  @IsNotEmpty()
  @IsUUID()
  taskId: string;

  @ApiProperty({
    description: 'Contenu du commentaire',
    example: 'Tâche en cours, j\'ai terminé la phase de conception.',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  content: string;
}
