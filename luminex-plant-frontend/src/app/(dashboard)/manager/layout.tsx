import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import ProtectedRoute from '@/components/layouts/ProtectedRoute'
import { UserRole } from '@/types'

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.MANAGER]}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
