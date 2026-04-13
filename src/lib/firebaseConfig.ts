export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://your-project-default-rtdb.firebaseio.com"
};

// Validar que las variables de entorno estén configuradas
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_DATABASE_URL'
];

const missingEnvVars = requiredEnvVars.filter(
  envVar => !import.meta.env[envVar] || import.meta.env[envVar].includes('your-')
);

if (missingEnvVars.length > 0) {
  console.warn(
    '⚠️ Firebase no está completamente configurado.\n' +
    'Variables de entorno faltantes o incompletas:\n' +
    missingEnvVars.join('\n') +
    '\n\nSigue estos pasos:\n' +
    '1. Copia .env.example a .env\n' +
    '2. Rellena con tus valores de Firebase Console\n' +
    '3. Reinicia el servidor de desarrollo'
  );
}

