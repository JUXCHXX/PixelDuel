# Firebase Setup Completo para PixelDuel

## 📋 Tabla de Contenidos
1. Crear proyecto Firebase
2. Configurar variables de entorno
3. Estructura de Firestore
4. Estructura de Realtime Database
5. Reglas de seguridad
6. Verificación de la configuración

---

## 1️⃣ Crear Proyecto Firebase

### Paso 1: Ir a Firebase Console
1. Ve a https://console.firebase.google.com
2. Haz clic en **"Crear un proyecto"** o **"Añadir proyecto"**
3. Nombre del proyecto: **`pixelduel`**
4. Desmarca "Mejorar Google Analytics" (opcional)
5. Acepta los términos y haz clic en **"Crear proyecto"**
6. Espera 2-3 minutos a que se cree

---

## 2️⃣ Configurar Variables de Entorno

### Paso 1: Obtener credenciales de Firebase

1. En la consola de Firebase, ve a **Configuración del proyecto** (⚙️ arriba a la izquierda)
2. Haz clic en **"Mis apps"**
3. Haz clic en el icono **`</>`** (Web) para registrar una app web
4. Nombre: **`pixelduel`**
5. Haz clic en **"Registrar app"**
6. Copia la configuración que aparece

### Paso 2: Obtener Database URL

1. Ve a **Realtime Database** (lo crearás luego)
2. Copia el URL (ej: `https://pixelduel-12345-default-rtdb.firebaseio.com`)

### Paso 3: Configurar archivo .env

1. En la raíz del proyecto, abre `.env`
2. Rellena todos los valores:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_DATABASE_URL`

3. **⚠️ IMPORTANTE**: El archivo `.env` está en `.gitignore` - **NUNCA será commiteado**

---

## 3️⃣ Configurar Authentication

1. Ve a **Authentication**
2. Haz clic en **"Comenzar"**
3. En **"Sign-in method"**:
   - Selecciona **"Email/Password"**
   - Actívalo
   - Guarda

---

## 4️⃣ Crear Firestore Database

1. Ve a **Firestore Database**
2. Haz clic en **"Create database"**
3. Modo: **"Production"**
4. Ubicación: La más cercana a ti
5. Crea

Luego, ve a **Rules** y reemplaza con:

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

---

## 5️⃣ Crear Realtime Database

1. Ve a **Realtime Database**
2. Haz clic en **"Create Database"**
3. Modo: **"Test"**
4. Ubicación: La misma que Firestore
5. Crea

Luego, ve a **Rules** y reemplaza con:

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

---

## 📐 Esquema de Datos Firestore

### Colección: users

```
users/{uid}
├── uid: string
├── username: string
├── userNumber: number
├── email: string
├── avatar: number (0-7)
├── createdAt: timestamp
├── gamesPlayed: number
├── wins: number
└── losses: number
```

### Colección: usernames

```
usernames/{username}
├── uid: string
└── username: string
```

### Colección: invites

```
invites/{inviteId}
├── from: {uid, username, userNumber, avatar}
├── to: {uid, username, userNumber}
├── game: string | null
├── status: string (pending, accepted, declined, expired)
├── roomCode: string | null
├── createdAt: timestamp
└── expiresAt: timestamp
```

### Colección: matches (Opcional)

```
matches/{uid}/{matchId}
├── gameType: string
├── opponent: {uid, username}
├── result: string (win, loss, draw)
├── timestamp: timestamp
└── duration: number (ms)
```

---

## 📊 Esquema Realtime Database

```
presence/
├── {uid}/
│  ├── uid: string
│  ├── username: string
│  ├── userNumber: number
│  ├── avatar: number
│  ├── status: string (online, in-game)
│  ├── currentGame: string | null
│  └── lastSeen: timestamp
```

---

## ✅ Checklist Final

- [ ] Proyecto creado
- [ ] Auth habilitado
- [ ] .env relleno
- [ ] Firestore creada + Rules publicadas
- [ ] Realtime DB creada + Rules publicadas
- [ ] npm run dev sin errores
- [ ] PLAY ONLINE funciona

¡Listo! 🎮✨
