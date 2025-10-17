import { SetMetadata } from '@nestjs/common';

/**
 * Clé pour marquer une route comme publique
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Décorateur @Public() pour marquer une route comme publique
 *
 * Utilisation :
 * @Public()
 * @Get('public-data')
 * async getPublicData() { ... }
 *
 * Cette route sera accessible sans authentification,
 * même si JwtAuthGuard est appliqué globalement.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
