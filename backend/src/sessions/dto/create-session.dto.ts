import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsDateString,
} from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsObject()
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
    isMobile?: boolean;
  };

  @IsDateString()
  @IsNotEmpty()
  expiresAt: string;
}
