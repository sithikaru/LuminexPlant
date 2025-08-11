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
  Ruler
} from 'lucide-react'
import { analyticsAPI, userAPI, speciesAPI, zoneAPI, batchAPI } from '@/lib/api'
import { DashboardStats } from '@/types'
import { toast } from 'sonner'

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
            <span className="text-muted-foreground">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)

  // Fetch dashboard stats
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await analyticsAPI.getDashboardStats()
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await userAPI.getUserStats()
      return response.data.data
    },
  })

  // Fetch species count
  const { data: speciesData } = useQuery({
    queryKey: ['species-count'],
    queryFn: async () => {
      const response = await speciesAPI.getSpecies({ limit: 1 })
      return response.data.pagination.total
    },
  })

  // Fetch zones count
  const { data: zonesData } = useQuery({
    queryKey: ['zones-count'],
    queryFn: async () => {
      const response = await zoneAPI.getZones({ limit: 1 })
      return response.data.pagination.total
    },
  })

  const recentActivity = [
    {
      id: '1',
      type: 'batch_created',
      message: 'New batch PU250811003 created',
      time: '2 hours ago',
      status: 'success'
    },
    {
      id: '2',
      type: 'measurement_due',
      message: '15 batches due for measurement',
      time: '4 hours ago',
      status: 'warning'
    },
    {
      id: '3',
      type: 'batch_ready',
      message: 'Batch SG250810001 is ready for delivery',
      time: '1 day ago',
      status: 'info'
    },
    {
      id: '4',
      type: 'user_registered',
      message: 'New field officer registered',
      time: '2 days ago',
      status: 'success'
    },
  ]

  if (dashboardLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your plant processing and tracking system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 days
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={userStats?.totalUsers || 0}
          description={`${userStats?.activeUsers || 0} active users`}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Plant Species"
          value={speciesData || 0}
          description="Available species types"
          icon={<Sprout className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Active Batches"
          value={dashboardData?.activeBatches || 0}
          description={`${dashboardData?.readyBatches || 0} ready for delivery`}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Zones"
          value={zonesData || 0}
          description="Processing zones"
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Total Plants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardData?.totalPlants?.toLocaleString() || '0'}</div>
            <p className="text-muted-foreground">Across all batches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Ruler className="mr-2 h-5 w-5" />
              Measurements Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">23</div>
            <p className="text-muted-foreground">Growth measurements recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Operational
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2">All systems running normally</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-yellow-500' :
                  activity.status === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                }`} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Add New User
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Sprout className="mr-2 h-4 w-4" />
              Add Species
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <MapPin className="mr-2 h-4 w-4" />
              Create Zone
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Measurement Reminders</p>
                  <p className="text-sm text-muted-foreground">15 batches require weekly measurements</p>
                </div>
              </div>
              <Button size="sm" variant="outline">View</Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Capacity Alert</p>
                  <p className="text-sm text-muted-foreground">Zone B approaching maximum capacity</p>
                </div>
              </div>
              <Button size="sm" variant="outline">View</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
