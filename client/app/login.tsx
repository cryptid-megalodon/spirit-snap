import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Auth, createUserWithEmailAndPassword, EmailAuthProvider, linkWithCredential, signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await loginWithEmail(auth, email, password);
      router.back(); // Navigate back to the previous screen
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  const handleRegister = async () => {
    try {
      await registerWithEmail(email, password);
      router.back(); // Navigate back to the previous screen
    } catch (error) {
      console.error('Error registering:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize='none'
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize='none'
        style={styles.input}
      />
      <View style={styles.button}>
        <Button title="Login" onPress={handleLogin} />
      </View>
      <View style={styles.button}>
        <Button title="Sign Up" onPress={handleRegister} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    width: '90%', // Explicit width to prevent shrinking
    fontSize: 16, // Optional: Ensure consistent text size
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '90%',
  },
});

export const screenOptions = {
  headerShown: false, // Completely hides the header
};

export async function registerWithEmail(email: string, password: string) {
  try {
    const credential = EmailAuthProvider.credential(email, password);

    if (auth.currentUser?.isAnonymous) {
      // Link anonymous account to the new email/password account
      const userCredential = await linkWithCredential(auth.currentUser, credential);
      console.log('Anonymous account upgraded to:', userCredential.user.email);
    } else { 
      // Create a new account directly
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User registered with email:', userCredential.user.email);
    }
  } catch (error) {
    console.error('Error registering user:', error);
  }
}

export async function loginWithEmail(auth: Auth, email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User logged in:', userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error('Error logging in:', error);
  }
}

export default LoginScreen;
