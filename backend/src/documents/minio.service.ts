import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

/**
 * Service MinIO pour la gestion du stockage d'objets
 *
 * Gère :
 * - Connexion au serveur MinIO
 * - Création de buckets
 * - Upload/download de fichiers
 * - Suppression de fichiers
 * - Génération d'URLs pré-signées
 */
@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;
  private readonly bucketName = 'orchestr-a-documents';

  constructor(private configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT') || 'localhost',
      port: parseInt(this.configService.get('MINIO_PORT') || '9000'),
      useSSL: this.configService.get('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY') || 'devuser',
      secretKey: this.configService.get('MINIO_SECRET_KEY') || 'devpassword',
    });
  }

  /**
   * Initialisation du module : créer le bucket s'il n'existe pas
   */
  async onModuleInit() {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);

      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        console.log(`✅ Bucket MinIO créé : ${this.bucketName}`);
      } else {
        console.log(`✅ Bucket MinIO existant : ${this.bucketName}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création du bucket MinIO:', error);
      throw error;
    }
  }

  /**
   * Upload un fichier vers MinIO
   */
  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const objectName = `${Date.now()}-${fileName}`;

    await this.minioClient.putObject(
      this.bucketName,
      objectName,
      fileBuffer,
      fileBuffer.length,
      {
        'Content-Type': contentType,
      },
    );

    return objectName; // Retourne le chemin de stockage
  }

  /**
   * Télécharger un fichier depuis MinIO
   */
  async downloadFile(objectName: string): Promise<Buffer> {
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      this.minioClient.getObject(this.bucketName, objectName, (err, stream) => {
        if (err) {
          return reject(err);
        }

        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (error) => reject(error));
      });
    });
  }

  /**
   * Supprimer un fichier de MinIO
   */
  async deleteFile(objectName: string): Promise<void> {
    await this.minioClient.removeObject(this.bucketName, objectName);
  }

  /**
   * Générer une URL pré-signée pour téléchargement temporaire (expiration 24h)
   */
  async getPresignedUrl(objectName: string): Promise<string> {
    return this.minioClient.presignedGetObject(
      this.bucketName,
      objectName,
      24 * 60 * 60, // 24 heures
    );
  }

  /**
   * Vérifier si un fichier existe
   */
  async fileExists(objectName: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(this.bucketName, objectName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Récupérer les métadonnées d'un fichier
   */
  async getFileMetadata(objectName: string): Promise<Minio.BucketItemStat> {
    return this.minioClient.statObject(this.bucketName, objectName);
  }
}
