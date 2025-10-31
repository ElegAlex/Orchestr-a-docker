import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SimpleTasksService } from './simple-tasks.service';
import { CreateSimpleTaskDto, CreateMultipleSimpleTasksDto } from './dto/create-simple-task.dto';
import { UpdateSimpleTaskDto } from './dto/update-simple-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('simple-tasks')
@UseGuards(JwtAuthGuard)
export class SimpleTasksController {
  constructor(private readonly simpleTasksService: SimpleTasksService) {}

  @Post()
  create(@Body() createSimpleTaskDto: CreateSimpleTaskDto) {
    return this.simpleTasksService.create(createSimpleTaskDto);
  }

  @Post('bulk')
  createMultiple(@Body() createMultipleDto: CreateMultipleSimpleTasksDto) {
    return this.simpleTasksService.createMultiple(createMultipleDto);
  }

  @Get()
  findAll() {
    return this.simpleTasksService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.simpleTasksService.findByUser(userId);
  }

  @Get('user/:userId/date-range')
  findByUserAndDateRange(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.simpleTasksService.findByUserAndDateRange(userId, startDate, endDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.simpleTasksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSimpleTaskDto: UpdateSimpleTaskDto) {
    return this.simpleTasksService.update(id, updateSimpleTaskDto);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(@Param('id') id: string, @Body('status') status: 'TODO' | 'IN_PROGRESS' | 'DONE') {
    return this.simpleTasksService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser('id') currentUserId: string) {
    return this.simpleTasksService.remove(id, currentUserId);
  }
}
