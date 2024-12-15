import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Auth, createUserWithEmailAndPassword, EmailAuthProvider, linkWithCredential } from 'firebase/auth';
import { auth } from '../firebase';


const Signup = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      await registerWithEmail(email, password);
      router.replace('/'); // Redirect to the Capture tab

    } catch (error) {
      console.error('Error registering:', error);
    }
  };

  async function registerWithEmail(email: string, password: string) {
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
});

export default Signup;
