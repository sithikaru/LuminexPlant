'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GrowthChart } from '@/components/charts/GrowthChart'
import { ArrowLeft, Calendar, MapPin, Ruler, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { batchAPI, measurementAPI } from '@/lib/api'

export default function BatchDetailPage() {
  const params = useParams()
  const batchId = params.id as string

  const { data: batch, isLoading: batchLoading } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: () => batchAPI.getBatch(batchId),
    enabled: !!batchId,
  })

  const { data: measurements, isLoading: measurementsLoading } = useQuery({
    queryKey: ['batch-measurements', batchId],
    queryFn: () => measurementAPI.getMeasurements({ batchId }),
    enabled: !!batchId,
  })

  if (batchLoading || measurementsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  const batchData = batch?.data?.data
  const measurementData = measurements?.data?.data || []

  if (!batchData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Batch not found</h1>
        <Link href="/manager/batches">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Batches
          </Button>
        </Link>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressPercentage = () => {
    if (!batchData.startDate || !batchData.expectedHarvestDate) return 0
    
    const start = new Date(batchData.startDate).getTime()
    const end = new Date(batchData.expectedHarvestDate).getTime()
    const now = new Date().getTime()
    
    if (now <= start) return 0
    if (now >= end) return 100
    
    return Math.round(((now - start) / (end - start)) * 100)
  }

  // Prepare measurement data for charts
  const growthMeasurements = measurementData
    .filter((m: any) => ['HEIGHT', 'WIDTH'].includes(m.measurementType))
    .map((m: any) => ({
      id: m.id,
      girth: m.measurementType === 'WIDTH' ? m.value : 0,
      height: m.measurementType === 'HEIGHT' ? m.value : 0,
      createdAt: m.measurementDate || m.createdAt,
    }))

  const latestMeasurements = measurementData
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/manager/batches">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{batchData.batchNumber}</h1>
            <p className="text-muted-foreground">
              Batch details and monitoring
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(batchData.status)}>
          {batchData.status}
        </Badge>
      </div>

      {/* Batch Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variety</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{batchData.varietyName || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {batchData.location || 'No location'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{getProgressPercentage()}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Start Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {new Date(batchData.startDate).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.floor((new Date().getTime() - new Date(batchData.startDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Harvest</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {batchData.expectedHarvestDate 
                ? new Date(batchData.expectedHarvestDate).toLocaleDateString()
                : 'TBD'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {batchData.expectedHarvestDate 
                ? `${Math.floor((new Date(batchData.expectedHarvestDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`
                : 'Not set'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Growth Progress</CardTitle>
            <CardDescription>
              Height and girth measurements over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GrowthChart 
              measurements={growthMeasurements}
              targetGirth={50}
              targetHeight={100}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Batch Information</CardTitle>
            <CardDescription>
              Detailed batch specifications and notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Batch Number:</span>
                <span className="text-sm">{batchData.batchNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Variety:</span>
                <span className="text-sm">{batchData.varietyName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Location:</span>
                <span className="text-sm">{batchData.location || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Initial Quantity:</span>
                <span className="text-sm">{batchData.initialQuantity || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Current Quantity:</span>
                <span className="text-sm">{batchData.currentQuantity || batchData.initialQuantity || 'N/A'}</span>
              </div>
            </div>
            {batchData.notes && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Notes:</h4>
                <p className="text-sm text-muted-foreground">{batchData.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Measurements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Measurements</CardTitle>
          <CardDescription>
            Latest measurements for this batch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {latestMeasurements.map((measurement: any) => (
              <div key={measurement.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{measurement.measurementType}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(measurement.measurementDate || measurement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{measurement.value?.toFixed(2)} {measurement.unit}</p>
                  {measurement.notes && (
                    <p className="text-xs text-muted-foreground">{measurement.notes}</p>
                  )}
                </div>
              </div>
            ))}
            {latestMeasurements.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No measurements recorded yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
