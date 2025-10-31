/**
 * Session Service - Version REST API (Simplified)
 *
 * Ce service a été migré de Firebase vers REST API.
 * Architecture simplifiée: Le suivi des sessions est géré par le backend
 * en complément du système JWT (access token + refresh token).
 *
 * @see /home/alex/Documents/Repository/orchestr-a-docker/backend/src/sessions
 * @see session.service.ts.firebase-backup Pour l'ancienne version Firebase
 */

import { sessionsApi, Session, CreateSessionDto } from './api/sessions.api';

/**
 * Détecte les informations du device/browser de l'utilisateur
 */
function detectDeviceInfo() {
  const ua = navigator.userAgent;

  // Détection du navigateur
  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  // Détection de l'OS
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';

  // Détection du type de device
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
  const device = isMobile ? 'Mobile' : 'Desktop';

  return {
    browser,
    os,
    device,
    isMobile,
  };
}

export class SessionService {
  private currentSessionId: string | null = null;
  private activityUpdateInterval: NodeJS.Timeout | null = null;

  /**
   * Crée une nouvelle session utilisateur (audit logging)
   * Note: Cette méthode complète le système JWT existant
   */
  async createSession(userId: string): Promise<Session> {
    try {
      const deviceInfo = detectDeviceInfo();

      // Session expire dans 24h (complémentaire au JWT refresh token de 30j)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const dto: CreateSessionDto = {
        userId,
        userAgent: navigator.userAgent,
        ipAddress: undefined, // Backend can detect from request
        deviceInfo,
        expiresAt,
      };

      const session = await sessionsApi.create(dto);
      this.currentSessionId = session.id;

      // Démarrer le suivi d'activité (mise à jour toutes les 5 minutes)
      this.startActivityTracking();

      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Démarre le suivi automatique d'activité
   */
  private startActivityTracking() {
    // Arrêter le suivi existant s'il existe
    this.stopActivityTracking();

    // Mettre à jour l'activité toutes les 5 minutes
    this.activityUpdateInterval = setInterval(() => {
      if (this.currentSessionId) {
        this.updateActivity().catch(err =>
          console.error('Error updating activity:', err)
        );
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Arrête le suivi automatique d'activité
   */
  private stopActivityTracking() {
    if (this.activityUpdateInterval) {
      clearInterval(this.activityUpdateInterval);
      this.activityUpdateInterval = null;
    }
  }

  /**
   * Met à jour l'activité de la session courante
   */
  async updateActivity(): Promise<void> {
    if (!this.currentSessionId) {
      return;
    }

    try {
      await sessionsApi.updateActivity(this.currentSessionId);
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  /**
   * Récupère les sessions actives d'un utilisateur
   */
  async getActiveSessions(userId: string): Promise<Session[]> {
    try {
      return await sessionsApi.getActiveByUser(userId);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      return [];
    }
  }

  /**
   * Récupère toutes les sessions d'un utilisateur
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    try {
      return await sessionsApi.getByUser(userId);
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
  }

  /**
   * Invalide la session courante (déconnexion)
   */
  async invalidateCurrentSession(): Promise<void> {
    if (!this.currentSessionId) {
      return;
    }

    try {
      await sessionsApi.invalidate(this.currentSessionId);
      this.stopActivityTracking();
      this.currentSessionId = null;
    } catch (error) {
      console.error('Error invalidating session:', error);
      throw error;
    }
  }

  /**
   * Invalide toutes les sessions d'un utilisateur
   * (Utile pour déconnexion de tous les appareils)
   */
  async invalidateAllSessions(userId: string): Promise<void> {
    try {
      await sessionsApi.invalidateAllUserSessions(userId);
      this.stopActivityTracking();
      this.currentSessionId = null;
    } catch (error) {
      console.error('Error invalidating all sessions:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des sessions
   */
  async getSessionStats() {
    try {
      return await sessionsApi.getStats();
    } catch (error) {
      console.error('Error fetching session stats:', error);
      throw error;
    }
  }

  /**
   * Nettoie la session locale (sans appel API)
   */
  cleanup() {
    this.stopActivityTracking();
    this.currentSessionId = null;
  }
}

export const sessionService = new SessionService();
