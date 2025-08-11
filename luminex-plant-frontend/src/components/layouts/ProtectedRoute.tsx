'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/types'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  fallbackPath?: string
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, isLoading, hasPermission } = useAuthStore()

  useEffect(() => {
    // Allow access to auth pages when not authenticated
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
      if (isAuthenticated) {
        // Redirect authenticated users away from auth pages
        router.push('/')
      }
      return
    }

    // Protect other routes
    if (!isAuthenticated && !isLoading) {
      router.push(fallbackPath)
      return
    }

    // Check role permissions
    if (isAuthenticated && allowedRoles && allowedRoles.length > 0 && !hasPermission(allowedRoles)) {
      // Redirect to appropriate dashboard based on user role
      switch (user?.role) {
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
      return
    }
  }, [isAuthenticated, user, pathname, router, fallbackPath, allowedRoles, hasPermission, isLoading])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // For auth pages, show content regardless of authentication state
  if (pathname.startsWith('/auth/')) {
    return <>{children}</>
  }

  // For protected routes, only show content if authenticated and authorized
  if (!isAuthenticated) {
    return null
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasPermission(allowedRoles)) {
    return null
  }

  return <>{children}</>
}
