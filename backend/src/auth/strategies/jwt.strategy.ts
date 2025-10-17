import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Stratégie JWT pour Passport
 *
 * Cette stratégie :
 * - Extrait le token JWT du header Authorization
 * - Vérifie la signature du token
 * - Valide le payload
 * - Récupère l'utilisateur depuis la base
 * - Injecte l'utilisateur dans request.user
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // Extraire le token du header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Ne pas ignorer l'expiration
      ignoreExpiration: false,

      // Secret pour vérifier la signature
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  /**
   * Valider le payload du token JWT
   *
   * Cette méthode est appelée automatiquement après que Passport
   * a vérifié la signature du token.
   *
   * @param payload - Contenu du token JWT décodé
   * @returns L'utilisateur qui sera injecté dans request.user
   */
  async validate(payload: any) {
    const { sub: userId, email, role } = payload;

    // Vérifier que l'utilisateur existe toujours
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
      },
    });

    // Si l'utilisateur n'existe plus ou est désactivé
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Utilisateur invalide ou désactivé');
    }

    // Cet objet sera injecté dans request.user
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      departmentId: user.departmentId,
    };
  }
}
