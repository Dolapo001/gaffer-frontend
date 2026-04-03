export type UserRole = 'personal' | 'organization' | null

export interface GafferUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role: UserRole
}

export interface AuthState {
  user: GafferUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface OnboardingState {
  selectedRole: UserRole
  completedSteps: string[]
}

export type Gender = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say'

export interface SignUpData {
  email: string
  password: string
  confirmPassword: string
  gender: Gender
}

export interface SignInData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}
