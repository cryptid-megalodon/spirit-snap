import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Auth, createUserWithEmailAndPassword, EmailAuthProvider, linkWithCredential } from 'firebase/auth';
import { auth } from '../firebase';

const DEFAULT_ERROR_MESSAGE = 'Invalid credentials.';

const Signup = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorState, setErrorState] = useState('');

  const handleRegister = async () => {
    try {
      // Clear any previous error state
      setErrorState('');

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
      router.replace('/'); // Redirect to the Capture tab

    } catch (error: unknown) {
      if (isFirebaseError(error)) {
        const userFriendlyMessage = mapFirebaseErrorToMessage(error.code);
        setErrorState(userFriendlyMessage);
      } else {
        setErrorState(DEFAULT_ERROR_MESSAGE);
      }
      console.log('Error registering:', error);
    }
  };
  // Map Firebase error codes to user-friendly messages
  const mapFirebaseErrorToMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      default:
        return DEFAULT_ERROR_MESSAGE;
    }
  };

  function isFirebaseError(error: unknown): error is { code: string; message: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Create an Account</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        {errorState ? <Text style={styles.errorText}>{errorState}</Text> : null}
        <Button title="Sign up" onPress={handleRegister} />
      </View>
    </TouchableWithoutFeedback>
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
  input: {
    width: '80%',
    borderWidth: 1,
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default Signup;
