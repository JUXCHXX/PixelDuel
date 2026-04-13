# PixelDuel Firebase Setup Guide

Esta guía te ayudará a configurar Firebase para que PixelDuel funcione correctamente con el sistema de autenticación, presencia en línea e invitaciones.

## 1️⃣ Crear un Proyecto en Firebase

1. Ve a https://console.firebase.google.com
2. Haz clic en **"Crear un proyecto"**
3. Nombre del proyecto: `pixelduel` (o el nombre que prefieras)
4. Activa Google Analytics (opcional)
5. Espera a que se cree el proyecto

## 2️⃣ Configurar Authentication

1. En la consola de Firebase, ve a **Authentication**
2. Haz clic en **"Comenzar"**
3. En la pestaña de **Sign-in method**:
   - Haz clic en **Email/Password**
   - Activa **Email/Password**
   - Haz clic en **Guardar**

## 3️⃣ Crear Firestore Database

1. Ve a **Firestore Database**
2. Haz clic en **"Crear base de datos"**
3. Selecciona:
   - Ubicación: La más cercana a tus usuarios
   - Modo de inicio: **Modo de producción** (usaremos reglas personalizadas)
4. Haz clic en **"Crear"**
5. Una vez creada, ve a la pestaña **Reglas**
6. Reemplaza el contenido con el del archivo `firestore.rules` de este proyecto
7. Haz clic en **Publicar**

Contenido de `firestore.rules`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users: read if authenticated, write if own profile
    match /users/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == uid;
      allow update, delete: if request.auth.uid == uid;
    }

    // Usernames: public read for verification, write if authenticated
    match /usernames/{username} {
      allow read: if true;
      allow create, write: if request.auth != null;
      allow delete: if false;
    }

    // Invites: read/write if you're the sender or recipient
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

    // Matches: players can read/write their own match records
    match /matches/{uid}/{matchId} {
      allow read, write: if request.auth.uid == uid;
    }

    // Default: deny all
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 4️⃣ Crear Realtime Database

1. Ve a **Realtime Database**
2. Haz clic en **"Crear base de datos"**
3. Ubicación: La misma que elegiste para Firestore
4. Modo de inicio: **Modo de prueba** (o producción con reglas personalizadas)
5. Haz clic en **"Habilitar"**
6. Ve a la pestaña **Reglas** y configura:

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

7. Haz clic en **Publicar reglas**

## 5️⃣ Obtener Credenciales de Firebase

1. En la consola de Firebase, ve a **Configuración del proyecto** (⚙️)
2. Ve a la pestaña **Mis aplicaciones**
3. Haz clic en el icono de **Web** (</>) si no tienes una app web registrada
4. Nombre de la app: `pixelduel` (o lo que prefieras)
5. Haz clic en **Registrar app**
6. Copia el objeto de configuración que aparece:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com"
};
```

## 6️⃣ Actualizar firebaseConfig.ts

1. Abre el archivo `src/lib/firebaseConfig.ts`
2. Reemplaza los placeholders con tus valores de Firebase:

```typescript
export const firebaseConfig = {
  apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "pixelduel-xxxxx.firebaseapp.com",
  projectId: "pixelduel-12345",
  storageBucket: "pixelduel-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  databaseURL: "https://pixelduel-xxxxx-default-rtdb.firebaseio.com"
};
```

⚠️ **IMPORTANTE**: REVISABien que:
- Todos los campos están presentes
- No hay espacios extra
- El `databaseURL` es obligatorio para Realtime Database

## 7️⃣ Verificar la Configuración

1. Abre una terminal en el proyecto
2. Ejecuta: `npm run dev`
3. Abre http://localhost:5173 en tu navegador
4. Haz clic en **"PLAY ONLINE"**
5. Deberías ver la pantalla de **REGISTRARSE** / **INICIAR SESIÓN**

### Ver si hay errores:
- Abre la consola del navegador (F12)
- Busca errores de Firebase
- Si hay un error de configuración, verás un mensaje claro

## 🐛 Solución de Problemas

### "Firebase initialization error"
```
Error: Failed to initialize Firebase. Check your firebaseConfig.
```

**Causa**: El archivo `firebaseConfig.ts` tiene valores inválidos

**Solución**:
1. Verifica que copiaste todos los valores correctamente
2. No debería haber comillas adicionales o espacios
3. Recarga la página

### "Error checking username: Cannot read property 'toLowerCase'"
```
Error: Cannot read property 'toLowerCase' of undefined
```

**Causa**: Hay un error en Firestore al verificar disponibilidad de usuario

**Solución**:
1. Verifica que {Firestore Database esté creada
2. Verifica que las reglas de Firestore están publicadas
3. Recarga la página

### "PLAY ONLINE" te lleva a una pantalla en blanco

**Causa**: Probablemente un error en la consola

**Solución**:
1. Abre F12 → Console
2. Busca errores en rojo
3. Verifica que `firebaseConfig.ts` tiene valores válidos

### No puedo registrarme: "Failed to initialize Firebase"

**Causa**: `firebaseConfig.ts` no está configurado

**Solución**: Sigue el paso 6️⃣ nuevamente, verificando cada valor

## ✅ Checklist Final

Antes de considerar que todo está funcionando:

- [ ] Proyecto creado en Firebase Console
- [ ] Authentication habilitada (Email/Password)
- [ ] Firestore Database creada
- [ ] Realtime Database creada
- [ ] Credenciales copiadas en `src/lib/firebaseConfig.ts`
- [ ] Reglas de Firestore publicadas
- [ ] Reglas de Realtime Database publicadas
- [ ] `npm run dev` ejecutándose sin errores
- [ ] Puedo hacer clic en "PLAY ONLINE"
- [ ] Veo la pantalla de registro/login
- [ ] Puedo crear una cuenta
- [ ] Después de registrarme, veo la lista de jugadores online

## 🚀 Próximos Pasos

Una vez que Firebase esté configurado:

1. **Crea tu cuenta** en la app
2. **Abre otra pestaña** e inicia sesión con otra cuenta
3. **Invita al otro jugador** desde la lista de jugadores online
4. **Acepta la invitación** en la otra pestaña
5. **Elige un juego** y ¡a jugar!

## 📚 Recursos

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Realtime Database Rules](https://firebase.google.com/docs/rules)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

## 💬 Ayuda

Si tienes problemas:
1. Verifica los errores en la consola del navegador (F12)
2. Lee el mensaje de error completo
3. Comprueba tu configuración en `src/lib/firebaseConfig.ts`
4. Revisa que las reglas de Firestore están publicadas

¡Disfruta jugando PixelDuel! 🎮✨
