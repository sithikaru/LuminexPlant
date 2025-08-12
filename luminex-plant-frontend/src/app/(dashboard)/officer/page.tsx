'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  Ruler,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { analyticsAPI, batchAPI } from '@/lib/api'
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function OfficerDashboard() {
  const [isLoading, setIsLoading] = useState(true)

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsAPI.getDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const { data: batches } = useQuery({
    queryKey: ['batches'],
    queryFn: batchAPI.getBatches,
  })

  useEffect(() => {
    if (!statsLoading) {
      setIsLoading(false)
    }
  }, [statsLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  const myBatches = batches?.data || []
  const pendingMeasurements = myBatches.filter((batch: any) => 
    batch.stage === 'GROWING' || batch.stage === 'DEVELOPMENT'
  ).slice(0, 5)

  const recentTasks = [
    { id: 1, title: 'Weekly Measurement - Rubber Trees', dueDate: '2025-08-14', status: 'PENDING' },
    { id: 2, title: 'Move Avocado Seedlings', dueDate: '2025-08-16', status: 'IN_PROGRESS' },
    { id: 3, title: 'Zone A Maintenance', dueDate: '2025-08-18', status: 'PENDING' },
  ]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Field Officer Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Today
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="My Batches"
          value={myBatches.length}
          description="Batches under your care"
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Pending Measurements"
          value={pendingMeasurements.length}
          description="Measurements due this week"
          icon={<Ruler className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Tasks Complete"
          value={1}
          description="Tasks completed today"
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Pending Tasks"
          value={recentTasks.filter(t => t.status === 'PENDING').length}
          description="Tasks awaiting action"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Pending Measurements */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Pending Measurements</CardTitle>
            <CardDescription>
              Batches requiring growth measurements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {pendingMeasurements.map((batch: any) => (
                <div key={batch.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {batch.batchNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {batch.species?.name} - Qty: {batch.currentQty}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stage: {batch.stage}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Button size="sm" variant="outline">
                      <Ruler className="mr-2 h-4 w-4" />
                      Measure
                    </Button>
                  </div>
                </div>
              ))}
              {pendingMeasurements.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pending measurements
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Tasks */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>
              Your assigned tasks and deadlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {task.dueDate}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      task.status === 'COMPLETED' ? 'default' :
                      task.status === 'IN_PROGRESS' ? 'secondary' :
                      'outline'
                    }
                  >
                    {task.status}
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
