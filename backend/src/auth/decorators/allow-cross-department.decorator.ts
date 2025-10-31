import { SetMetadata } from '@nestjs/common';

/**
 * Décorateur pour permettre l'accès cross-département
 *
 * Usage:
 * @AllowCrossDepartment()
 * @Get('/admin/all-users')
 * async getAllUsers() { ... }
 *
 * Par défaut, tous les endpoints filtrent par département de l'utilisateur connecté.
 * Ce décorateur permet de bypass cette restriction pour les endpoints admin/système.
 */
export const ALLOW_CROSS_DEPARTMENT_KEY = 'allowCrossDepartment';
export const AllowCrossDepartment = () => SetMetadata(ALLOW_CROSS_DEPARTMENT_KEY, true);
