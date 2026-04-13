# Actualizar Firebase Realtime Database Rules

## Pasos para aplicar las reglas de seguridad:

### 1. Abre Firebase Console
- Ve a: https://console.firebase.google.com
- Selecciona tu proyecto **PixelDuel**

### 2. Ve a Realtime Database
- En el menú izquierdo → **Realtime Database**
- Haz clic en tu base de datos

### 3. Ve a la pestaña "Rules"
- En la parte superior, haz clic en **"Rules"**

### 4. Reemplaza con las nuevas reglas
Copia TODO el contenido de `database.rules.json` y pegalo en el editor:

```json
{
  "rules": {
    "game-sessions": {
      "$roomCode": {
        ".read": true,
        ".write": "root.child('game-sessions').child($roomCode).exists() || !data.exists()",
        ".validate": "newData.hasChildren(['roomCode', 'hostUid', 'status'])",
        "hostUid": {
          ".validate": "newData.isString()"
        },
        "guestUid": {
          ".validate": "newData.isString()"
        },
        "status": {
          ".validate": "newData.val() === 'connecting' || newData.val() === 'ready' || newData.val() === 'playing' || newData.val() === 'ended'"
        },
        "createdAt": {
          ".validate": "newData.isNumber()"
        },
        "lastActivity": {
          ".validate": "newData.isNumber()"
        },
        "lastInput": {
          "playerId": {
            ".validate": "newData.isString()"
          },
          "input": {
            ".validate": "newData.exists()"
          },
          "timestamp": {
            ".validate": "newData.isNumber()"
          }
        }
      }
    },
    "presence": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid",
        "status": {
          ".validate": "newData.val() === 'online' || newData.val() === 'in-game' || newData.val() === 'away'"
        },
        "username": {
          ".validate": "newData.isString()"
        },
        "userNumber": {
          ".validate": "newData.isNumber()"
        },
        "avatar": {
          ".validate": "newData.isNumber()"
        },
        "currentGame": {
          ".validate": "newData.isString() || newData.val() === null"
        },
        "lastSeen": {
          ".validate": "newData.isNumber()"
        }
      }
    }
  }
}
```

### 5. Publica las reglas
- Haz clic en **"Publish"** en la esquina inferior derecha

### ✅ Listo!
Ahora el sistema de juego online debería funcionar correctamente.

## Explicación de las reglas:

- **game-sessions**: estructura para almacenar sesiones de juego online
  - Cualquiera puede leer (`".read": true`)
  - Puedes crear nuevas (si no existen) o actualizar existentes
  - Se valida que tenga roomCode, hostUid y status
  
- **presence**: estructura para usuarios online (ya existía)
  - Cualquiera puede leer
  - Solo el usuario propietario puede escribir la suya
