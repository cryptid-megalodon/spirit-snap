import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SpiritProvider } from '@/contexts/SpiritContext';
import { TeamsProvider } from '@/contexts/TeamContext';
import { BattleProvider } from '@/contexts/BattleContext';
import { ParamProvider } from '@/contexts/ParamContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'LibreBaskerville-Regular': require('@/assets/fonts/LibreBaskerville-Regular.ttf'),
    'LibreBaskerville-Italic': require('@/assets/fonts/LibreBaskerville-Italic.ttf'),
    'LibreBaskerville-Bold': require('@/assets/fonts/LibreBaskerville-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AuthProvider>
      <SpiritProvider>
        <TeamsProvider>
          <BattleProvider>
            <ParamProvider>
              <AuthenticatedLayout />
            </ParamProvider>
          </BattleProvider>
        </TeamsProvider>
      </SpiritProvider>
    </AuthProvider>
  );
}

function AuthenticatedLayout() {
  const { user, loading } = useAuth(); // Access auth state
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to the Get Started page if not authenticated
        router.replace('/getstarted');
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
