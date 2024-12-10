import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import UserIcon from '../components/UserIcon';
import { View, StyleSheet } from 'react-native';
import { TeamsProvider } from '@/contexts/TeamContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <TeamsProvider>
        <View style={styles.container}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <UserIcon />
        </View>
      </TeamsProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});
