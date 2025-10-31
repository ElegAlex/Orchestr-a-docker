import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PushNotificationsService } from './push-notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendPushDto } from './dto/send-push.dto';

@Controller('push-notifications')
@UseGuards(JwtAuthGuard)
export class PushNotificationsController {
  constructor(private readonly pushNotificationsService: PushNotificationsService) {}

  /**
   * POST /api/push-notifications/register
   * Enregistrer un token push pour l'utilisateur connecté
   */
  @Post('register')
  async registerToken(@Request() req, @Body() dto: RegisterTokenDto) {
    return this.pushNotificationsService.registerToken(req.user.id, dto);
  }

  /**
   * POST /api/push-notifications/unregister
   * Désinscrire un token push
   */
  @Post('unregister')
  @HttpCode(HttpStatus.OK)
  async unregisterToken(@Request() req, @Body('token') token: string) {
    return this.pushNotificationsService.unregisterToken(req.user.id, token);
  }

  /**
   * GET /api/push-notifications/tokens
   * Obtenir tous les tokens actifs de l'utilisateur connecté
   */
  @Get('tokens')
  async getUserTokens(@Request() req) {
    return this.pushNotificationsService.getUserTokens(req.user.id);
  }

  /**
   * GET /api/push-notifications/tokens/:token
   * Obtenir un token spécifique
   */
  @Get('tokens/:token')
  async getToken(@Request() req, @Param('token') token: string) {
    return this.pushNotificationsService.getToken(req.user.id, token);
  }

  /**
   * POST /api/push-notifications/send
   * Envoyer une notification push à un utilisateur
   * Note: Nécessite Firebase Admin SDK configuré pour envoi réel
   */
  @Post('send')
  async sendPush(@Body() dto: SendPushDto) {
    return this.pushNotificationsService.sendPush(dto);
  }

  /**
   * GET /api/push-notifications/stats
   * Obtenir des statistiques sur les tokens push
   */
  @Get('stats')
  async getStats() {
    return this.pushNotificationsService.getStats();
  }

  /**
   * DELETE /api/push-notifications/cleanup
   * Nettoyer les tokens inactifs anciens
   */
  @Delete('cleanup')
  async cleanupInactiveTokens() {
    return this.pushNotificationsService.cleanupInactiveTokens();
  }
}
