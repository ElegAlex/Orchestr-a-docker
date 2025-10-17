import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum SkillCategory {
  TECHNICAL = 'TECHNICAL',
  MANAGEMENT = 'MANAGEMENT',
  DOMAIN = 'DOMAIN',
  METHODOLOGY = 'METHODOLOGY',
  SOFT = 'SOFT',
  LANGUAGE = 'LANGUAGE',
}

export class CreateSkillDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(SkillCategory)
  category: SkillCategory;

  @IsString()
  @IsOptional()
  description?: string;
}
