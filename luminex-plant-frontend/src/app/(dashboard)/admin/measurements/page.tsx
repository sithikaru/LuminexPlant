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
import { Plus, Search, Edit, Trash2, Ruler, TrendingUp, Activity } from 'lucide-react'
import { measurementAPI } from '@/lib/api'
import { MeasurementForm } from '@/components/forms/MeasurementForm'
import { convertLength, LengthUnit } from '@/lib/units'

export default function MeasurementsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: measurements, isLoading } = useQuery({
    queryKey: ['measurements'],
    queryFn: measurementAPI.getMeasurements,
  })

  const { data: batches } = useQuery({
    queryKey: ['batches'],
    queryFn: () => fetch('/api/batches').then(res => res.json()),
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

  const deleteMeasurementMutation = useMutation({
    mutationFn: measurementAPI.deleteMeasurement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] })
      toast.success('Measurement deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete measurement')
    },
  })

  const filteredMeasurements = measurements?.data?.data?.filter((measurement: any) => {
    const matchesSearch = measurement.batch?.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         measurement.measurementType?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || measurement.measurementType === typeFilter
    return matchesSearch && matchesType
  }) || []

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

  const handleDeleteMeasurement = async (measurementId: string) => {
    if (confirm('Are you sure you want to delete this measurement?')) {
      deleteMeasurementMutation.mutate(measurementId)
    }
  }

  const handleCreateMeasurement = async (data: any) => {
    createMeasurementMutation.mutate(data)
  }

  const formatValue = (value: number, unit: string, type: string) => {
    if (!value || !unit) return 'N/A'
    
    // Convert to display unit if needed
    const displayValue = convertUnit(value, unit, unit) // Use same unit for now
    return `${displayValue.toFixed(2)} ${unit}`
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Measurement Management</h1>
          <p className="text-muted-foreground">
            Track and manage plant measurements and environmental data
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Measurement
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Measurements</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredMeasurements.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Measurements</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredMeasurements.filter((measurement: any) => 
                new Date(measurement.createdAt).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Measurements</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredMeasurements.filter((measurement: any) => 
                ['HEIGHT', 'WIDTH', 'WEIGHT'].includes(measurement.measurementType)
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Environmental</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredMeasurements.filter((measurement: any) => 
                ['TEMPERATURE', 'HUMIDITY', 'pH'].includes(measurement.measurementType)
              ).length}
            </div>
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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
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

      {/* Measurements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Measurements</CardTitle>
          <CardDescription>
            A list of all recorded measurements
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
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeasurements.map((measurement: any) => (
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
                    {new Date(measurement.measurementDate || measurement.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {measurement.notes || '-'}
                  </TableCell>
                  <TableCell>
                    {measurement.recordedBy?.firstName} {measurement.recordedBy?.lastName}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMeasurement(measurement.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
