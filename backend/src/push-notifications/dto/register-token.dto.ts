import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { DeviceType } from '@prisma/client';

export class RegisterTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsEnum(DeviceType)
  @IsOptional()
  deviceType?: DeviceType;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
