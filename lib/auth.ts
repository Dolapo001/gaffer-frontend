// Mock Firebase Implementation for development - No backend needed!
export interface User {
  uid: string
  email: string | null
  displayName?: string | null
  photoURL?: string | null
}

export type Auth = any

// Persistence helpers
const STORAGE_KEY = 'gaffer_mock_user'
const MOCK_USERS_KEY = 'gaffer_mock_database'

const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved ? JSON.parse(saved) : null
}

const getMockDatabase = (): Record<string, string> => {
  if (typeof window === 'undefined') return {}
  const saved = localStorage.getItem(MOCK_USERS_KEY)
  return saved ? JSON.parse(saved) : {}
}

const saveStoredUser = (user: User | null) => {
  if (typeof window === 'undefined') return
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

// Mock functions
export const getAuth = (): Auth => ({})

export const loginWithEmail = async (email: string, password: string) => {
  const users = getMockDatabase()
  if (users[email] && users[email] === password) {
    const user = { uid: btoa(email), email }
    saveStoredUser(user)
    return { user }
  }
  
  const error = new Error('Invalid email or password')
  ;(error as any).code = 'auth/wrong-password'
  throw error
}

export const registerWithEmail = async (email: string, password: string) => {
  const users = getMockDatabase()
  if (users[email]) {
    const error = new Error('Email already in use')
    ;(error as any).code = 'auth/email-already-in-use'
    throw error
  }

  // Save to mock DB
  users[email] = password
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))

  const user = { uid: btoa(email), email }
  saveStoredUser(user)
  return { user }
}

export const loginWithGoogle = async () => {
  const user = { 
    uid: 'google-mock-id', 
    email: 'google-user@example.com',
    displayName: 'Google Mock User' 
  }
  saveStoredUser(user)
  return { user }
}

export const logoutUser = async () => {
  saveStoredUser(null)
}

export const sendPasswordResetEmail = async (email: string) => {
  console.log(`Mock: Password reset email sent to ${email}`)
  return Promise.resolve()
}

export const resetPassword = (email: string) => sendPasswordResetEmail(email)

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (typeof window === 'undefined') {
    callback(null)
    return () => {}
  }

  // Initial check
  callback(getStoredUser())

  // We could use an EventListener to react to login/logout across tabs
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(getStoredUser())
    }
  }
  window.addEventListener('storage', handleStorageChange)

  // Explicitly poll for local changes too (since storage event only fires on other windows)
  const interval = setInterval(() => {
    // This is a simple way to keep components synced with our mock persistence
  }, 1000)

  return () => {
    window.removeEventListener('storage', handleStorageChange)
    clearInterval(interval)
  }
}

export type { User as FirebaseUser }
