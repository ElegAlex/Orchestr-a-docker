import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateLeaveTypeDto } from './create-leave-type.dto';

// On ne peut pas modifier le code (unique identifier)
export class UpdateLeaveTypeDto extends PartialType(
  OmitType(CreateLeaveTypeDto, ['code'] as const)
) {}
