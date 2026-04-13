# PixelDuel Online - Setup Checklist

Complete estos pasos para activar el sistema online de PixelDuel.

## ✅ Pre-requisitos

- [ ] Node.js 18+ instalado
- [ ] npm o yarn disponible
- [ ] Cuenta de Google (para crear proyecto Firebase)

## 🔧 Instalación Local

- [ ] `git clone` el repositorio
- [ ] `cd pixelduel`
- [ ] `npm install` (instala todas las dependencias, incluyendo Firebase)

## 🔑 Configuración Firebase

### Crear Proyecto

- [ ] Ir a https://console.firebase.google.com
- [ ] Crear nuevo proyecto (nombrearlo "PixelDuel" o similar)
- [ ] Esperar a que se cree completamente

### Habilitar Servicios

- [ ] **Authentication**: 
  - [ ] Ir a Authentication
  - [ ] Click en "Get started"
  - [ ] Habilitar "Email/Password"
  
- [ ] **Firestore Database**:
  - [ ] Ir a Firestore Database
  - [ ] Crear database
  - [ ] Seleccionar "Production mode"
  - [ ] Esperar a que se cree

- [ ] **Realtime Database**:
  - [ ] Ir a Realtime Database
  - [ ] Create database
  - [ ] Seleccionar "locked mode"
  - [ ] Esperar a que se cree

### Obtener Credenciales

- [ ] Ir a Project Settings (⚙️)
- [ ] Ir a "Your apps"
- [ ] Hacer clic en Web (</> icon)
- [ ] Copiar la configuración que aparece

### Completar Archivo de Config

- [ ] Abrir `src/lib/firebaseConfig.ts`
- [ ] Reemplazar cada `"YOUR_*"` con los valores de Firebase:
  - [ ] `apiKey` ← "AIzaSyD..."
  - [ ] `authDomain` ← "proyecto.firebaseapp.com"
  - [ ] `projectId` ← "proyecto-id"
  - [ ] `storageBucket` ← "proyecto.appspot.com"
  - [ ] `messagingSenderId` ← "123456789..."
  - [ ] `appId` ← "1:123456789..."
  - [ ] `databaseURL` ← "https://proyecto-rtdb.firebaseio.com"
- [ ] Guardar el archivo

### Aplicar Reglas de Seguridad

#### Firestore Rules

- [ ] Ir a Firestore Database → Rules
- [ ] Reemplazar todo con el contenido de `firestore.rules`
- [ ] Click en "Publish"
- [ ] Esperar confirmación ✅

#### Realtime Database Rules

- [ ] Ir a Realtime Database → Rules
- [ ] Pegar:
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
- [ ] Click en "Publish"
- [ ] Esperar confirmación ✅

## 🚀 Prueba Local

- [ ] Ejecutar `npm run dev` en la terminal
- [ ] Abrir navegador a `http://localhost:5173`
- [ ] Ver menú principal

## 🧪 Verificación Funcional

### Pantalla de Menú

- [ ] Ver título "PIXEL DUEL"
- [ ] Botón "▶ PLAY LOCAL" funciona
- [ ] Botón "🌐 PLAY ONLINE" funciona (no está gris)
- [ ] Botón "🏆 RECORDS" funciona

### Inicia Sesión Online

- [ ] Click en "🌐 PLAY ONLINE"
- [ ] Ver AuthScreen con 2 tabs: "INICIAR SESIÓN" y "REGISTRARSE"
- [ ] Click en "REGISTRARSE"
- [ ] Llenar formulario:
  - [ ] Email válido (ej: test123@gmail.com)
  - [ ] Nombre de usuario único (ej: TestPlayer789)
  - [ ] Contraseña 6+ caracteres
  - [ ] Confirmar contraseña
  - [ ] Seleccionar avatar (usar flechas ◀ ▶)
- [ ] Verificar: "✅ TestPlayer789 está disponible" (en verde)
- [ ] Click en "▶ CREAR CUENTA"
- [ ] Esperar a que se cree

### Ver OnlineLobby

