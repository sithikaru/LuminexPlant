'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  FileText,
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react'
import { batchAPI, analyticsAPI } from '@/lib/api'
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

export default function ManagerDashboard() {
  const { data: batches } = useQuery({
    queryKey: ['batches'],
    queryFn: batchAPI.getBatches,
  })

  const { data: analytics } = useQuery({
    queryKey: ['manager-analytics'],
    queryFn: analyticsAPI.getDashboardStats,
  })

  // Handle nested API response structure safely
  const batchesData = (() => {
    const data = batches?.data?.data || batches?.data || []
    return Array.isArray(data) ? data : []
  })()

  const analyticsData = analytics?.data || {}

  const activeBatches = batchesData.filter((batch: any) => batch.status === 'ACTIVE').length
  const completedBatches = batchesData.filter((batch: any) => batch.status === 'COMPLETED').length
  const pendingHarvest = batchesData.filter((batch: any) => {
    if (batch.status !== 'ACTIVE' || !batch.expectedHarvestDate) return false
    const daysToHarvest = Math.floor((new Date(batch.expectedHarvestDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysToHarvest <= 7
  }).length

  const getProgressPercentage = (batch: any) => {
    if (!batch.startDate || !batch.expectedHarvestDate) return 0
    
    const start = new Date(batch.startDate).getTime()
    const end = new Date(batch.expectedHarvestDate).getTime()
    const now = new Date().getTime()
    
    if (now <= start) return 0
    if (now >= end) return 100
    
    return Math.round(((now - start) / (end - start)) * 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor operations and track batch progress
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/reports">
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </Link>
          <Link href="/analytics">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Batches"
          value={batchesData.length}
          description="All batches in system"
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Active Batches"
          value={activeBatches}
          description="Currently processing"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Pending Harvest"
          value={pendingHarvest}
          description="Ready within 7 days"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Completed"
          value={completedBatches}
          description="Successfully processed"
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Batch Monitoring</span>
            </CardTitle>
            <CardDescription>Track batch progress and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/batches">
                <Button className="w-full" variant="outline">View All Batches</Button>
              </Link>
              <Link href="/batches/active">
                <Button className="w-full">Active Batches</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Reports & Analytics</span>
            </CardTitle>
            <CardDescription>Generate reports and view analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/reports">
                <Button className="w-full" variant="outline">View Reports</Button>
              </Link>
              <Link href="/analytics">
                <Button className="w-full">Analytics Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Alerts & Issues</span>
            </CardTitle>
            <CardDescription>Monitor system alerts and issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {pendingHarvest > 0 ? `${pendingHarvest} batches ready for harvest` : 'No immediate alerts'}
              </div>
              <Link href="/alerts">
                <Button className="w-full" variant="outline">View All Alerts</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Progress Overview</CardTitle>
          <CardDescription>Current status of active batches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {batchesData
              .filter((batch: any) => batch.status === 'ACTIVE')
              .slice(0, 6)
              .map((batch: any) => {
                const progress = getProgressPercentage(batch)
                return (
                  <div key={batch.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{batch.batchNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {batch.varietyName || 'Unknown variety'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{progress}% Complete</p>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <Badge variant={progress >= 80 ? 'default' : 'secondary'}>
                        {progress >= 80 ? 'Ready Soon' : 'Processing'}
                      </Badge>
                      <Link href={`/batches/${batch.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            {activeBatches === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No active batches at the moment
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>This Month's Performance</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Success Rate</span>
                <span className="font-bold">
                  {batchesData.length > 0 
                    ? ((completedBatches / batchesData.length) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Average Growth Rate</span>
                <span className="font-bold">{analyticsData.avgGrowthRate?.toFixed(2) || '0.00'}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Efficiency Score</span>
                <span className="font-bold">{analyticsData.efficiencyScore?.toFixed(1) || '0.0'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Milestones</CardTitle>
            <CardDescription>Important dates and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {batchesData
                .filter((batch: any) => batch.expectedHarvestDate && batch.status === 'ACTIVE')
                .sort((a: any, b: any) => new Date(a.expectedHarvestDate).getTime() - new Date(b.expectedHarvestDate).getTime())
                .slice(0, 4)
                .map((batch: any) => {
                  const daysLeft = Math.floor((new Date(batch.expectedHarvestDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={batch.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{batch.batchNumber}</p>
                        <p className="text-sm text-muted-foreground">Expected harvest</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {daysLeft > 0 ? `${daysLeft} days` : 'Ready now'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(batch.expectedHarvestDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
