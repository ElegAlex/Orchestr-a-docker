import { IsString, IsNotEmpty, IsEnum, IsInt, IsOptional, IsArray, IsDateString } from 'class-validator';

export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT',
}

export class CreateUserSkillDto {
  @IsString()
  @IsNotEmpty()
  skillId: string;

  @IsEnum(SkillLevel)
  level: SkillLevel;

  @IsInt()
  @IsOptional()
  yearsOfExperience?: number;

  @IsDateString()
  @IsOptional()
  lastUsedAt?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}
