import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  writeBatch,
  documentId
} from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { UserProfile } from '../context/AuthContext';

export interface Invite {
  id: string;
  from: {
    uid: string;
    username: string;
    userNumber: number;
    avatar: number;
  };
  to: {
    uid: string;
    username: string;
    userNumber: number;
  };
  game: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  roomCode: string | null;
  createdAt: number;
  expiresAt: number;
}

export class InviteManager {
  static async sendInvite(from: UserProfile, toUid: string, toProfile: UserProfile): Promise<{ inviteId: string; roomCode: string }> {
    try {
      const now = Date.now();
      const expiresAt = now + 30000; // 30 seconds
      const roomCode = this.generateRoomCode(); // Generate code immediately for HOST

      const inviteRef = await addDoc(collection(firestore, 'invites'), {
        from: {
          uid: from.uid,
          username: from.username,
          userNumber: from.userNumber,
          avatar: from.avatar
        },
        to: {
          uid: toUid,
          username: toProfile.username,
          userNumber: toProfile.userNumber
        },
        game: null,
        status: 'pending',
        roomCode: roomCode, // Store code from the start
        createdAt: now,
        expiresAt
      });

      return { inviteId: inviteRef.id, roomCode };
    } catch (error) {
      console.error('Error sending invite:', error);
      throw error;
    }
  }

  static async acceptInvite(inviteId: string): Promise<string> {
    try {
      const inviteDoc = await getDoc(doc(firestore, 'invites', inviteId));
      if (!inviteDoc.exists()) {
        throw new Error('Invite not found');
      }

      const roomCode = inviteDoc.data().roomCode;
      if (!roomCode) {
        throw new Error('Room code not found in invite');
      }

      await updateDoc(doc(firestore, 'invites', inviteId), {
        status: 'accepted',
        acceptedAt: Date.now()
      });

      return roomCode;
    } catch (error) {
      console.error('Error accepting invite:', error);
      throw error;
    }
  }

  static async declineInvite(inviteId: string): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'invites', inviteId), {
        status: 'declined',
        declinedAt: Date.now()
      });
    } catch (error) {
      console.error('Error declining invite:', error);
      throw error;
    }
  }

  static async expireInvite(inviteId: string): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'invites', inviteId), {
        status: 'expired'
      });
    } catch (error) {
      console.error('Error expiring invite:', error);
      throw error;
    }
  }

  static async getInvite(inviteId: string): Promise<Invite | null> {
    try {
      const docSnap = await getDoc(doc(firestore, 'invites', inviteId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Invite;
      }
      return null;
    } catch (error) {
      console.error('Error getting invite:', error);
      return null;
    }
  }

  static async getInviteByRoomCode(roomCode: string): Promise<Invite | null> {
    try {
      const q = query(
        collection(firestore, 'invites'),
        where('roomCode', '==', roomCode),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      if (snapshot.docs.length > 0) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Invite;
      }
      return null;
    } catch (error) {
      console.error('Error getting invite by room code:', error);
      return null;
    }
  }

  static listenToReceivedInvites(
    userId: string,
    callback: (invites: Invite[]) => void
  ): () => void {
    try {
      const q = query(
        collection(firestore, 'invites'),
        where('to.uid', '==', userId),
        where('status', '==', 'pending')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const invites: Invite[] = [];
        snapshot.forEach((doc) => {
          invites.push({ id: doc.id, ...doc.data() } as Invite);
        });
        callback(invites);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error listening to invites:', error);
      return () => {};
    }
  }

  static listenToInviteById(
    inviteId: string,
    callback: (invite: Invite | null) => void
  ): () => void {
    try {
      const q = query(
        collection(firestore, 'invites'),
        where(documentId(), '==', inviteId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.docs.length > 0) {
          const invite = snapshot.docs[0];
          callback({ id: invite.id, ...invite.data() } as Invite);
        } else {
          callback(null);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error listening to invite by ID:', error);
      return () => {};
    }
  }

  static async getPendingInviteCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(firestore, 'invites'),
        where('to.uid', '==', userId),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting pending invite count:', error);
      return 0;
    }
  }

  static async cleanupExpiredInvites(): Promise<void> {
    try {
      const now = Date.now();
      const q = query(
        collection(firestore, 'invites'),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(firestore);

      snapshot.forEach((doc) => {
        const invite = doc.data() as any;
        if (invite.expiresAt < now) {
          batch.update(doc.ref, { status: 'expired' });
        }
      });

      await batch.commit();
    } catch (error) {
      console.error('Error cleaning up expired invites:', error);
    }
  }

  private static generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
