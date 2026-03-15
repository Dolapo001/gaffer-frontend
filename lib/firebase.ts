// Dummy Firebase Implementation
// This bypasses real Firebase and uses local storage for a demo experience

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

// Mock database
export const db = {}

// Mock auth state
let currentUser: User | null = null

// Try to load user from localStorage for persistence in demo
if (typeof window !== 'undefined') {
  const savedUser = localStorage.getItem('gaffer_demo_user')
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser)
    } catch (e) {
      console.error('Failed to parse saved user', e)
    }
  }
}

// Mock auth object
export const auth = {
  currentUser: currentUser
}

export const googleProvider = {}

// Auth helper functions
export const loginWithEmail = async (email: string, password: string) => {
  console.log('Mock login with:', email)
  const user: User = {
    uid: 'dummy-user-id',
    email: email,
    displayName: email.split('@')[0],
    photoURL: null,
  }
  currentUser = user
  if (typeof window !== 'undefined') {
    localStorage.setItem('gaffer_demo_user', JSON.stringify(user))
  }
  return { user }
}

export const registerWithEmail = async (email: string, password: string) => {
  console.log('Mock register with:', email)
  return loginWithEmail(email, password)
}

export const loginWithGoogle = async () => {
  console.log('Mock Google login')
  return loginWithEmail('dummy-google@example.com', 'dummy-password')
}

export const logoutUser = async () => {
  console.log('Mock logout')
  currentUser = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gaffer_demo_user')
  }
}

export const sendPasswordResetEmail = async (authObj: any, email: string) => {
  console.log('Mock password reset sent to:', email)
  return Promise.resolve()
}

export const onAuthChange = (callback: (user: User | null) => void) => {
  // Simulate an initial check
  setTimeout(() => {
    callback(currentUser)
  }, 100)
  
  // Return a mock unsubscribe function
  return () => {}
}

export type { User as FirebaseUser }
