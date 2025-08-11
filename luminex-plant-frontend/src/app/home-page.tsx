'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/types'
import { Loader2, Leaf } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (user) {
        // Redirect to appropriate dashboard based on user role
        switch (user.role) {
          case UserRole.SUPER_ADMIN:
            router.push('/admin')
            break
          case UserRole.MANAGER:
            router.push('/manager')
            break
          case UserRole.FIELD_OFFICER:
            router.push('/officer')
            break
          default:
            router.push('/login')
        }
      }
    }
  }, [isAuthenticated, user, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center">
        <div className="flex items-center justify-center mb-8">
          <Leaf className="h-16 w-16 text-green-600 animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">LuminexPlant</h1>
        <p className="text-gray-600 mb-8">Digital Plant Processing & Tracking System</p>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-green-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    </div>
  )
}
