import {
  ref,
  set,
  get,
  child,
  onValue,
  remove,
  update,
  off
} from 'firebase/database';
import { database } from '../lib/firebase';
import { UserProfile } from '../context/AuthContext';

export interface PresenceData {
  uid: string;
  username: string;
  userNumber: number;
  avatar: number;
  status: 'online' | 'in-game' | 'away';
  currentGame: string | null;
  lastSeen: number;
}

export class PresenceManager {
  private static listeners: Map<string, (presences: PresenceData[]) => void> = new Map();

  static async setPresence(user: UserProfile, status: 'online' | 'in-game' | 'away' = 'online', currentGame: string | null = null): Promise<void> {
    try {
      const presenceRef = ref(database, `presence/${user.uid}`);

      const presenceData: PresenceData = {
        uid: user.uid,
        username: user.username,
        userNumber: user.userNumber,
        avatar: user.avatar,
        status,
        currentGame,
        lastSeen: Date.now()
      };

      await set(presenceRef, presenceData);

      // Auto-cleanup on disconnect
      const dbRef = ref(database, `presence/${user.uid}`);
      dbRef.onDisconnect?.().remove();
    } catch (error) {
      console.error('Error setting presence:', error);
      throw error;
    }
  }

  static updatePresence(userId: string, updates: Partial<PresenceData>): Promise<void> {
    try {
      const presenceRef = ref(database, `presence/${userId}`);
      return update(presenceRef, { ...updates, lastSeen: Date.now() });
    } catch (error) {
      console.error('Error updating presence:', error);
      throw error;
    }
  }

  static async clearPresence(userId: string): Promise<void> {
    try {
      const presenceRef = ref(database, `presence/${userId}`);
      await remove(presenceRef);
    } catch (error) {
      console.error('Error clearing presence:', error);
      throw error;
    }
  }

  static listenToPresence(
    callback: (presences: PresenceData[]) => void,
    listenerId: string = 'default'
  ): () => void {
    const presenceRef = ref(database, 'presence');

    const listener = onValue(
      presenceRef,
      (snapshot) => {
        const data = snapshot.val();
        const presences: PresenceData[] = [];

        if (data) {
          Object.keys(data).forEach((key) => {
            presences.push(data[key] as PresenceData);
          });
        }

        callback(presences);
      },
      (error) => {
        console.error('Error listening to presence:', error);
      }
    );

    // Store listener for cleanup
    this.listeners.set(listenerId, callback);

    // Return cleanup function
    return () => {
      off(presenceRef);
      this.listeners.delete(listenerId);
    };
  }

  static stopListening(listenerId: string = 'default'): void {
    this.listeners.delete(listenerId);
    const presenceRef = ref(database, 'presence');
    off(presenceRef);
  }

  static async getOnlineCount(): Promise<number> {
    try {
      const presenceRef = ref(database, 'presence');
      const snapshot = await get(presenceRef);
      if (snapshot.exists()) {
        return Object.keys(snapshot.val()).length;
      }
      return 0;
    } catch (error) {
      console.error('Error getting online count:', error);
      return 0;
    }
  }

  static async getPlayerPresence(userId: string): Promise<PresenceData | null> {
    try {
      const presenceRef = ref(database, `presence/${userId}`);
      const snapshot = await get(presenceRef);
      if (snapshot.exists()) {
        return snapshot.val() as PresenceData;
      }
      return null;
    } catch (error) {
      console.error('Error getting player presence:', error);
      return null;
    }
  }
}
