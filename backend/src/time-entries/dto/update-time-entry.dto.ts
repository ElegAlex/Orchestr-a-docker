import { PartialType } from '@nestjs/mapped-types';
import { CreateTimeEntryDto } from './create-time-entry.dto';

export class UpdateTimeEntryDto extends PartialType(CreateTimeEntryDto) {
  // Hérite tous les champs de CreateTimeEntryDto en optionnel
}
