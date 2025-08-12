import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import ProtectedRoute from '@/components/layouts/ProtectedRoute'
import { UserRole } from '@/types'

export default function OfficerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.FIELD_OFFICER]}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
