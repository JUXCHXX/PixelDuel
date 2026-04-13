import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AuthManager } from '../services/AuthManager';
import { PresenceManager } from '../services/PresenceManager';

export interface UserProfile {
  uid: string;
  username: string;
  userNumber: number;
  email: string;
  avatar: number;
  createdAt: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Fetch user profile from Firestore
          const userProfile = await AuthManager.getProfile(currentUser.uid);
          if (userProfile) {
            setProfile(userProfile);
            // Initialize presence when user logs in
            await PresenceManager.setPresence(userProfile, 'online', null);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          setProfile(null);
        }
      } else {
        // Clear presence when user logs out
        if (user?.uid) {
          try {
            await PresenceManager.clearPresence(user.uid);
          } catch (error) {
            console.error('Error clearing presence:', error);
          }
        }
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
