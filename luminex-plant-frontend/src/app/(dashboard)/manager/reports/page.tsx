'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange, DateRange } from '@/components/ui/date-range-picker'
import { GrowthChart } from '@/components/charts/GrowthChart'
import { AnalyticsCharts } from '@/components/charts/AnalyticsCharts'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, TrendingUp, BarChart3, PieChart } from 'lucide-react'
import { addDays } from 'date-fns'
import { analyticsAPI, batchAPI } from '@/lib/api'

export default function ManagerReportsPage() {
  const [selectedBatch, setSelectedBatch] = useState<string>('all')
  const [reportType, setReportType] = useState<string>('summary')
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })

  const { data: batches } = useQuery({
    queryKey: ['batches'],
    queryFn: batchAPI.getBatches,
  })

  const { data: analytics } = useQuery({
    queryKey: ['analytics', selectedBatch, dateRange],
    queryFn: () => analyticsAPI.getDashboardStats(),
  })

  const { data: growthTrends } = useQuery({
    queryKey: ['growthTrends', selectedBatch, dateRange],
    queryFn: () => analyticsAPI.getGrowthTrends({
      batchId: selectedBatch !== 'all' ? selectedBatch : undefined,
      startDate: dateRange?.from,
      endDate: dateRange?.to,
    }),
  })

  // Handle nested API response structure safely
  const batchData = (() => {
    const data = batches?.data?.data || batches?.data || []
    return Array.isArray(data) ? data : []
  })()
  
  const analyticsData = analytics?.data || {}
  
  const growthData = (() => {
    const data = growthTrends?.data?.data || growthTrends?.data || []
    return Array.isArray(data) ? data : []
  })()

  const handleExportReport = () => {
    // Implement export functionality
    console.log('Exporting report...', { reportType, selectedBatch, dateRange })
  }

  const reportTypes = [
    { value: 'summary', label: 'Summary Report' },
    { value: 'growth', label: 'Growth Analysis' },
    { value: 'performance', label: 'Performance Report' },
    { value: 'compliance', label: 'Compliance Report' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports and analytics for plant operations
          </p>
        </div>
        <Button onClick={handleExportReport}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>
            Configure your report parameters and date range
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Batch Filter</label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batchData.length}</div>
            <p className="text-xs text-muted-foreground">
              In selected period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {batchData.length > 0 
                ? ((batchData.filter((b: any) => b.status === 'COMPLETED').length / batchData.length) * 100).toFixed(1)
                : 0}%
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
            <div className="text-2xl font-bold">
              {analyticsData.avgGrowthRate?.toFixed(2) || '0.00'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Per week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.efficiencyScore?.toFixed(1) || '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall efficiency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Content Based on Type */}
      {reportType === 'summary' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Batch Status Distribution</CardTitle>
              <CardDescription>
                Current status of all batches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['ACTIVE', 'COMPLETED', 'PAUSED', 'FAILED'].map((status) => {
                  const count = batchData.filter((b: any) => b.status === status).length
                  const percentage = batchData.length > 0 ? (count / batchData.length) * 100 : 0
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {status}
                        </Badge>
                        <span className="text-sm">{count} batches</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Latest updates and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {batchData.slice(0, 5).map((batch: any) => (
                  <div key={batch.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{batch.batchNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Started {new Date(batch.startDate).toLocaleDateString()}
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
      )}

      {reportType === 'growth' && (
        <Card>
          <CardHeader>
            <CardTitle>Growth Analysis</CardTitle>
            <CardDescription>
              Plant growth trends and measurements over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GrowthChart 
              measurements={growthData}
              targetGirth={50}
              targetHeight={100}
            />
          </CardContent>
        </Card>
      )}

      {reportType === 'performance' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Key performance indicators
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

          <Card>
            <CardHeader>
              <CardTitle>Efficiency Breakdown</CardTitle>
              <CardDescription>
                Detailed efficiency analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Resource Utilization</span>
                  <span className="font-bold">85%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Time Efficiency</span>
                  <span className="font-bold">92%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Quality Score</span>
                  <span className="font-bold">88%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Overall Performance</span>
                  <span className="font-bold text-green-600">Good</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === 'compliance' && (
        <Card>
          <CardHeader>
            <CardTitle>Compliance Report</CardTitle>
            <CardDescription>
              Regulatory compliance and quality standards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Quality Standards</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Temperature Control</span>
                      <Badge variant="default">Compliant</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Humidity Levels</span>
                      <Badge variant="default">Compliant</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">pH Monitoring</span>
                      <Badge variant="secondary">Needs Review</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Documentation</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Batch Records</span>
                      <Badge variant="default">Complete</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Measurement Logs</span>
                      <Badge variant="default">Complete</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Quality Assessments</span>
                      <Badge variant="default">Complete</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
