'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Sprout, 
  Package, 
  MapPin, 
  BarChart3, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Ruler
} from 'lucide-react'
import { analyticsAPI, speciesAPI, zoneAPI, batchAPI } from '@/lib/api'
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

export default function ManagerDashboard() {
  const [isLoading, setIsLoading] = useState(true)

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsAPI.getDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const { data: zones } = useQuery({
    queryKey: ['zones'],
    queryFn: zoneAPI.getZones,
  })

  const { data: batches } = useQuery({
    queryKey: ['batches'],
    queryFn: batchAPI.getBatches,
  })

  const { data: species } = useQuery({
    queryKey: ['species'],
    queryFn: speciesAPI.getSpecies,
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

  const recentBatches = Array.isArray(batches?.data?.data?.data) ? batches.data.data.data.slice(0, 5) : []
  const activeZones = Array.isArray(zones?.data?.data?.data) ? zones.data.data.data.filter((zone: any) => zone.isActive) : []

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Manager Dashboard</h2>
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
          title="Total Batches"
          value={dashboardStats?.data?.totalBatches || 0}
          description="Active production batches"
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Species Types"
          value={dashboardStats?.data?.totalSpecies || 0}
          description="Different plant varieties"
          icon={<Sprout className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Active Zones"
          value={activeZones.length}
          description="Production zones in use"
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Ready for Delivery"
          value={dashboardStats?.data?.readyBatches || 0}
          description="Batches awaiting shipment"
          icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Batches */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Batches</CardTitle>
            <CardDescription>
              Latest batch activities and status updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentBatches.map((batch: any) => (
                <div key={batch.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {batch.batchNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {batch.species?.name} - Qty: {batch.currentQty}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Badge 
                      variant={
                        batch.status === 'DELIVERED' ? 'default' :
                        batch.status === 'READY' ? 'secondary' :
                        'outline'
                      }
                    >
                      {batch.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Zone Overview */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Zone Overview</CardTitle>
            <CardDescription>
              Current status of production zones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeZones.slice(0, 6).map((zone: any) => (
                <div key={zone.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">{zone.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {zone._count?.beds || 0} beds
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
