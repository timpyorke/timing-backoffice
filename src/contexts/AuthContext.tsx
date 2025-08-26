import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { safeStorage } from '@/utils/safeStorage';
import { auth } from '@/services/firebase';
import { User as AppUser } from '@/types';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Proactive token refresh
  useEffect(() => {
    let tokenRefreshInterval: NodeJS.Timeout | null = null;

    const startTokenRefresh = (firebaseUser: User) => {
      // Refresh token every 45 minutes (Firebase tokens expire after 1 hour)
      tokenRefreshInterval = setInterval(async () => {
        try {
          console.log('Proactively refreshing token...');
          const newToken = await firebaseUser.getIdToken(true);
          safeStorage.setItem('token', newToken);
          console.log('Token refreshed proactively');
        } catch (error) {
          console.error('Proactive token refresh failed:', error);
        }
      }, 45 * 60 * 1000); // 45 minutes
    };

    const stopTokenRefresh = () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
        tokenRefreshInterval = null;
      }
    };

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        // Start proactive token refresh
        startTokenRefresh(firebaseUser);

        // Check if we have user data in localStorage first
        const userData = safeStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
          // Ensure we have a fresh token
          try {
            const token = await firebaseUser.getIdToken();
            safeStorage.setItem('token', token);
          } catch (error) {
            console.error('Failed to get initial token:', error);
          }
        } else {
          // If no user data in localStorage, create it from Firebase user
          const token = await firebaseUser.getIdToken();
          const newUserData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: 'admin' as const,
            createdAt: new Date()
          };
          safeStorage.setItem('token', token);
          safeStorage.setItem('user', JSON.stringify(newUserData));
          setUser(newUserData);
        }
      } else {
        // Stop token refresh when user logs out
        stopTokenRefresh();
        setUser(null);
        safeStorage.removeItem('user');
        safeStorage.removeItem('token');
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      stopTokenRefresh();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get the ID token
      const token = await userCredential.user.getIdToken();
      
      // Create user object
      const userData = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        name: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User',
        role: 'admin' as const,
        createdAt: new Date()
      };
      
      safeStorage.setItem('token', token);
      safeStorage.setItem('user', JSON.stringify(userData));
      
      // Set user state immediately
      setUser(userData);
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      safeStorage.removeItem('user');
      safeStorage.removeItem('token');
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      if (firebaseUser) {
        console.log('Manually refreshing token...');
        const newToken = await firebaseUser.getIdToken(true);
        safeStorage.setItem('token', newToken);
        console.log('Token refreshed manually');
      } else {
        throw new Error('No authenticated user found');
      }
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
