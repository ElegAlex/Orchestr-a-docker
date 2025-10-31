import { useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook pour récupérer le filtre de département de l'utilisateur connecté
 *
 * Comportement :
 * - ADMIN et RESPONSABLE : retourne `null` (accès complet à tous les départements)
 * - Autres rôles : retourne le `departmentId` de l'utilisateur (isolation par département)
 *
 * Utilisation :
 * ```tsx
 * const departmentFilter = useDepartmentFilter();
 *
 * // Utiliser dans une requête API
 * const { data } = useQuery(['users', departmentFilter], () =>
 *   fetchUsers({ departmentId: departmentFilter })
 * );
 * ```
 *
 * @returns {string | null | undefined}
 *   - `null` : l'utilisateur a accès à tous les départements (ADMIN/RESPONSABLE)
 *   - `string` : l'utilisateur est limité à ce département
 *   - `undefined` : l'utilisateur n'est pas connecté ou n'a pas de département
 */
export const useDepartmentFilter = (): string | null | undefined => {
  const { user, isAuthenticated } = useAuth();

  return useMemo(() => {
    // Si l'utilisateur n'est pas connecté
    if (!isAuthenticated || !user) {
      return undefined;
    }

    // Normaliser le rôle en majuscules pour la comparaison (backend renvoie en majuscules)
    const role = user.role?.toUpperCase();

    // ADMIN et RESPONSABLE ont accès à tous les départements
    if (role === 'ADMIN' || role === 'RESPONSABLE') {
      return null;
    }

    // Autres rôles : retourner le departmentId
    return user.departmentId ?? undefined;
  }, [user, isAuthenticated]);
};

/**
 * Hook pour vérifier si l'utilisateur a accès cross-département
 *
 * @returns {boolean} true si l'utilisateur est ADMIN ou RESPONSABLE
 */
export const useHasCrossDepartmentAccess = (): boolean => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;

    const role = user.role?.toUpperCase();
    return role === 'ADMIN' || role === 'RESPONSABLE';
  }, [user]);
};
