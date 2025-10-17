import { PartialType } from '@nestjs/swagger';
import { CreateSchoolHolidayDto } from './create-school-holiday.dto';

export class UpdateSchoolHolidayDto extends PartialType(CreateSchoolHolidayDto) {}
