import { IsString, IsUrl, IsArray, IsOptional, IsObject, IsBoolean, MaxLength } from 'class-validator';
import { WebhookEvent } from '@prisma/client';

export class CreateWebhookDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsArray()
  events: WebhookEvent[];

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsObject()
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
