import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import {
    API_KEY,
    APP_ID,
    AUTH_DOMAIN,
    MESSAGING_SENDER_ID,
    PROJECT_ID,
    STORAGE_BUCKET,
  } from '@env';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: API_KEY,
    authDomain: AUTH_DOMAIN,
    projectId: PROJECT_ID,
    storageBucket: STORAGE_BUCKET,
    messagingSenderId: MESSAGING_SENDER_ID,
    appId: APP_ID,
  };

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { app, storage };
