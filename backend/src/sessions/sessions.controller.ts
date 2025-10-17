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
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionsService.create(createSessionDto);
  }

  @Get('stats')
  getStats() {
    return this.sessionsService.getStats();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.sessionsService.findAll(userId);
  }

  @Get('user/:userId/active')
  findActiveByUser(@Param('userId') userId: string) {
    return this.sessionsService.findActiveByUser(userId);
  }

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.sessionsService.findAll(userId, isActiveBool);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
    return this.sessionsService.update(id, updateSessionDto);
  }

  @Patch(':id/activity')
  updateActivity(@Param('id') id: string) {
    return this.sessionsService.updateActivity(id);
  }

  @Patch(':id/invalidate')
  invalidate(@Param('id') id: string) {
    return this.sessionsService.invalidate(id);
  }

  @Delete('user/:userId/invalidate-all')
  invalidateAllUserSessions(@Param('userId') userId: string) {
    return this.sessionsService.invalidateAllUserSessions(userId);
  }

  @Delete('cleanup')
  cleanupExpiredSessions() {
    return this.sessionsService.cleanupExpiredSessions();
  }
}
