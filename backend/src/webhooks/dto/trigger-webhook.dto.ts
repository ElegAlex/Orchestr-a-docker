import { IsEnum, IsObject } from 'class-validator';
import { WebhookEvent } from '@prisma/client';

export class TriggerWebhookDto {
  @IsEnum(WebhookEvent)
  event: WebhookEvent;

  @IsObject()
  payload: Record<string, any>;
}
