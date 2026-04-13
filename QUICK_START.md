# 🚀 GUÍA RÁPIDA - Primeros Pasos

## ⚡ 5 Minutos - Configuración Esencial

### 1. Crear archivo .env
```bash
# Copia el ejemplo
cp .env.example .env    # Mac/Linux
Copy-Item .env.example -Destination .env    # Windows PowerShell
```

### 2. Obtener credenciales Firebase
1. Ve a https://console.firebase.google.com
2. Crea un nuevo proyecto (nombre: `pixelduel`)
3. Espera a que se cree
4. Vé a Configuración (⚙️) → Mis apps → Registrar app (Web)
5. Copia todo lo que aparece

### 3. Rellenar .env
Abre `.env` y rellena esto:
```
VITE_FIREBASE_API_KEY=AIzaSyD_xxx
VITE_FIREBASE_AUTH_DOMAIN=pixelduel-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pixelduel-xxx
VITE_FIREBASE_STORAGE_BUCKET=pixelduel-xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxx
VITE_FIREBASE_DATABASE_URL=https://pixelduel-xxx-default-rtdb.firebaseio.com
```

### 4. Habilitar Authentication
1. En Firebase Console → **Authentication**
2. Haz clic en **"Comenzar"**
3. Busca **Email/Password** y actívalo

### 5. Crear Firestore
1. En Firebase Console → **Firestore Database**
2. **"Create database"** → Modo: **Production**
3. Ve a **Rules** → Reemplaza todo con lo de `firestore.rules`
4. **Publish**

### 6. Crear Realtime Database
1. En Firebase Console → **Realtime Database**
2. **"Create database"** → Modo: **Test**
3. Ve a **Rules** → Reemplaza con:
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
4. **Publish**

### 7. Ejecutar
```bash
npm run dev
```

Ve a http://localhost:5173 y haz clic en **"PLAY ONLINE"**

✅ **¡Listo!**

---

## 📖 Documentación Completa

- **FIREBASE_SETUP.md** - Guía detallada paso-a-paso
- **SETUP.md** - Información adicional
- **.env.example** - Todas las variables necesarias

---

## 🐛 Problemas Comunes

### "Firebase initialization error"
→ Verifica que `.env` está completo y sin errores

### "Cannot read property 'toLowerCase'"
→ Rellena TODAS las variables en `.env`

### "PLAY ONLINE" es blanco
→ Abre F12 (Console) y revisa los errores

### "Permission denied" al registrarse
→ Espera 30s después de publicar las Rules de Firestore

---

## 💾 Recordar

✅ `.env` está en `.gitignore` - **NUNCA se commitea**
✅ `.env.example` es el template (se puede commitear)
✅ Variables en `.env` se leen con `import.meta.env.VITE_*`
✅ Reinicia `npm run dev` después de cambiar `.env`

¡Disfruta! 🎮✨
