'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  Ruler,
  Plus,
  Activity,
  Target,
  TrendingUp
} from 'lucide-react'
import { measurementAPI, batchAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
  dueDate: string
  batchId?: string
  batchNumber?: string
}

// Mock tasks - in real app this would come from API
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Record plant measurements for Batch B001',
    description: 'Measure height, girth, and overall health status',
    priority: 'HIGH',
    status: 'PENDING',
    dueDate: new Date().toISOString(),
    batchId: 'b1',
    batchNumber: 'B001',
  },
  {
    id: '2',
    title: 'Check environmental conditions',
    description: 'Monitor temperature and humidity levels',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
  },
]

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  color?: string
}

function StatsCard({ title, value, description, icon, color = 'text-muted-foreground' }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function OfficerDashboard() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: measurements } = useQuery({
    queryKey: ['my-measurements'],
    queryFn: measurementAPI.getMeasurements,
  })

  const { data: batches } = useQuery({
    queryKey: ['batches'],
    queryFn: batchAPI.getBatches,
  })

  // Handle nested API response structure safely
  const measurementsData = (() => {
    const data = measurements?.data?.data || measurements?.data || []
    return Array.isArray(data) ? data : []
  })()

  const batchesData = (() => {
    const data = batches?.data?.data || batches?.data || []
    return Array.isArray(data) ? data : []
  })()

  // Calculate today's measurements
  const todayMeasurements = measurementsData.filter((m: any) => 
    new Date(m.createdAt).toDateString() === new Date().toDateString()
  ).length

  // Calculate task statistics
  const pendingTasks = mockTasks.filter(t => t.status === 'PENDING').length
  const inProgressTasks = mockTasks.filter(t => t.status === 'IN_PROGRESS').length
  const overdueTasks = mockTasks.filter(t => t.status === 'OVERDUE').length

  const activeBatches = batchesData.filter((batch: any) => batch.status === 'ACTIVE').length

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'OVERDUE':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Field Officer Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName}! Here are your daily tasks and measurements.
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/measurements/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Measurement
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Measurements"
          value={todayMeasurements}
          description="Recorded today"
          icon={<Ruler className="h-4 w-4" />}
          color="text-blue-500"
        />
        <StatsCard
          title="Pending Tasks"
          value={pendingTasks}
          description="Awaiting completion"
          icon={<Clock className="h-4 w-4" />}
          color="text-yellow-500"
        />
        <StatsCard
          title="In Progress"
          value={inProgressTasks}
          description="Currently working on"
          icon={<Activity className="h-4 w-4" />}
          color="text-blue-500"
        />
        <StatsCard
          title="Active Batches"
          value={activeBatches}
          description="Requiring attention"
          icon={<Target className="h-4 w-4" />}
          color="text-green-500"
        />
      </div>

      {/* Urgent Tasks Alert */}
      {overdueTasks > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Urgent Attention Required</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              You have {overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''}. Please complete them as soon as possible.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Ruler className="h-5 w-5" />
              <span>Record Measurements</span>
            </CardTitle>
            <CardDescription>Record plant growth and environmental data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/measurements/growth">
                <Button className="w-full" variant="outline">Growth Measurement</Button>
              </Link>
              <Link href="/measurements/environmental">
                <Button className="w-full">Environmental Check</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>My Tasks</span>
            </CardTitle>
            <CardDescription>View and manage your assigned tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/tasks">
                <Button className="w-full" variant="outline">View All Tasks</Button>
              </Link>
              <Link href="/tasks/pending">
                <Button className="w-full">Pending Tasks ({pendingTasks})</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>My Performance</span>
            </CardTitle>
            <CardDescription>Track your daily performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <p>Today: {todayMeasurements} measurements</p>
                <p>This week: {measurementsData.length} total</p>
              </div>
              <Link href="/performance">
                <Button className="w-full" variant="outline">View Details</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Tasks</CardTitle>
          <CardDescription>Your assigned tasks for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(task.status)}
                  <div className="space-y-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    {task.batchNumber && (
                      <Badge variant="secondary" className="text-xs">
                        {task.batchNumber}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
            {mockTasks.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No tasks assigned for today. Great job!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Measurements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Measurements</CardTitle>
          <CardDescription>Your latest recorded measurements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {measurementsData.slice(0, 5).map((measurement: any) => (
              <div key={measurement.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{measurement.measurementType}</p>
                    <p className="text-sm text-muted-foreground">
                      {measurement.batch?.batchNumber || 'Unknown batch'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{measurement.value?.toFixed(2)} {measurement.unit}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(measurement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {measurementsData.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No measurements recorded yet. Start by recording your first measurement!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
