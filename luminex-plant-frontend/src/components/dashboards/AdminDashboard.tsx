'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Sprout, 
  Package, 
  MapPin, 
  BarChart3, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Ruler,
  Settings,
  Plus
} from 'lucide-react'
import { analyticsAPI, userAPI, speciesAPI, zoneAPI, batchAPI } from '@/lib/api'
import { toast } from 'sonner'
import Link from 'next/link'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center space-x-2 text-xs mt-2">
            <TrendingUp className={`h-3 w-3 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`} />
            <span className={trend.isPositive ? 'text-green-500' : 'text-red-500'}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)

  const { data: dashboardStats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: analyticsAPI.getDashboardStats,
  })

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: userAPI.getUsers,
  })

  const { data: species } = useQuery({
    queryKey: ['species'],
    queryFn: speciesAPI.getSpecies,
  })

  const { data: zones } = useQuery({
    queryKey: ['zones'],
    queryFn: zoneAPI.getZones,
  })

  const { data: batches } = useQuery({
    queryKey: ['batches'],
    queryFn: batchAPI.getBatches,
  })

  // Handle nested API response structure safely
  const usersData = (() => {
    const data = users?.data?.data || users?.data || []
    return Array.isArray(data) ? data : []
  })()

  const speciesData = (() => {
    const data = species?.data?.data || species?.data || []
    return Array.isArray(data) ? data : []
  })()

  const zonesData = (() => {
    const data = zones?.data?.data || zones?.data || []
    return Array.isArray(data) ? data : []
  })()

  const batchesData = (() => {
    const data = batches?.data?.data || batches?.data || []
    return Array.isArray(data) ? data : []
  })()

  const activeUsers = usersData.filter((user: any) => user.isActive).length
  const activeBatches = batchesData.filter((batch: any) => batch.status === 'ACTIVE').length
  const activeZones = zonesData.filter((zone: any) => zone.isActive).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and administrative controls
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/users">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={usersData.length}
          description={`${activeUsers} active users`}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Plant Species"
          value={speciesData.length}
          description="Species in system"
          icon={<Sprout className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Active Batches"
          value={activeBatches}
          description={`${batchesData.length} total batches`}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Zones"
          value={activeZones}
          description={`${zonesData.length} total zones`}
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Management</span>
            </CardTitle>
            <CardDescription>Manage system users and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/users">
                <Button className="w-full" variant="outline">View All Users</Button>
              </Link>
              <Link href="/users/new">
                <Button className="w-full">Add New User</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Batch Management</span>
            </CardTitle>
            <CardDescription>Monitor and manage plant batches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/batches">
                <Button className="w-full" variant="outline">View All Batches</Button>
              </Link>
              <Link href="/batches/new">
                <Button className="w-full">Create New Batch</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Analytics</span>
            </CardTitle>
            <CardDescription>System analytics and reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/analytics">
                <Button className="w-full" variant="outline">View Analytics</Button>
              </Link>
              <Link href="/reports">
                <Button className="w-full">Generate Report</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Recently added users to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {usersData.slice(0, 5).map((user: any) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                    {user.role.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Batches</CardTitle>
            <CardDescription>Recently created batches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {batchesData.slice(0, 5).map((batch: any) => (
                <div key={batch.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{batch.batchNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {batch.varietyName || 'Unknown variety'}
                    </p>
                  </div>
                  <Badge variant={batch.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {batch.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
