import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { registerWithEmail, loginWithEmail } from '../utils/AuthUtils';
import { useRouter } from 'expo-router';
import { auth } from '../firebase';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await loginWithEmail(auth, email, password);
      router.push('/'); // Navigate back to home
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  const handleRegister = async () => {
    try {
      await registerWithEmail(email, password);
      router.push('/'); // Navigate back to home
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
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '80%',
  },
});

export default LoginScreen;
