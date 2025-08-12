'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Search, Edit, Trash2, Ruler, Activity, TrendingUp } from 'lucide-react'
import { measurementAPI, batchAPI } from '@/lib/api'
import { MeasurementForm } from '@/components/forms/MeasurementForm'

export default function OfficerMeasurementsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [batchFilter, setBatchFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: measurements, isLoading } = useQuery({
    queryKey: ['measurements'],
    queryFn: measurementAPI.getMeasurements,
  })

  const { data: batches } = useQuery({
    queryKey: ['batches'],
    queryFn: batchAPI.getBatches,
  })

  const createMeasurementMutation = useMutation({
    mutationFn: measurementAPI.createMeasurement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] })
      toast.success('Measurement recorded successfully')
      setIsCreateDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record measurement')
    },
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

  const filteredMeasurements = measurementsData.filter((measurement: any) => {
    const matchesSearch = measurement.batch?.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         measurement.measurementType?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || measurement.measurementType === typeFilter
    return matchesSearch && matchesType
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'HEIGHT':
        return 'bg-blue-100 text-blue-800'
      case 'WIDTH':
        return 'bg-green-100 text-green-800'
      case 'WEIGHT':
        return 'bg-purple-100 text-purple-800'
      case 'pH':
        return 'bg-yellow-100 text-yellow-800'
      case 'TEMPERATURE':
        return 'bg-red-100 text-red-800'
      case 'HUMIDITY':
        return 'bg-cyan-100 text-cyan-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreateMeasurement = async (data: any) => {
    createMeasurementMutation.mutate(data)
  }

  // Get recent measurements for quick stats
  const todayMeasurements = filteredMeasurements.filter((m: any) => 
    new Date(m.createdAt).toDateString() === new Date().toDateString()
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Record Measurements</h1>
          <p className="text-muted-foreground">
            Record and track plant measurements and environmental data
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Measurement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record New Measurement</DialogTitle>
              <DialogDescription>
                Record a new measurement for a batch
              </DialogDescription>
            </DialogHeader>
            <MeasurementForm 
              onSubmit={handleCreateMeasurement}
              batches={batches?.data?.data || []}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Measurements</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayMeasurements.length}</div>
            <p className="text-xs text-muted-foreground">
              Recorded today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Measurements</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredMeasurements.length}</div>
            <p className="text-xs text-muted-foreground">
              All measurements
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Measurements</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredMeasurements.filter((m: any) => 
                ['HEIGHT', 'WIDTH', 'WEIGHT'].includes(m.measurementType)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Height, width, weight
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Environmental</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredMeasurements.filter((m: any) => 
                ['TEMPERATURE', 'HUMIDITY', 'pH'].includes(m.measurementType)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Temp, humidity, pH
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search measurements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches?.data?.data?.map((batch: any) => (
              <SelectItem key={batch.id} value={batch.id}>
                {batch.batchNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="HEIGHT">Height</SelectItem>
            <SelectItem value="WIDTH">Width</SelectItem>
            <SelectItem value="WEIGHT">Weight</SelectItem>
            <SelectItem value="TEMPERATURE">Temperature</SelectItem>
            <SelectItem value="HUMIDITY">Humidity</SelectItem>
            <SelectItem value="pH">pH Level</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recent Measurements */}
      <Card>
        <CardHeader>
          <CardTitle>My Recent Measurements</CardTitle>
          <CardDescription>
            Measurements you have recorded recently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeasurements.slice(0, 10).map((measurement: any) => (
                <TableRow key={measurement.id}>
                  <TableCell className="font-medium">
                    {measurement.batch?.batchNumber || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(measurement.measurementType)}>
                      {measurement.measurementType}
                    </Badge>
                  </TableCell>
                  <TableCell>{measurement.value?.toFixed(2) || 'N/A'}</TableCell>
                  <TableCell>{measurement.unit || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">
                        {new Date(measurement.measurementDate || measurement.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(measurement.measurementDate || measurement.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {measurement.notes || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Action Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => setIsCreateDialogOpen(true)}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Ruler className="h-5 w-5" />
              <span>Growth Measurement</span>
            </CardTitle>
            <CardDescription>
              Record height, width, or weight measurements
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => setIsCreateDialogOpen(true)}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Environmental Check</span>
            </CardTitle>
            <CardDescription>
              Record temperature, humidity, or pH levels
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => setIsCreateDialogOpen(true)}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Quality Assessment</span>
            </CardTitle>
            <CardDescription>
              Record quality metrics and observations
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