- [ ] Debe ver pantalla "JUGADORES ONLINE"
- [ ] Su usuario aparece en la lista con:
  - [ ] Avatar (pequeño)
  - [ ] #0000 (su número)
  - [ ] Su nombre de usuario
  - [ ] Status "🟢 Online"
  - [ ] "(TÚ)" al lado del nombre
- [ ] Campo de búsqueda funciona
- [ ] Botón "← VOLVER AL MENÚ" funciona

### Verificar Multi-usuario

- [ ] Abrir **otra pestaña o navegador diferente**
- [ ] Hacer login con **diferente email/usuario**
- [ ] En la pestaña 1: debe ver al usuario #2 online
- [ ] En la pestaña 2: debe ver al usuario #1 online
- [ ] Cerrar una pestaña → el usuario debe desaparecer en 5s ✅

### Probar Invitaciones

- [ ] En pestaña 1, click en botón "📨" junto al usuario #2
- [ ] Verificar:
  - [ ] Notificación en pestaña 1: "Invitación enviada a [nombre]"
  - [ ] Notificación en pestaña 2: "👾 [nombre] te invita a jugar #0000"
  - [ ] Con botones "✅ ACEPTAR" y "❌ RECHAZAR"
  - [ ] Con timer visual de 30 segundos
- [ ] En pestaña 2: Click "✅ ACEPTAR"
- [ ] Ambas pantallas deben ir a selector de juegos
- [ ] Ambas pestaña 1 con HUD "PLAYER 1" y pestaña 2 "PLAYER 2"

### Jugar Online

- [ ] Pestaña 1 (Host): selecciona un juego (ej: "Pong")
- [ ] Pestaña 2 (Guest): ve la selección del host
- [ ] Ambas pueden jugar
- [ ] Ganador: click en "REMATCH", "OTHER GAME", o "MENU"

### Ver Estadísticas

- [ ] Ir a Menú → click "👤 PROFILE"
- [ ] Ver:
  - [ ] Avatar grande con flechas ◀ ▶
  - [ ] Nombre de usuario (no editable)
  - [ ] Número de jugador (#XXXX)
  - [ ] Email
  - [ ] Stats: Partidas, Victorias, Derrotas, Ratio %
- [ ] Cambiar avatar (click flechas)
- [ ] Avatar debe actualizarse en OnlineLobby para otros
- [ ] Click "🔴 CERRAR SESIÓN" vuelve a menú
- [ ] Necesita login de nuevo para online

## 🎮 Tests Avanzados (Opcional)

- [ ] Jugar 3 partidas locales → stats en LOCAL no se afectan online
- [ ] Vol ver a RECORDS (local scores) después de jugar online
- [ ] Cerrar navegador completamente → volver → presencia se actualiza
- [ ] Buscar por número (#0000) en OnlineLobby
- [ ] Buscar por username en OnlineLobby
- [ ] Invitar a usuario que está "En juego" → botón deshabilitado

## 🐛 Si Algo Falla

| Problema | Solución |
|----------|----------|
| "Firebase initialization error" | Verifica `firebaseConfig.ts` tenga todos los valores |
| Botón online sigue gris | Limpia cache, reinicia dev server |
| No puedo registrar usuario | Verifica Email/Password esté habilitado en Auth |
| Username dice "ya está en uso" | Usa otro nombre con números/guiones |
| Presence no ve a otros usuarios | Verifica Realtime DB rules estén aplicadas |
| Notificaciones no aparecen | Abre consola (F12) busca errores |
| Juego no conecta P2P | Verifica NetworkManager está configurado |

## 📞 Contacto

Si hay problemas persistentes:
1. Abre consola del navegador (F12)
2. Nota los mensajes de error
3. Verifica que Firebase está respondiendo
4. Intenta con incognito/private mode

## ✨ ¡Listo!

Si todo desde "Pantalla de Menú" hasta "Jugar Online" funciona, ¡has configurado PixelDuel correctamente! 🎉

El sistema ahora es completamente funcional para jugar online con amigos.

**Enjoy! 🎮✨**
