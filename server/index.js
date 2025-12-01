import express from 'express';
import cors from 'cors';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import instructorRouter from './routes/instructorApi.js';

// --- FIREBASE INITIALIZATION ---
// Read the service account key from the environment variable path
let serviceAccount;
try {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
  }
  serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
} catch (error) {
  console.error('❌ Error loading Firebase credentials:', error.message);
  process.exit(1);
}

// Initialize the Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount),
});

// Initialize Firestore DB connection
const db = getFirestore();
console.log('✅ Firebase Admin SDK initialized.');

// --- EXPRESS SERVER SETUP ---
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// --- ROUTES ---

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'instructor-file-upload-api',
  });
});

// Instructor Roster Upload Routes
app.use('/api/instructor', instructorRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`\n✅ Backend server running locally on http://localhost:${PORT}`);
  console.log('--- READY FOR POSTMAN TESTING ---');
});

// --- EXPORT THE DB OBJECT ---
// This is the CRITICAL fix for the SyntaxError
export { db };
