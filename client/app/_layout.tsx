import React, { useEffect, useState, useContext } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { AuthProvider, AuthContext } from '../contexts/AuthContext';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { TeamsProvider } from '@/contexts/TeamContext';
import { BattleProvider } from '@/contexts/BattleContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <TeamsProvider>
        <BattleProvider>
          <AuthenticatedLayout />
        </BattleProvider>
      </TeamsProvider>
    </AuthProvider>
  );
}

function AuthenticatedLayout() {
  const { user, loading } = useContext(AuthContext); // Access auth state
  const router = useRouter();
  const pathname = usePathname(); // Get the current route path

  useEffect(() => {
    console.log("pathname ", pathname);
    if (!loading) {
      if (!user) {
        // Redirect to the Get Started page if not authenticated
        router.replace('./getstarted');
      }
    }
  }, [user, loading]);

  if (loading) {
    // Show a loading spinner while checking authentication
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Stack>
        {/* Main authenticated screens */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Auth-related screens */}
        <Stack.Screen name="getstarted" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: true, title: 'Log In' }} />
        <Stack.Screen name="signup" options={{ headerShown: true, title: 'Sign Up' }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
