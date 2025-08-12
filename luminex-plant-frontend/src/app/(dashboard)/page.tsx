'use client'

import { useAuthStore } from '@/store/authStore'
import AdminDashboard from '@/components/dashboards/AdminDashboard'
import ManagerDashboard from '@/components/dashboards/ManagerDashboard'
import OfficerDashboard from '@/components/dashboards/OfficerDashboard'
import { LoadingPage } from '@/components/ui/loading'

export default function DashboardPage() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingPage />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please log in to access the dashboard.</p>
        </div>
      </div>
    )
  }

  // Render dashboard based on user role
  switch (user.role) {
    case 'SUPER_ADMIN':
      return <AdminDashboard />
    case 'MANAGER':
      return <ManagerDashboard />
    case 'FIELD_OFFICER':
      return <OfficerDashboard />
    default:
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Unknown Role</h1>
            <p className="text-muted-foreground">Your role is not recognized. Please contact an administrator.</p>
          </div>
        </div>
      )
  }
}
