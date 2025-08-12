'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange, DateRange } from '@/components/ui/date-range-picker'
import { Button } from '@/components/ui/button'
import { GrowthChart } from '@/components/charts/GrowthChart'
import { AnalyticsCharts } from '@/components/charts/AnalyticsCharts'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Activity, Target, Download } from 'lucide-react'
import { addDays } from 'date-fns'
import { analyticsAPI, batchAPI, measurementAPI } from '@/lib/api'

export default function AnalyticsPage() {
  const [selectedBatch, setSelectedBatch] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })

  const { data: batches } = useQuery({
    queryKey: ['batches'],
    queryFn: batchAPI.getBatches,
  })

  const { data: measurements } = useQuery({
    queryKey: ['measurements', selectedBatch, dateRange],
    queryFn: () => measurementAPI.getMeasurements({
      batchId: selectedBatch !== 'all' ? selectedBatch : undefined,
      startDate: dateRange?.from,
      endDate: dateRange?.to,
    }),
  })

  const { data: analytics } = useQuery({
    queryKey: ['analytics', selectedBatch, dateRange],
    queryFn: () => analyticsAPI.getDashboardStats(),
  })

  // Handle nested API response structure safely
  const batchData = (() => {
    const data = batches?.data?.data || batches?.data || []
    return Array.isArray(data) ? data : []
  })()
  
  const measurementData = (() => {
    const data = measurements?.data?.data || measurements?.data || []
    return Array.isArray(data) ? data : []
  })()
  
  const analyticsData = analytics?.data || {}

  // Calculate key metrics
  const totalBatches = batchData.length
  const activeBatches = batchData.filter((batch: any) => batch.status === 'ACTIVE').length
  const completedBatches = batchData.filter((batch: any) => batch.status === 'COMPLETED').length
  const avgGrowthRate = analyticsData.avgGrowthRate || 0
  const totalMeasurements = measurementData.length

  // Prepare chart data
  const chartData = measurementData
    .filter((m: any) => ['HEIGHT', 'WIDTH', 'WEIGHT'].includes(m.measurementType))
    .map((m: any) => ({
      date: new Date(m.measurementDate || m.createdAt).toISOString().split('T')[0],
      value: m.value,
      type: m.measurementType,
      batch: m.batch?.batchNumber || 'Unknown',
    }))

  const handleExport = () => {
    // Implement data export functionality
    console.log('Exporting analytics data...')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for plant processing operations
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batchData.map((batch: any) => (
              <SelectItem key={batch.id} value={batch.id}>
                {batch.batchNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBatches}</div>
            <p className="text-xs text-muted-foreground">
              {activeBatches} active, {completedBatches} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBatches}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBatches > 0 ? ((completedBatches / totalBatches) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgGrowthRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              Per week average
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Measurements</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMeasurements}</div>
            <p className="text-xs text-muted-foreground">
              In selected period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Growth Trends</CardTitle>
            <CardDescription>
              Plant growth measurements over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GrowthChart 
              measurements={chartData.map((d: any) => ({
                id: d.batch + d.date,
                girth: d.type === 'WIDTH' ? d.value : 0,
                height: d.type === 'HEIGHT' ? d.value : 0,
                createdAt: d.date
              }))}
              targetGirth={50}
              targetHeight={100}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Analytics Overview</CardTitle>
            <CardDescription>
              Key performance indicators and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsCharts 
              speciesDistribution={analyticsData.speciesDistribution || []}
              stagePipeline={analyticsData.stagePipeline || []}
              zoneUtilization={analyticsData.zoneUtilization || []}
            />
          </CardContent>
        </Card>
      </div>

      {/* Batch Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Performance Summary</CardTitle>
          <CardDescription>
            Performance metrics for each batch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {batchData.map((batch: any) => (
              <div
                key={batch.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <p className="font-medium">{batch.batchNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {batch.varietyName || 'Unknown variety'}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge 
                    variant={batch.status === 'ACTIVE' ? 'default' : 
                             batch.status === 'COMPLETED' ? 'secondary' : 'destructive'}
                  >
                    {batch.status}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(batch.startDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {batch.initialQuantity || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">Initial Qty</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
