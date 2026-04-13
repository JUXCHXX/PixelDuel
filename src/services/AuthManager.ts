import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  UserCredential
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { auth, firestore } from '../lib/firebase';
import { UserProfile } from '../context/AuthContext';
import { PresenceManager } from './PresenceManager';

export class AuthManager {
  static async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const userquery = query(
        collection(firestore, 'usernames'),
        where('username', '==', username.toLowerCase())
      );
      const snapshot = await getDocs(userquery);
      return snapshot.empty;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  }

  static async getNextUserNumber(): Promise<number> {
    try {
      const usersRef = collection(firestore, 'users');
      const snapshot = await getDocs(usersRef);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting next user number:', error);
      return 0;
    }
  }

  static async register(
    email: string,
    password: string,
    username: string,
    avatar: number = 0
  ): Promise<UserProfile> {
    // Validate username uniqueness
    const available = await this.checkUsernameAvailability(username);
    if (!available) {
      throw new Error('Username already taken');
    }

    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Get next user number
    const userNumber = await this.getNextUserNumber();

    // Create user profile document
    const profile: UserProfile = {
      uid,
      username: username.toLowerCase(),
      userNumber,
      email,
      avatar,
      createdAt: Date.now(),
      gamesPlayed: 0,
      wins: 0,
      losses: 0
    };

    // Save to Firestore
    await setDoc(doc(firestore, 'users', uid), profile);

    // Save username mapping for quick lookup
    await setDoc(doc(firestore, 'usernames', username.toLowerCase()), {
      uid,
      username: username.toLowerCase()
    });

    // Set initial presence
    try {
      await PresenceManager.setPresence(profile, 'online', null);
    } catch (error) {
      console.error('Error setting initial presence:', error);
      // Don't fail registration if presence fails
    }

    return profile;
  }

  static async login(emailOrNumber: string, password: string): Promise<UserProfile> {
    let email = emailOrNumber;

    // Check if it's a user number (#XXXX format)
    const numberMatch = emailOrNumber.match(/^#?(\d+)$/);
    if (numberMatch) {
      const userNumber = parseInt(numberMatch[1]);
      // Find user by number
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('userNumber', '==', userNumber));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('User not found');
      }

      email = snapshot.docs[0].data().email;
    }

    // Sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Get and return profile
    const profile = await this.getProfile(userCredential.user.uid);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Set presence to online (this is done in AuthContext, but also here for safety)
    try {
      await PresenceManager.setPresence(profile, 'online', null);
    } catch (error) {
      console.error('Error setting presence on login:', error);
      // Don't fail login if presence fails
    }

    return profile;
  }

  static async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docSnap = await getDoc(doc(firestore, 'users', uid));
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  static async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await setDoc(doc(firestore, 'users', uid), updates, { merge: true });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  static async logout(): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      try {
        await PresenceManager.clearPresence(user.uid);
      } catch (error) {
        console.error('Error clearing presence on logout:', error);
      }
    }
    await signOut(auth);
  }

  static async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }
}
