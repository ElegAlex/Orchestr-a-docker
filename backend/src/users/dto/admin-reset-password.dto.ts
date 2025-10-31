import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Matches, MinLength } from 'class-validator';

/**
 * DTO pour la réinitialisation de mot de passe par un administrateur
 * Permet à un admin de changer le password d'un utilisateur sans connaître l'ancien
 */
export class AdminResetPasswordDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de l\'utilisateur dont on veut réinitialiser le mot de passe',
  })
  @IsUUID('4', { message: 'L\'ID utilisateur doit être un UUID valide' })
  @IsNotEmpty({ message: 'L\'ID utilisateur est requis' })
  userId: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: 'Nouveau mot de passe (min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre)',
    minLength: 8,
  })
  @IsString({ message: 'Le nouveau mot de passe doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nouveau mot de passe est requis' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
  })
  newPassword: string;
}
