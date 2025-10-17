import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

/**
 * Contrôleur d'authentification
 *
 * Routes disponibles :
 * - POST /api/auth/register  : Inscription
 * - POST /api/auth/login     : Connexion
 * - POST /api/auth/refresh   : Rafraîchir le token
 * - GET  /api/auth/me        : Profil utilisateur (protégé)
 * - POST /api/auth/logout    : Déconnexion (protégé)
 */
@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Inscription d'un nouvel utilisateur
   *
   * Route publique (pas d'authentification requise)
   */
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Inscription d\'un nouvel utilisateur' })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès',
    schema: {
      example: {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'alex@example.com',
          firstName: 'Alex',
          lastName: 'Dupont',
          role: 'CONTRIBUTOR',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresIn: 900,
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Connexion d'un utilisateur
   *
   * Route publique (pas d'authentification requise)
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion d\'un utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie',
    schema: {
      example: {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'alex@example.com',
          firstName: 'Alex',
          lastName: 'Dupont',
          role: 'CONTRIBUTOR',
          lastLoginAt: '2025-10-11T14:30:00.000Z',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresIn: 900,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Email ou mot de passe incorrect' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Rafraîchir l'access token
   *
   * Route publique (le refresh token est dans le body)
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir l\'access token' })
  @ApiResponse({
    status: 200,
    description: 'Token rafraîchi avec succès',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresIn: 900,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou expiré' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  /**
   * Récupérer le profil de l'utilisateur connecté
   *
   * Route protégée (nécessite JWT)
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer le profil de l\'utilisateur connecté' })
  @ApiResponse({
    status: 200,
    description: 'Profil utilisateur',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'alex@example.com',
        firstName: 'Alex',
        lastName: 'Dupont',
        role: 'CONTRIBUTOR',
        isActive: true,
        departmentId: null,
        createdAt: '2025-10-01T10:00:00.000Z',
        updatedAt: '2025-10-11T14:30:00.000Z',
        lastLoginAt: '2025-10-11T14:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  /**
   * Déconnexion
   *
   * Route protégée (nécessite JWT)
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion' })
  @ApiResponse({
    status: 200,
    description: 'Déconnexion réussie',
    schema: {
      example: {
        message: 'Déconnexion réussie',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }
}
