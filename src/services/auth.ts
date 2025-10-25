import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { ref, type Ref } from 'vue'

const provider = new GoogleAuthProvider()

// Reactive user state
export const currentUser: Ref<User | null> = ref(null)
export const isAuthenticated = ref(false)

// Initialize auth state listener
onAuthStateChanged(auth, (user) => {
  currentUser.value = user
  isAuthenticated.value = !!user
})

/**
 * Sign in with Google using popup
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider)
    return { success: true, user: result.user }
  } catch (error: any) {
    console.error('Error signing in with Google:', error)
    return {
      success: false,
      error: error.message || 'Failed to sign in with Google'
    }
  }
}

/**
 * Sign out the current user
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth)
    return { success: true }
  } catch (error: any) {
    console.error('Error signing out:', error)
    return {
      success: false,
      error: error.message || 'Failed to sign out'
    }
  }
}

/**
 * Get the current user
 */
export const getCurrentUser = () => {
  return auth.currentUser
}
