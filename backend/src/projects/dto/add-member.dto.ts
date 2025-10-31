import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID de l\'utilisateur à ajouter',
  })
  @IsUUID('4', { message: 'ID utilisateur invalide' })
  @IsNotEmpty({ message: 'L\'ID utilisateur est requis' })
  userId: string;

  @ApiProperty({
    example: 'Developer',
    description: 'Rôle de l\'utilisateur dans le projet',
  })
  @IsString({ message: 'Le rôle doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le rôle est requis' })
  role: string;
}
