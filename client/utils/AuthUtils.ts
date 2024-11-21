import { Auth, createUserWithEmailAndPassword, EmailAuthProvider, linkWithCredential, signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export async function loginAnonymously() {
  try {
    const userCredential = await signInAnonymously(auth);
    console.log('Anonymous user logged in:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Error with anonymous login:', error);
  }
}

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