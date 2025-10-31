/**
 * Utilitaires pour la conversion des statuts entre backend et frontend
 *
 * Backend PostgreSQL utilise des enums en MAJUSCULES (ACTIVE, DRAFT, etc.)
 * Frontend React utilise des types en minuscules (active, draft, etc.)
 */

/**
 * Mapper status backend → frontend (MAJUSCULES → minuscules)
 */
export const mapStatusFromBackend = (status: string): string => {
  const statusMap: Record<string, string> = {
    'DRAFT': 'draft',
    'ACTIVE': 'active',
    'SUSPENDED': 'on_hold',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled'
  };
  return statusMap[status] || status.toLowerCase();
};

/**
 * Mapper status frontend → backend (minuscules → MAJUSCULES)
 */
export const mapStatusToBackend = (status: string): string => {
  const statusMap: Record<string, string> = {
    'draft': 'DRAFT',
    'planning': 'DRAFT', // 'planning' n'existe pas en backend, mapper vers DRAFT
    'active': 'ACTIVE',
    'on_hold': 'SUSPENDED',
    'completed': 'COMPLETED',
    'cancelled': 'CANCELLED'
  };
  return statusMap[status] || status.toUpperCase();
};

/**
 * Normaliser un projet du backend pour le frontend
 */
export const normalizeProjectFromBackend = <T extends { status: string }>(project: T): T => {
  return {
    ...project,
    status: mapStatusFromBackend(project.status)
  };
};

/**
 * Normaliser une liste de projets du backend pour le frontend
 */
export const normalizeProjectsFromBackend = <T extends { status: string }>(projects: T[]): T[] => {
  return projects.map(normalizeProjectFromBackend);
};
