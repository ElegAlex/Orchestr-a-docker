import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { TriggerWebhookDto } from './dto/trigger-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * POST /api/webhooks
   * Créer un nouveau webhook
   */
  @Post()
  async create(@Request() req, @Body() createWebhookDto: CreateWebhookDto) {
    return this.webhooksService.create(req.user.id, createWebhookDto);
  }

  /**
   * GET /api/webhooks
   * Récupérer tous les webhooks de l'utilisateur
   */
  @Get()
  async findAll(@Request() req) {
    return this.webhooksService.findAll(req.user.id);
  }

  /**
   * GET /api/webhooks/:id
   * Récupérer un webhook par ID
   */
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.webhooksService.findOne(id, req.user.id);
  }

  /**
   * PUT /api/webhooks/:id
   * Mettre à jour un webhook
   */
  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ) {
    return this.webhooksService.update(id, req.user.id, updateWebhookDto);
  }

  /**
   * DELETE /api/webhooks/:id
   * Supprimer un webhook
   */
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.webhooksService.remove(id, req.user.id);
  }

  /**
   * GET /api/webhooks/:id/logs
   * Récupérer les logs d'un webhook
   */
  @Get(':id/logs')
  async getLogs(
    @Request() req,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 50;
    return this.webhooksService.getLogs(id, req.user.id, limitNumber);
  }

  /**
   * GET /api/webhooks/:id/stats
   * Récupérer les statistiques d'un webhook
   */
  @Get(':id/stats')
  async getStats(@Request() req, @Param('id') id: string) {
    return this.webhooksService.getStats(id, req.user.id);
  }

  /**
   * POST /api/webhooks/:id/trigger
   * Déclencher manuellement un webhook (pour tests)
   */
  @Post(':id/trigger')
  async trigger(
    @Request() req,
    @Param('id') id: string,
    @Body() triggerDto: TriggerWebhookDto,
  ) {
    return this.webhooksService.trigger(id, req.user.id, triggerDto);
  }

  /**
   * POST /api/webhooks/:id/test
   * Tester un webhook avec un payload d'exemple
   */
  @Post(':id/test')
  async test(@Request() req, @Param('id') id: string) {
    const testPayload = {
      event: 'PROJECT_CREATED',
      payload: {
        test: true,
        message: 'Ceci est un test',
        timestamp: new Date().toISOString(),
      },
    };

    return this.webhooksService.trigger(id, req.user.id, testPayload as any);
  }
}
