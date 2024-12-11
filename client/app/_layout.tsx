import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import UserIcon from '../components/UserIcon';
import { View, StyleSheet } from 'react-native';
import { TeamsProvider } from '@/contexts/TeamContext';
import { BattleProvider } from '@/contexts/BattleContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <TeamsProvider>
        <BattleProvider>
          <View style={styles.container}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            <UserIcon />
          </View>
        </BattleProvider>
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
