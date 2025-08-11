import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  hasPermission: (requiredRoles: UserRole[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

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
    }
  )
)
