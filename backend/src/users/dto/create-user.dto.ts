import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'alex@example.com',
    description: 'Email de l\'utilisateur',
  })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'L\'email est requis' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Mot de passe (min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre)',
    minLength: 8,
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
  })
  password: string;

  @ApiProperty({
    example: 'Alex',
    description: 'Prénom',
  })
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le prénom est requis' })
  firstName: string;

  @ApiProperty({
    example: 'Dupont',
    description: 'Nom de famille',
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  lastName: string;

  @ApiProperty({
    example: 'CONTRIBUTOR',
    description: 'Rôle de l\'utilisateur',
    enum: ['ADMIN', 'RESPONSABLE', 'MANAGER', 'TEAM_LEAD', 'CONTRIBUTOR', 'VIEWER'],
    required: false,
    default: 'CONTRIBUTOR',
  })
  @IsEnum(['ADMIN', 'RESPONSABLE', 'MANAGER', 'TEAM_LEAD', 'CONTRIBUTOR', 'VIEWER'], {
    message: 'Rôle invalide',
  })
  @IsOptional()
  role?: string;

  @ApiProperty({
    example: 'general-dept-default-001',
    description: 'ID du département',
    required: false,
  })
  @IsString({ message: 'ID de département invalide' })
  @IsOptional()
  departmentId?: string;
}
