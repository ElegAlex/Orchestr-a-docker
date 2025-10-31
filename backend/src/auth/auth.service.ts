import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

/**
 * Service d'authentification
 *
 * Gère :
 * - L'inscription des utilisateurs
 * - La connexion (login)
 * - La génération des tokens JWT (access + refresh)
 * - Le rafraîchissement des tokens
 * - La déconnexion
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Inscription d'un nouvel utilisateur
   *
   * 1. Vérifie que l'email n'existe pas déjà
   * 2. Hash le mot de passe avec bcrypt
   * 3. Crée l'utilisateur en base
   * 4. Génère les tokens JWT
   */
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, role } = registerDto;

    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hash du mot de passe (10 rounds de salt)
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    // 🔒 Département obligatoire : nouveau user assigné au département "Général" par défaut
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: (role as any) || 'CONTRIBUTOR',
        departmentId: 'general-dept-default-001', // Département "Général" par défaut
      },
    });

    // Générer les tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Connexion d'un utilisateur
   *
   * 1. Vérifie que l'utilisateur existe
   * 2. Vérifie le mot de passe
   * 3. Met à jour lastLoginAt
   * 4. Génère les tokens JWT
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Trouver l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier que l'utilisateur est actif
    if (!user.isActive) {
      throw new UnauthorizedException('Ce compte est désactivé');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Mettre à jour la date de dernière connexion
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Générer les tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lastLoginAt: new Date(),
      },
      ...tokens,
    };
  }

  /**
   * Rafraîchir l'access token avec un refresh token
   *
   * 1. Vérifie le refresh token
   * 2. Récupère l'utilisateur
   * 3. Génère de nouveaux tokens
   */
  async refreshTokens(refreshToken: string) {
    try {
      // Vérifier le refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Vérifier que l'utilisateur existe et est actif
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Utilisateur invalide');
      }

      // Générer de nouveaux tokens
      return this.generateTokens(user.id, user.email, user.role);
    } catch (error) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }

  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    return user;
  }

  /**
   * Déconnexion (côté client : supprimer les tokens)
   * Dans une implémentation complète, on stockerait les refresh tokens
   * en base pour pouvoir les révoquer ici.
   */
  async logout(userId: string) {
    // TODO: Révoquer le refresh token en base si on implémente un système de révocation
    return { message: 'Déconnexion réussie' };
  }

  /**
   * Générer les tokens JWT (access + refresh)
   *
   * Access token : courte durée (15 min)
   * Refresh token : longue durée (30 jours)
   */
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = {
      sub: userId,
      email,
      role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      // Access token (15 minutes)
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION') || '15m',
      }),
      // Refresh token (30 jours)
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '30d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes en secondes
    };
  }
}
