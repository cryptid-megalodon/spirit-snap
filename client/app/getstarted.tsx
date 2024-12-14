import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const GetStarted = () => {
    const router = useRouter();
  
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Get Started</Text>
        <Button title="Log in" onPress={() => router.push('/login')} />
        <Button title="Sign up" onPress={() => router.push('/signup')} />
      </View>
    );
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default GetStarted;
