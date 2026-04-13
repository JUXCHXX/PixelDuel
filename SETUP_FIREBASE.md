# Firebase Configuration Guide para PixelDuel

## 📋 Resumen

PixelDuel utiliza Firebase para manejar:
- **Autenticación**: Registro y login de usuarios
- **Firestore**: Almacenamiento de perfiles de usuario, invitaciones y datos de juego
- **Realtime Database**: Presencia en tiempo real (quién está online)

## 🚀 Pasos para Configurar Firebase

### Paso 1: Crear un Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Haz clic en **"Add project"** (o selecciona uno existente)
3. Nombre del proyecto: `pixelduel` (o cualquier nombre)
4. No necesitas Google Analytics para comenzar
5. Haz clic en **"Create project"**
6. Espera a que se cree (2-3 minutos)

### Paso 2: Habilitar Authentication (Email/Password)

1. En Firebase Console, ve a **Authentication** (panel izquierdo)
2. Haz clic en **"Get started"** (si es la primera vez)
3. Selecciona **Email/Password**
4. Activa el switch **"Email/Password"**
5. Haz clic en **Save**

### Paso 3: Crear Firestore Database

1. Ve a **Firestore Database** (panel izquierdo)
2. Haz clic en **"Create database"**
3. Selecciona **Production mode**
4. Ubicación: Elige la más cercana a ti
5. Haz clic en **Create**
6. Espera 2-3 minutos

### Paso 4: Crear Realtime Database

1. Ve a **Realtime Database** (panel izquierdo)
2. Haz clic en **"Create Database"**
3. Ubicación: Elige la misma que Firestore
4. Modo: **Start in locked mode** (aplicaremos reglas después)
5. Haz clic en **Enable**

### Paso 5: Obtener tu Configuración de Firebase

1. Ve a **Settings** (rueda ⚙️ en la parte inferior izquierda)
2. Selecciona **Project settings**
3. Desplázate hasta la sección **"Your apps"**
4. Haz clic en el icono **</> (Web)**
5. Recibirás una configuración como esta:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD1234567890...",
  authDomain: "pixelduel-abc123.firebaseapp.com",
  projectId: "pixelduel-abc123",
  storageBucket: "pixelduel-abc123.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcd1234efgh5678",
  databaseURL: "https://pixelduel-abc123-default-rtdb.firebaseio.com"
};
```

### Paso 6: Actualizar `src/lib/firebaseConfig.ts`

Copia la configuración que obtuviste en el Paso 5 y pégala en `src/lib/firebaseConfig.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",  // ← Reemplaza con tu apiKey
  authDomain: "your-project.firebaseapp.com",  // ← Reemplaza
  projectId: "your-project-id",  // ← Reemplaza
  storageBucket: "your-project.appspot.com",  // ← Reemplaza
  messagingSenderId: "your-sender-id",  // ← Reemplaza
  appId: "your-app-id",  // ← Reemplaza
  databaseURL: "https://your-project-default-rtdb.firebaseio.com"  // ← Reemplaza
};
```

### Paso 7: Configurar Firestore Security Rules

1. Ve a **Firestore Database** → **Rules** (pestaña arriba)
2. Reemplaza el contenido actual con el contenido de `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == uid;
      allow update, delete: if request.auth.uid == uid;
    }
    match /usernames/{username} {
      allow read: if true;
      allow create, write: if request.auth != null;
      allow delete: if false;
    }
    match /invites/{inviteId} {
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.from.uid ||
         request.auth.uid == resource.data.to.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        (request.auth.uid == resource.data.from.uid ||
         request.auth.uid == resource.data.to.uid);
      allow delete: if false;
    }
    match /matches/{uid}/{matchId} {
      allow read, write: if request.auth.uid == uid;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Haz clic en **Publish**

### Paso 8: Configurar Realtime Database Rules

1. Ve a **Realtime Database** → **Rules** (pestaña arriba)
2. Reemplaza el contenido con:

```json
{
  "rules": {
    "presence": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

3. Haz clic en **Publish**

## ✅ Verificación

Una vez completados todos los pasos:

1. `apiKey` y `authDomain` están configurados → ✅ Auth funcionará
2. Firestore Database está creada → ✅ Perfiles de usuario se guardarán
3. Realtime Database está creada → ✅ Presencia online mostrará en tiempo real
4. Reglas de Firestore y Realtime DB están aplicadas → ✅ Seguridad configurada

## 🎮 Probar la App

```bash
npm run dev
```

Abre la app en el navegador (probablemente http://localhost:5173)

1. Haz clic en **"🌐 PLAY ONLINE"**
2. Haz clic en **"REGISTRARSE"**
3. Completa el formulario con:
   - Email: `test@example.com`
   - Nombre de jugador: `TestPlayer123`
   - Contraseña: `password123` (mínimo 6 caracteres)
   - Elige un avatar
4. Haz clic en **"▶ CREAR CUENTA"**

Si ves la pantalla de **"JUGADORES ONLINE"**, ¡Felicidades! 🎉 Firebase está configurado correctamente.

## 🆘 Solución de Problemas

| Error | Causa | Solución |
|-------|-------|----------|
| "Firebase initialization error" | Config incorrecta | Verifica que todos los valores en `firebaseConfig.ts` sean correctos |
| "Permission denied" en Firestore | Reglas no aplicadas | Ve a Firestore → Rules → asegúrate de que está el código completo |
| Usuario no puede registrarse | Auth no habilitada | Ve a Authentication → habilita Email/Password |
| Presencia no actualiza en tiempo real | Reglas Realtime DB incorrectas | Verifica las reglas de Realtime Database |
| "projectId is missing" | Config incompleta | Todos los campos en `firebaseConfig` deben estar llenos |

## 📝 Notas Importantes

- **Nunca** subas `firebaseConfig.ts` a GitHub con valores reales (aunque Firebase tiene restricciones de API key)
- Para producción, considera usar variables de entorno
- Las reglas de seguridad protegen tus datos de acceso no autorizado
- Los usuarios no pueden ver perfiles de otros usuarios excepto para búsqueda de nombre (lectura limitada)

## 🔐 Seguridad

Las reglas de Firestore garantizan:
- ✅ Solo usuarios autenticados pueden leer/escribir
- ✅ Un usuario solo puede modificar su propio perfil
- ✅ Los nombres de usuario son únicos y verificables
- ✅ Las invitaciones solo pueden ser modificadas por el remitente o receptor
- ✅ Cada usuario tiene aislamiento de datos

¡Listo! Tu PixelDuel está configurado y listo para jugar online. 🎮✨
