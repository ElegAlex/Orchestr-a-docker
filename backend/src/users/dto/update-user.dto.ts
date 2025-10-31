import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

/**
 * DTO pour mettre à jour un utilisateur
 *
 * Hérite de CreateUserDto mais :
 * - Tous les champs sont optionnels (PartialType)
 * - Le mot de passe est exclu (OmitType)
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @ApiProperty({
    example: true,
    description: 'État actif de l\'utilisateur',
    required: false,
  })
  @IsBoolean({ message: 'isActive doit être un booléen' })
  @IsOptional()
  isActive?: boolean;
}
