import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database, ref, child, get, query } from 'firebase/database';
import { firebaseConfig } from './firebaseConfig';

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let database: Database;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  firestore = getFirestore(app);
  database = getDatabase(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw new Error('Failed to initialize Firebase. Check your firebaseConfig.');
}

export { app, auth, firestore, database };
