/**
 * Utilitaires pour la gestion des avatars
 */

/**
 * Vérifie si une avatarUrl est valide (commence par http/https)
 * Empêche le browser de charger des IDs Firebase comme des URLs
 */
export function isValidAvatarUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
}

/**
 * Retourne l'avatarUrl seulement si elle est valide, sinon undefined
 * Utilisé pour éviter que des Firebase UIDs ne soient chargés comme des images
 */
export function getSafeAvatarUrl(url: string | undefined | null): string | undefined {
  return isValidAvatarUrl(url) ? url! : undefined;
}

/**
 * Génère les initiales à partir d'un prénom et nom
 */
export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.[0]?.toUpperCase() || '';
  const last = lastName?.[0]?.toUpperCase() || '';
  return first + last;
}
