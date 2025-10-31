import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from '../attachments/attachments.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  /**
   * GET /api/profile
   * Récupère le profil de l'utilisateur connecté
   */
  @Get()
  async getMyProfile(@Request() req) {
    return this.profileService.getMyProfile(req.user.id);
  }

  /**
   * PUT /api/profile
   * Met à jour le profil de l'utilisateur connecté
   */
  @Put()
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.id, updateProfileDto);
  }

  /**
   * POST /api/profile/password
   * Change le mot de passe de l'utilisateur
   */
  @Post('password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.profileService.changePassword(req.user.id, changePasswordDto);
  }

  /**
   * POST /api/profile/avatar
   * Upload un avatar vers MinIO
   * Utilise le service Attachments pour le stockage
   */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Validation du fichier
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      throw new BadRequestException('Seuls les fichiers JPG, PNG et WebP sont autorisés');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Le fichier est trop volumineux (max: 5MB)');
    }

    try {
      // Upload vers MinIO via AttachmentsService
      const attachment = await this.attachmentsService.uploadFile(
        file,
        {
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          description: 'Avatar utilisateur',
          tags: ['avatar', 'profile'],
          isPublic: false,
        },
        req.user.id,
      );

      // Générer URL signée pour l'avatar (7 jours)
      const avatarUrl = await this.attachmentsService.getDownloadUrl(attachment.id);

      // Mettre à jour le profil avec l'URL de l'avatar
      await this.profileService.updateProfile(req.user.id, { avatarUrl });

      return {
        message: 'Avatar uploadé avec succès',
        attachmentId: attachment.id,
        avatarUrl,
        user: await this.profileService.getMyProfile(req.user.id),
      };
    } catch (error) {
      throw new BadRequestException(`Erreur lors de l'upload: ${error.message}`);
    }
  }

  /**
   * DELETE /api/profile/avatar
   * Supprime l'avatar de l'utilisateur
   */
  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  async deleteAvatar(@Request() req) {
    return this.profileService.deleteAvatar(req.user.id);
  }

  /**
   * GET /api/profile/stats
   * Récupère les statistiques du profil
   */
  @Get('stats')
  async getProfileStats(@Request() req) {
    return this.profileService.getProfileStats(req.user.id);
  }
}
