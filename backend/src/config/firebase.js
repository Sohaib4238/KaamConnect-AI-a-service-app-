import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;
let messaging = null;

try {
  // Service account is expected to be in /backend/service-account.json
  const serviceAccountPath = path.resolve(__dirname, '../../service-account.json');

  if (!fs.existsSync(serviceAccountPath)) {
    console.warn(`[Firebase] service-account.json not found at ${serviceAccountPath}. Firebase features will fail.`);
  } else {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

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
