import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
} from 'class-validator';

export enum TeleworkMode {
  REMOTE = 'REMOTE',
  ONSITE = 'ONSITE',
}

export class CreateTeleworkOverrideDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string; // ISO date string

  @IsEnum(TeleworkMode)
  @IsOptional()
  mode?: TeleworkMode;

  @IsString()
  @IsOptional()
  reason?: string;
}
