import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, IsInt, Min, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FilterUserDto {
  @ApiProperty({
    example: 'alex',
    description: 'Recherche par email, prénom ou nom',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    example: 'CONTRIBUTOR',
    description: 'Filtrer par rôle',
    enum: ['ADMIN', 'RESPONSABLE', 'MANAGER', 'TEAM_LEAD', 'CONTRIBUTOR', 'VIEWER'],
    required: false,
  })
  @IsEnum(['ADMIN', 'RESPONSABLE', 'MANAGER', 'TEAM_LEAD', 'CONTRIBUTOR', 'VIEWER'])
  @IsOptional()
  role?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filtrer par département',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  departmentId?: string;

  @ApiProperty({
    example: true,
    description: 'Filtrer par état actif',
    required: false,
  })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: 1,
    description: 'Numéro de page (commence à 1)',
    required: false,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    example: 20,
    description: 'Nombre d\'éléments par page',
    required: false,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({
    example: 'createdAt',
    description: 'Champ de tri',
    enum: ['createdAt', 'updatedAt', 'email', 'firstName', 'lastName'],
    required: false,
    default: 'createdAt',
  })
  @IsEnum(['createdAt', 'updatedAt', 'email', 'firstName', 'lastName'])
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    example: 'desc',
    description: 'Ordre de tri',
    enum: ['asc', 'desc'],
    required: false,
    default: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
