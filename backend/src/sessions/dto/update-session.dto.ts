import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';
import { CreateSessionDto } from './create-session.dto';

export class UpdateSessionDto extends PartialType(CreateSessionDto) {
  @IsOptional()
  @IsDateString()
  lastActivityAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
