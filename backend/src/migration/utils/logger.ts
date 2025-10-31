import * as fs from 'fs';
import * as path from 'path';

/**
 * Système de logging pour la migration
 *
 * Crée des logs détaillés dans /backend/migration-logs/
 */

const LOG_DIR = path.join(__dirname, '../../../migration-logs');

// Créer le répertoire de logs s'il n'existe pas
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export class MigrationLogger {
  private logFile: string;
  private startTime: Date;
  private stats: {
    total: number;
    success: number;
    errors: number;
    skipped: number;
  };

  constructor(private name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(LOG_DIR, `${name}-${timestamp}.log`);
    this.startTime = new Date();
    this.stats = { total: 0, success: 0, errors: 0, skipped: 0 };

    this.log(`📋 Starting migration: ${name}`);
    this.log(`⏰ Start time: ${this.startTime.toISOString()}`);
  }

  /**
   * Log un message avec timestamp
   */
  log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    // Console
    console.log(message);

    // Fichier
    fs.appendFileSync(this.logFile, logMessage);
  }

  /**
   * Log un succès
   */
  success(message: string, data?: any): void {
    this.stats.success++;
    this.log(`✅ ${message}`);
    if (data) {
      this.log(`   Data: ${JSON.stringify(data, null, 2)}`);
    }
  }

  /**
   * Log une erreur
   */
  error(message: string, error?: any): void {
    this.stats.errors++;
    this.log(`❌ ERROR: ${message}`);
    if (error) {
      this.log(`   Error: ${error.message || JSON.stringify(error)}`);
      if (error.stack) {
        this.log(`   Stack: ${error.stack}`);
      }
    }
  }

  /**
   * Log un skip
   */
  skip(message: string, reason?: string): void {
    this.stats.skipped++;
    this.log(`⏭️  SKIP: ${message}`);
    if (reason) {
      this.log(`   Reason: ${reason}`);
    }
  }

  /**
   * Log une info
   */
  info(message: string): void {
    this.log(`ℹ️  ${message}`);
  }

  /**
   * Log un warning
   */
  warn(message: string): void {
    this.log(`⚠️  WARNING: ${message}`);
  }

  /**
   * Incrémente le compteur total
   */
  incrementTotal(): void {
    this.stats.total++;
  }

  /**
   * Affiche le résumé final
   */
  summary(): void {
    const endTime = new Date();
    const duration = (endTime.getTime() - this.startTime.getTime()) / 1000;

    this.log('');
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.log('📊 MIGRATION SUMMARY');
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.log(`Total:   ${this.stats.total}`);
    this.log(`✅ Success: ${this.stats.success} (${this.percentage(this.stats.success)}%)`);
    this.log(`❌ Errors:  ${this.stats.errors} (${this.percentage(this.stats.errors)}%)`);
    this.log(`⏭️  Skipped: ${this.stats.skipped} (${this.percentage(this.stats.skipped)}%)`);
    this.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
    this.log(`⏰ End time: ${endTime.toISOString()}`);
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.log(`📁 Log file: ${this.logFile}`);
    this.log('');
  }

  /**
   * Calcule le pourcentage
   */
  private percentage(value: number): string {
    if (this.stats.total === 0) return '0.00';
    return ((value / this.stats.total) * 100).toFixed(2);
  }

  /**
   * Récupère les statistiques
   */
  getStats() {
    return { ...this.stats };
  }
}
