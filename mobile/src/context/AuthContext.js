import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Load user profile from Firestore
        const profile = await loadUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loadUserProfile = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('[Auth] Load profile error:', error);
      return null;
    }
  };

  const createUserProfile = async (uid, data) => {
    try {
      const docRef = doc(db, 'users', uid);
      const profile = {
        uid,
        email: data.email || '',
        name: data.name || '',
        phone: data.phone || '',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        booking_count: 0,
        saved_addresses: [],
      };
      await setDoc(docRef, profile);
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error('[Auth] Create profile error:', error);
      throw error;
    }
  };

  const signUp = async (email, password, name, phone) => {
    const credential = await createUserWithEmailAndPassword(
      auth, email, password
    );
    await updateProfile(credential.user, { displayName: name });
    await createUserProfile(credential.user.uid, {
      email, name, phone
    });
    return credential.user;
  };

  const signIn = async (email, password) => {
    const credential = await signInWithEmailAndPassword(
      auth, email, password
    );
    const profile = await loadUserProfile(credential.user.uid);
    if (!profile) {
      await createUserProfile(credential.user.uid, {
        email: credential.user.email,
        name: credential.user.displayName || '',
        phone: ''
      });
    }
    return credential.user;
  };

  const signInWithGoogle = async (idToken) => {
    const googleCredential = GoogleAuthProvider.credential(idToken);
    const credential = await signInWithCredential(auth, googleCredential);
    const profile = await loadUserProfile(credential.user.uid);
    if (!profile) {
      await createUserProfile(credential.user.uid, {
        email: credential.user.email,
        name: credential.user.displayName || '',
        phone: ''
      });
    }
    return credential.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const updateUserProfile = async (updates) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { 
        ...updates, 
        updated_at: serverTimestamp() 
      }, { merge: true });
      setUserProfile(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('[Auth] Update profile error:', error);
      throw error;
    }
  };

  const incrementBookingCount = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const newCount = (userProfile?.booking_count || 0) + 1;
      await setDoc(docRef, { 
        booking_count: newCount, 
        updated_at: serverTimestamp() 
      }, { merge: true });
      setUserProfile(prev => ({ ...prev, booking_count: newCount }));
    } catch (error) {
      console.error('[Auth] Increment booking count error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      logout,
      updateUserProfile,
      loadUserProfile,
      incrementBookingCount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
