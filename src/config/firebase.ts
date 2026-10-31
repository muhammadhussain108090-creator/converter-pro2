import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Firestore,
  deleteDoc
} from 'firebase/firestore';
import { ConversionHistoryItem, UserProfileData } from '../types';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDhATviOzuYUSc6XNXAuFIX7_nMMtiokJE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'lyrical-mercury-qc70r.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'lyrical-mercury-qc70r',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'lyrical-mercury-qc70r.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '278142126860',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:278142126860:web:efa975f499df912dd95729'
};

export const firebaseReady = Boolean(
  config.apiKey &&
  config.projectId &&
  config.appId &&
  config.apiKey !== 'MY_FIREBASE_API_KEY' &&
  !config.apiKey.includes('YOUR_')
);

export const app: FirebaseApp | null = firebaseReady
  ? (getApps().length ? getApps()[0] : initializeApp(config))
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();

// Error message formatter
export const formatAuthError = (err: any): string => {
  if (!err) return 'An unexpected error occurred.';
  const code = err.code || '';
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This web domain is not authorized in your Firebase Console. Go to Firebase Console > Authentication > Settings > Authorized domains and add this site URL.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters.';
    case 'auth/user-not-found':
      return 'No account was found with this email address.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials and try again.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Access to this account has been temporarily disabled. Please reset your password or try again later.';
    case 'auth/popup-closed-by-user':
      return 'The sign-in popup was closed before completing authentication.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'This authentication method is not enabled in your Firebase Console. Please enable Email/Password or Google under Authentication > Sign-in method.';
    default:
      return err.message || 'Authentication failed. Please try again.';
  }
};

/**
 * Sign up with Email, Password and Display Name
 */
export const registerWithEmail = async (name: string, email: string, pass: string): Promise<User> => {
  if (!auth) throw new Error('Firebase Authentication is not configured. Please set your Firebase environment variables.');
  
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = credential.user;

  // Update display name
  if (name.trim()) {
    try {
      await updateProfile(user, { displayName: name.trim() });
    } catch (e) {
      console.warn('Could not update display name:', e);
    }
  }

  // Send email verification
  try {
    await sendEmailVerification(user);
  } catch (e) {
    console.warn('Could not send verification email:', e);
  }

  // Store user document in Firestore
  if (db) {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: name.trim() || null,
        photoURL: null,
        createdAt: serverTimestamp(),
        conversionsCount: 0
      }, { merge: true });
    } catch (e) {
      console.warn('Could not store user profile in Firestore:', e);
    }
  }

  return user;
};

/**
 * Log in with Email & Password
 */
export const loginWithEmail = async (email: string, pass: string): Promise<User> => {
  if (!auth) throw new Error('Firebase Authentication is not configured. Please set your Firebase environment variables.');
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  return credential.user;
};

/**
 * Log in with Google
 */
export const loginWithGoogle = async (): Promise<User> => {
  if (!auth) throw new Error('Firebase Authentication is not configured. Please set your Firebase environment variables.');
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(auth, googleProvider);
  const user = credential.user;

  // Sync profile document to Firestore
  if (db) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          createdAt: serverTimestamp(),
          conversionsCount: 0
        });
      }
    } catch (e) {
      console.warn('Firestore user profile sync warning:', e);
    }
  }

  return user;
};

/**
 * Send password reset email
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  if (!auth) throw new Error('Firebase Authentication is not configured.');
  await sendPasswordResetEmail(auth, email);
};

/**
 * Resend verification email
 */
export const requestEmailVerification = async (): Promise<void> => {
  if (!auth?.currentUser) throw new Error('No signed-in user.');
  await sendEmailVerification(auth.currentUser);
};

/**
 * Log out current user
 */
export const logoutUser = async (): Promise<void> => {
  if (!auth) return;
  await signOut(auth);
};

/**
 * Update user display name
 */
export const updateUserName = async (displayName: string): Promise<void> => {
  if (!auth?.currentUser) throw new Error('No signed-in user.');
  await updateProfile(auth.currentUser, { displayName });
  if (db) {
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), { displayName }, { merge: true });
    } catch (e) {
      console.warn('Could not update name in Firestore:', e);
    }
  }
};

/**
 * Activity & Conversion History Storage
 * Supports Firestore when authenticated and configured, with robust LocalStorage fallback.
 */
const LOCAL_STORAGE_KEY_PREFIX = 'convertpro_history_';

export const saveConversionRecord = async (
  item: Omit<ConversionHistoryItem, 'id' | 'timestamp'>
): Promise<ConversionHistoryItem> => {
  const record: ConversionHistoryItem = {
    ...item,
    id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now()
  };

  const currentUid = auth?.currentUser?.uid || 'guest';
  const key = `${LOCAL_STORAGE_KEY_PREFIX}${currentUid}`;

  // Always save to localStorage for instant UI response and offline access
  try {
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [record, ...existing].slice(0, 50);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save history to localStorage:', e);
  }

  // Also sync to Firestore if signed in and db is ready
  if (auth?.currentUser && db) {
    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'conversions'), {
        toolId: record.toolId,
        toolName: record.toolName,
        inputFileName: record.inputFileName,
        inputFileSize: record.inputFileSize,
        outputFileName: record.outputFileName,
        outputFileSize: record.outputFileSize,
        status: record.status,
        details: record.details || '',
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Could not sync conversion to Firestore:', e);
    }
  }

  return record;
};

export const fetchConversionRecords = async (uid?: string): Promise<ConversionHistoryItem[]> => {
  const targetUid = uid || auth?.currentUser?.uid || 'guest';
  const localKey = `${LOCAL_STORAGE_KEY_PREFIX}${targetUid}`;
  let localRecords: ConversionHistoryItem[] = [];

  try {
    const raw = localStorage.getItem(localKey);
    if (raw) localRecords = JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading local history:', e);
  }

  // If user is authenticated and db is ready, try to query latest from Firestore
  if (auth?.currentUser && db && targetUid !== 'guest') {
    try {
      const q = query(
        collection(db, 'users', targetUid, 'conversions'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestoreRecords: ConversionHistoryItem[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const timestamp = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
          return {
            id: docSnap.id,
            toolId: data.toolId || 'unknown',
            toolName: data.toolName || 'File Tool',
            inputFileName: data.inputFileName || 'document',
            inputFileSize: data.inputFileSize || 0,
            outputFileName: data.outputFileName || 'output',
            outputFileSize: data.outputFileSize || 0,
            timestamp,
            status: data.status || 'success',
            details: data.details || ''
          };
        });
        return firestoreRecords;
      }
    } catch (e) {
      console.warn('Could not fetch conversions from Firestore, using local cache:', e);
    }
  }

  return localRecords;
};

export const clearConversionRecords = async (uid?: string): Promise<void> => {
  const targetUid = uid || auth?.currentUser?.uid || 'guest';
  const key = `${LOCAL_STORAGE_KEY_PREFIX}${targetUid}`;
  localStorage.removeItem(key);

  if (auth?.currentUser && db && targetUid !== 'guest') {
    try {
      const q = query(collection(db, 'users', targetUid, 'conversions'), limit(100));
      const snap = await getDocs(q);
      const deletes = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletes);
    } catch (e) {
      console.warn('Could not clear Firestore records:', e);
    }
  }
};
