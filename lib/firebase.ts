import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth as _getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User,
  type Auth,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Lazy singleton — only initialise in the browser to prevent SSR errors
// when Firebase env vars are missing during build-time prerendering.
let _auth: Auth | null = null

function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') {
    // Return a no-op stub during SSR/prerendering
    throw new Error('Firebase auth is not available on the server')
  }
  if (!_auth) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    _auth = _getAuth(app)
  }
  return _auth
}

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// Expose the resolved Auth instance (browser-only)
export const getAuth = (): Auth => getFirebaseAuth()

export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(getFirebaseAuth(), email, password).then((cred) => ({
    user: cred.user,
  }))

export const registerWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(getFirebaseAuth(), email, password).then((cred) => ({
    user: cred.user,
  }))

export const loginWithGoogle = () =>
  signInWithPopup(getFirebaseAuth(), googleProvider).then((cred) => ({ user: cred.user }))

export const logoutUser = () => signOut(getFirebaseAuth())

export { sendPasswordResetEmail }

export const resetPassword = (email: string) =>
  sendPasswordResetEmail(getFirebaseAuth(), email)

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (typeof window === 'undefined') {
    // No-op during SSR — return a dummy unsubscribe
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(getFirebaseAuth(), callback)
}

export type { User as FirebaseUser }
export type { User }
