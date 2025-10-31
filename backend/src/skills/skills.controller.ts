import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { CreateSkillDto, SkillCategory } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { CreateUserSkillDto, SkillLevel } from './dto/create-user-skill.dto';
import { UpdateUserSkillDto } from './dto/update-user-skill.dto';
import { CreateTaskSkillDto } from './dto/create-task-skill.dto';
import { UpdateTaskSkillDto } from './dto/update-task-skill.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  // ==================== GESTION DES COMPÉTENCES ====================

  @Post()
  create(@Body() createSkillDto: CreateSkillDto) {
    return this.skillsService.create(createSkillDto);
  }

  @Get()
  findAll(@Query('category') category?: SkillCategory, @Query('isActive') isActive?: string) {
    const filters: any = {};
    if (category) filters.category = category;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    return this.skillsService.findAll(filters);
  }

  @Get('categories')
  getCategories() {
    return this.skillsService.getCategories();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
    return this.skillsService.update(id, updateSkillDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.skillsService.remove(id);
  }

  // ==================== COMPÉTENCES UTILISATEURS ====================

  @Post('users/:userId')
  addUserSkill(@Param('userId') userId: string, @Body() createUserSkillDto: CreateUserSkillDto) {
    return this.skillsService.addUserSkill(userId, createUserSkillDto);
  }

  @Get('users/:userId')
  getUserSkills(@Param('userId') userId: string) {
    return this.skillsService.getUserSkills(userId);
  }

  @Get('users/me/skills')
  getMySkills(@Request() req: any) {
    return this.skillsService.getUserSkills(req.user.id);
  }

  @Patch('users/:userId/:skillId')
  updateUserSkill(
    @Param('userId') userId: string,
    @Param('skillId') skillId: string,
    @Body() updateUserSkillDto: UpdateUserSkillDto,
  ) {
    return this.skillsService.updateUserSkill(userId, skillId, updateUserSkillDto);
  }

  @Delete('users/:userId/:skillId')
  removeUserSkill(@Param('userId') userId: string, @Param('skillId') skillId: string) {
    return this.skillsService.removeUserSkill(userId, skillId);
  }

  @Get('search/users')
  searchUsersBySkill(@Query('skillId') skillId: string, @Query('minimumLevel') minimumLevel?: SkillLevel) {
    return this.skillsService.searchUsersBySkill(skillId, minimumLevel);
  }

  // ==================== COMPÉTENCES TÂCHES ====================

  @Post('tasks/:taskId')
  addTaskSkill(@Param('taskId') taskId: string, @Body() createTaskSkillDto: CreateTaskSkillDto) {
    return this.skillsService.addTaskSkill(taskId, createTaskSkillDto);
  }

  @Get('tasks/:taskId')
  getTaskSkills(@Param('taskId') taskId: string) {
    return this.skillsService.getTaskSkills(taskId);
  }

  @Patch('tasks/:taskId/:skillId')
  updateTaskSkill(
    @Param('taskId') taskId: string,
    @Param('skillId') skillId: string,
    @Body() updateTaskSkillDto: UpdateTaskSkillDto,
  ) {
    return this.skillsService.updateTaskSkill(taskId, skillId, updateTaskSkillDto);
  }

  @Delete('tasks/:taskId/:skillId')
  removeTaskSkill(@Param('taskId') taskId: string, @Param('skillId') skillId: string) {
    return this.skillsService.removeTaskSkill(taskId, skillId);
  }

  // ==================== MÉTRIQUES & ANALYTICS ====================

  @Get('metrics/all')
  getMetrics() {
    return this.skillsService.getMetrics();
  }

  @Get('metrics/demand')
  getTopDemandSkills(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.skillsService.getTopDemandSkills(limitNum);
  }

  @Get('metrics/shortage')
  getShortageSkills() {
    return this.skillsService.getShortageSkills();
  }

  @Get('recommend/task/:taskId')
  recommendPeopleForTask(@Param('taskId') taskId: string) {
    return this.skillsService.recommendPeopleForTask(taskId);
  }

  // ==================== INITIALISATION ====================

  @Public()
  @Post('initialize')
  initializeDefaultSkills() {
    return this.skillsService.initializeDefaultSkills();
  }
}
