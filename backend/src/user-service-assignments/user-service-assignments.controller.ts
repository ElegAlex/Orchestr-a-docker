import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserServiceAssignmentsService } from './user-service-assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('user-service-assignments')
@UseGuards(JwtAuthGuard)
export class UserServiceAssignmentsController {
  constructor(
    private readonly userServiceAssignmentsService: UserServiceAssignmentsService,
  ) {}

  @Post()
  create(@Body() createDto: CreateAssignmentDto) {
    return this.userServiceAssignmentsService.create(createDto);
  }

  @Get()
  findAll() {
    return this.userServiceAssignmentsService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.userServiceAssignmentsService.getStats();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.userServiceAssignmentsService.findByUser(userId);
  }

  @Get('service/:serviceId')
  findByService(@Param('serviceId') serviceId: string) {
    return this.userServiceAssignmentsService.findByService(serviceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userServiceAssignmentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateAssignmentDto) {
    return this.userServiceAssignmentsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userServiceAssignmentsService.remove(id);
  }
}
