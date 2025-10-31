import { SetMetadata } from '@nestjs/common';

/**
 * Clé pour stocker les rôles requis
 */
export const ROLES_KEY = 'roles';

/**
 * Décorateur @Roles() pour spécifier les rôles autorisés
 *
 * Utilisation :
 * @Roles('ADMIN', 'MANAGER')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Delete(':id')
 * async delete() { ... }
 *
 * Seuls les utilisateurs avec le rôle ADMIN ou MANAGER
 * pourront accéder à cette route.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
