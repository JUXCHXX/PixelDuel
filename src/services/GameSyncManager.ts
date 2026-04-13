import {
  ref,
  set,
  get,
  update,
  onValue,
  remove,
} from 'firebase/database';
import { database } from '../lib/firebase';

export class GameSyncManager {
  // Simplified game session tracking using Firestore-style paths but in Realtime DB

  static async createGameSession(roomCode: string, playerUid: string): Promise<void> {
    try {
      // Create session with status to prevent race condition
      const sessionRef = ref(database, `rooms/${roomCode}`);
      await set(sessionRef, {
        roomCode,
        host: { uid: playerUid },
        guest: null,
        status: 'waiting', // Tell guest the room is ready
        createdAt: Date.now()
      });
      console.log(`HOST: Sesión creada y confirmada en Firebase para roomCode: ${roomCode}`);
    } catch (error) {
      console.error('Error creating game session:', error);
      throw error;
    }
  }

  static async joinGameSession(roomCode: string, playerUid: string): Promise<void> {
    try {
      // Check if room exists and is ready
      const sessionRef = ref(database, `rooms/${roomCode}`);
      const snapshot = await get(sessionRef);

      if (!snapshot.exists()) {
        throw new Error('Sala no encontrada');
      }

      const roomData = snapshot.val();

      // Verify room is in waiting state
      if (roomData.status !== 'waiting') {
        throw new Error('Sala no está disponible');
      }

      // Join as guest
      await update(sessionRef, {
        guest: { uid: playerUid },
        status: 'ready' // Both players ready to start
      });

      console.log('GUEST: Unido exitosamente a la sala');
    } catch (error) {
      console.error('Error joining game session:', error);
      throw error;
    }
  }

  static listenToGameSession(
    roomCode: string,
    callback: (data: any) => void
  ): () => void {
    try {
      const sessionRef = ref(database, `rooms/${roomCode}`);

      const unsubscribe = onValue(
        sessionRef,
        (snapshot) => {
          if (snapshot.exists()) {
            callback(snapshot.val());
          }
        },
        (error) => {
          console.error('Error listening to session:', error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up listener:', error);
      return () => {};
    }
  }

  static async updateSelectedGame(roomCode: string, gameId: string): Promise<void> {
    try {
      const sessionRef = ref(database, `rooms/${roomCode}`);
      await update(sessionRef, {
        selectedGame: gameId,
        gameStartedAt: Date.now()
      });
      console.log(`Game selected: ${gameId}`);
    } catch (error) {
      console.error('Error updating selected game:', error);
      throw error;
    }
  }

  static async endGameSession(roomCode: string): Promise<void> {
    try {
      const sessionRef = ref(database, `rooms/${roomCode}`);
      await remove(sessionRef);
    } catch (error) {
      console.error('Error ending game session:', error);
    }
  }
}