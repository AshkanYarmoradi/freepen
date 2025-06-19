import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK for server-side operations
const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
};

// Initialize the app only if it hasn't been initialized already
const firebaseAdmin = getApps().length === 0 
  ? initializeApp(firebaseAdminConfig) 
  : getApps()[0];

// Get Firestore instance
const adminDb = getFirestore(firebaseAdmin);

export { adminDb, firebaseAdmin };