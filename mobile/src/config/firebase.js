import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBh9nbvbHaLBVAtZAfpgxrszOJqpkN1wUs",
  authDomain: "kaamconnect-496410.firebaseapp.com",
  projectId: "kaamconnect-496410",
  storageBucket: "kaamconnect-496410.firebasestorage.app",
  messagingSenderId: "485744190620",
  appId: "1:485744190620:web:2aebe07955e3248d8cf959",
  measurementId: "G-4ELDG6RHLB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, 'default');

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export default app;
