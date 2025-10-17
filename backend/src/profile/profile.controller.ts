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
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

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
   * Upload un avatar
   * Note: Upload vers le système de fichiers local
   * TODO: Migrer vers MinIO pour production
   */
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, callback) => {
          const userId = (req as any).user.id;
          const fileExtension = extname(file.originalname);
          const filename = `${userId}-${Date.now()}${fileExtension}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(
            new BadRequestException('Seuls les fichiers JPG, PNG et WebP sont autorisés'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Générer l'URL de l'avatar
    const avatarUrl = `/uploads/avatars/${file.filename}`;

    // Mettre à jour le profil avec la nouvelle URL
    return this.profileService.updateProfile(req.user.id, { avatarUrl });
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
