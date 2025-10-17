import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Configuration Firebase Admin SDK pour la migration
 *
 * Ce fichier initialise Firebase Admin avec les credentials nécessaires
 * pour lire les données Firestore et Firebase Storage
 */

let adminApp: admin.app.App | null = null;

/**
 * Initialise Firebase Admin SDK
 */
export function initializeFirebaseAdmin(): admin.app.App {
  if (adminApp) {
    return adminApp;
  }

  // Chemin vers le service account key
  const serviceAccountPath = path.join(
    __dirname,
    '../../../service-account-key.json'
  );

  // Vérifier que le fichier existe
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      `Service account key not found at: ${serviceAccountPath}\n` +
      'Please download the service account key from Firebase Console:\n' +
      'Project Settings → Service Accounts → Generate New Private Key\n' +
      'Save it as /backend/service-account-key.json'
    );
  }

  // Charger les credentials
  const serviceAccount = require(serviceAccountPath);

  // Initialiser Firebase Admin
  adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: serviceAccount.project_id + '.appspot.com',
  });

  console.log('✅ Firebase Admin initialized successfully');
  console.log(`📁 Project: ${serviceAccount.project_id}`);
  console.log(`📦 Storage Bucket: ${adminApp.options.storageBucket}`);

  return adminApp;
}

/**
 * Récupère l'instance Firestore
 */
export function getFirestore(): admin.firestore.Firestore {
  if (!adminApp) {
    throw new Error('Firebase Admin not initialized. Call initializeFirebaseAdmin() first.');
  }
  return admin.firestore();
}

/**
 * Récupère l'instance Storage
 */
export function getStorage(): admin.storage.Storage {
  if (!adminApp) {
    throw new Error('Firebase Admin not initialized. Call initializeFirebaseAdmin() first.');
  }
  return admin.storage();
}

/**
 * Récupère l'instance Auth
 */
export function getAuth(): admin.auth.Auth {
  if (!adminApp) {
    throw new Error('Firebase Admin not initialized. Call initializeFirebaseAdmin() first.');
  }
  return admin.auth();
}

/**
 * Ferme la connexion Firebase Admin
 */
export async function closeFirebaseAdmin(): Promise<void> {
  if (adminApp) {
    await adminApp.delete();
    adminApp = null;
    console.log('✅ Firebase Admin connection closed');
  }
}
