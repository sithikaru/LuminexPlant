import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isHydrated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  setHydrated: (hydrated: boolean) => void
  validateToken: () => Promise<boolean>
  hasPermission: (requiredRoles: UserRole[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,

      setAuth: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
        // Store in localStorage for axios interceptor
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
        // Clear from localStorage
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated })
      },

      validateToken: async () => {
        const { token, user } = get()
        if (!token || !user) {
          return false
        }

        try {
          // Try to make an API call to validate the token
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          if (response.ok) {
            return true
          } else {
            // Token is invalid, clear auth
            get().clearAuth()
            return false
          }
        } catch (error) {
          // Network error or other issue, assume token is still valid for now
          console.warn('Token validation failed due to network error:', error)
          return true
        }
      },

      hasPermission: (requiredRoles: UserRole[]) => {
        const { user } = get()
        if (!user) return false
        return requiredRoles.includes(user.role)
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true)
        }
      },
    }
  )
)
