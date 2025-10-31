import { IsNotEmpty, IsString, IsEnum, IsInt, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SchoolHolidayPeriod, SchoolHolidayZone } from '@prisma/client';

export class CreateSchoolHolidayDto {
  @ApiProperty({
    description: 'Nom du congé scolaire',
    example: 'Vacances d\'hiver 2025 - Zone A',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Période du congé scolaire',
    enum: SchoolHolidayPeriod,
    example: 'HIVER',
  })
  @IsNotEmpty()
  @IsEnum(SchoolHolidayPeriod)
  period: SchoolHolidayPeriod;

  @ApiProperty({
    description: 'Zone académique',
    enum: SchoolHolidayZone,
    example: 'A',
  })
  @IsNotEmpty()
  @IsEnum(SchoolHolidayZone)
  zone: SchoolHolidayZone;

  @ApiProperty({
    description: 'Date de début (ISO 8601)',
    example: '2025-02-08T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Date de fin (ISO 8601)',
    example: '2025-02-23T23:59:59.999Z',
  })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Année scolaire (2024 pour 2024-2025)',
    example: 2024,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(2020)
  year: number;
}
