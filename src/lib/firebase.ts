import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Use specified firestoreDatabaseId if configured
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  quotaMonth: string;
  usedWords: number;
  totalClaimedWords: number;
  totalActivities: number;
  membership: string;
  claimPoints: number;
}

export interface CloudAudioActivity {
  id: string;
  userId: string;
  title: string;
  text: string;
  wordCount: number;
  syllableCount: number;
  voice: string;
  provider: string;
  speed: number;
  createdAt: number;
  claimed: boolean;
  claimTokens: number;
  audioUrl?: string;
}

export async function loginWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    // If popup blocked, attempt redirect
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

export async function checkRedirectResult(): Promise<FirebaseUser | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (err) {
    console.warn('Redirect sign-in error:', err);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function syncUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    // Check if new month rollover
    if (data.quotaMonth !== currentMonth) {
      const updated = {
        ...data,
        quotaMonth: currentMonth,
        usedWords: 0,
      };
      await setDoc(userRef, updated, { merge: true });
      return updated;
    }
    return data;
  } else {
    const newProfile: UserProfile = {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Burmese Learner',
      photoURL: user.photoURL || '',
      createdAt: new Date().toISOString(),
      quotaMonth: currentMonth,
      usedWords: 0,
      totalClaimedWords: 0,
      totalActivities: 0,
      membership: 'Free Tier - 100,000 Words/Month',
      claimPoints: 50, // Welcome bonus points
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
}

export async function recordCloudActivity(
  userId: string,
  activity: Omit<CloudAudioActivity, 'id' | 'userId' | 'claimed' | 'claimTokens'>
): Promise<string> {
  const activityId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const activityRef = doc(db, 'users', userId, 'activities', activityId);

  // Bonus claim tokens calculated based on reading length
  const rewardTokens = Math.max(5, Math.min(100, Math.ceil(activity.wordCount / 5)));

  const newActivity: CloudAudioActivity = {
    ...activity,
    id: activityId,
    userId,
    claimed: false,
    claimTokens: rewardTokens,
  };

  await setDoc(activityRef, newActivity);

  // Update user counts
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    usedWords: increment(activity.wordCount),
    totalActivities: increment(1),
  }).catch(() => {});

  return activityId;
}

export async function claimActivityReward(
  userId: string,
  activityId: string,
  tokens: number,
  wordCount: number
): Promise<void> {
  const activityRef = doc(db, 'users', userId, 'activities', activityId);
  await updateDoc(activityRef, { claimed: true });

  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    claimPoints: increment(tokens),
    totalClaimedWords: increment(wordCount),
  });
}
