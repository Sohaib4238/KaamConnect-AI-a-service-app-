import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;
let messaging = null;

try {
  let serviceAccount = null;

  // 1. Check if the JSON is in the environment variables (for cloud hosts like Railway)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      console.log('[Firebase] Loading credential from environment variable');
    } catch (parseErr) {
      console.error('[Firebase] JSON Parse error for FIREBASE_SERVICE_ACCOUNT_JSON:', parseErr.message);
      console.error('[Firebase] Value was:', process.env.FIREBASE_SERVICE_ACCOUNT_JSON.substring(0, 80) + '...');
    }
  } else {
    // 2. Fall back to local file path (for local development)
    const serviceAccountPath = path.resolve(__dirname, '../../service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      console.log('[Firebase] Loading credential from local service-account.json');
    }
  }

  if (!serviceAccount) {
    console.warn('[Firebase] No service account credentials found. Firebase features will fail.');
  } else {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'kaamconnect-496410'
    });

    db = admin.firestore();
    db.settings({
      projectId: 'kaamconnect-496410',
      databaseId: 'default'
    });
    messaging = admin.messaging();
    console.log('[Firebase] Initialized successfully');
  }
} catch (error) {
  console.error('[Firebase] Initialization error:', error.message);
}

export { admin, db, messaging };
