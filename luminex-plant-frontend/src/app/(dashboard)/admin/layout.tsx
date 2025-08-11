import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import ProtectedRoute from '@/components/layouts/ProtectedRoute'
import { UserRole } from '@/types'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
