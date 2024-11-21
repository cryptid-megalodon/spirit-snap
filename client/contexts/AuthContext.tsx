import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { loginAnonymously } from '../utils/AuthUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from 'expo-router';

const neverOpenedKey = 'neverOpened';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User is already logged in (anonymous or permanent)
        setUser(currentUser);
      // If the app has never been opened before, neverOpenedKey will be null.
      } else if (await AsyncStorage.getItem(neverOpenedKey) === null) {
        // No user session exists, create an anonymous account
        try {
          const anonUser = await loginAnonymously();
          setUser(anonUser || null);
        } catch (error) {
          console.error('Error signing in anonymously:', error);
        }
        await AsyncStorage.setItem(neverOpenedKey, 'false');
      } else {
        // No user session exists, redirect to login/signup page
        navigation.navigate('login');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

