import { IsNotEmpty, IsString, IsEnum, IsBoolean, IsOptional, IsDateString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HolidayType } from '@prisma/client';

export class CreateHolidayDto {
  @ApiProperty({ description: 'Nom du jour férié', example: 'Jour de l\'An' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Date du jour férié (ISO 8601)', example: '2025-01-01T00:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Type de jour férié', enum: HolidayType, example: 'FIXED' })
  @IsNotEmpty()
  @IsEnum(HolidayType)
  type: HolidayType;

  @ApiProperty({ description: 'Jour férié national', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isNational?: boolean;

  @ApiProperty({ description: 'Régions spécifiques', example: ['Alsace', 'Moselle'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

  @ApiProperty({ description: 'Override en jour ouvré', example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isWorkingDay?: boolean;
}
