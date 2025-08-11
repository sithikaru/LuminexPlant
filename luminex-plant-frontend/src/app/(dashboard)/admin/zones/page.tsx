'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Trash2, MoreHorizontal, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { zoneAPI } from '@/lib/api'
import { Zone } from '@/types'

interface ZoneFormData {
  name: string
  capacity: number
  isActive: boolean
  beds: {
    name: string
    capacity: number
  }[]
}

function ZoneForm({ 
  zone, 
  onSubmit, 
  onCancel 
}: { 
  zone?: Zone | null
  onSubmit: (data: ZoneFormData) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<ZoneFormData>({
    name: zone?.name || '',
    capacity: zone?.capacity || 0,
    isActive: zone?.isActive ?? true,
    beds: zone?.beds?.map(bed => ({
      name: bed.name,
      capacity: bed.capacity
    })) || []
  })

  const addBed = () => {
    setFormData({
      ...formData,
      beds: [...formData.beds, { name: '', capacity: 0 }]
    })
  }

  const removeBed = (index: number) => {
    setFormData({
      ...formData,
      beds: formData.beds.filter((_, i) => i !== index)
    })
  }

  const updateBed = (index: number, field: 'name' | 'capacity', value: string | number) => {
    const newBeds = [...formData.beds]
    newBeds[index] = { ...newBeds[index], [field]: value }
    setFormData({ ...formData, beds: newBeds })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Zone Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter zone name"
          required
        />
      </div>

      <div>
        <Label htmlFor="capacity">Total Capacity *</Label>
        <Input
          id="capacity"
          type="number"
          min="1"
          value={formData.capacity}
          onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
          placeholder="Enter total capacity"
          required
        />
      </div>

      {zone && (
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      )}

      {!zone && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Beds (Optional)</Label>
            <Button type="button" variant="outline" size="sm" onClick={addBed}>
              <Plus className="mr-2 h-4 w-4" />
              Add Bed
            </Button>
          </div>
          
          {formData.beds.map((bed, index) => (
            <div key={index} className="flex items-center space-x-2 p-4 border rounded-lg">
              <Input
                placeholder="Bed name"
                value={bed.name}
                onChange={(e) => updateBed(index, 'name', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Capacity"
                value={bed.capacity}
                onChange={(e) => updateBed(index, 'capacity', parseInt(e.target.value) || 0)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeBed(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {zone ? 'Update' : 'Create'} Zone
        </Button>
      </div>
    </form>
  )
}

export default function ZonesPage() {
  const [search, setSearch] = useState('')
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const queryClient = useQueryClient()

  // Fetch zones
  const { data: zonesData, isLoading } = useQuery({
    queryKey: ['zones', { search }],
    queryFn: async () => {
      const response = await zoneAPI.getZones({ search })
      return response.data
    },
  })

  // Create zone mutation
  const createZoneMutation = useMutation({
    mutationFn: (data: ZoneFormData) => zoneAPI.createZone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] })
      setShowCreateDialog(false)
      toast.success('Zone created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create zone')
    },
  })

  // Update zone mutation
  const updateZoneMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ZoneFormData> }) =>
      zoneAPI.updateZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] })
      setShowEditDialog(false)
      setSelectedZone(null)
      toast.success('Zone updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update zone')
    },
  })

  // Delete zone mutation
  const deleteZoneMutation = useMutation({
    mutationFn: (id: string) => zoneAPI.deleteZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] })
      toast.success('Zone deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete zone')
    },
  })

  const handleCreateZone = (data: ZoneFormData) => {
    createZoneMutation.mutate(data)
  }

  const handleUpdateZone = (data: ZoneFormData) => {
    if (selectedZone) {
      updateZoneMutation.mutate({ id: selectedZone.id, data })
    }
  }

  const handleDeleteZone = (zone: Zone) => {
    if (confirm(`Are you sure you want to delete "${zone.name}"?`)) {
      deleteZoneMutation.mutate(zone.id)
    }
  }

  const zones = zonesData?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Zone Management</h2>
          <p className="text-muted-foreground">
            Manage processing zones and their capacity
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Zone</DialogTitle>
              <DialogDescription>
                Add a new processing zone to the system
              </DialogDescription>
            </DialogHeader>
            <ZoneForm
              onSubmit={handleCreateZone}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search zones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Zone Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Zones</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.length}</div>
            <p className="text-xs text-muted-foreground">
              Active processing zones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {zones.reduce((sum: number, zone: any) => sum + zone.capacity, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Plants across all zones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Utilization</CardTitle>
            <Progress className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {zones.length > 0 
                ? Math.round(zones.reduce((sum: number, zone: any) => sum + (zone.utilizationPercentage || 0), 0) / zones.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all zones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Zones Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Zones ({zones.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Occupied</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Beds</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone: any) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.name}</TableCell>
                    <TableCell>{zone.capacity.toLocaleString()}</TableCell>
                    <TableCell>{(zone.currentOccupancy || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={zone.utilizationPercentage || 0} 
                          className="w-16"
                        />
                        <span className="text-sm text-muted-foreground">
                          {zone.utilizationPercentage || 0}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {zone._count?.beds || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={zone.isActive ? 'default' : 'secondary'}>
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedZone(zone)
                              setShowEditDialog(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteZone(zone)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Zone</DialogTitle>
            <DialogDescription>
              Update zone information and settings
            </DialogDescription>
          </DialogHeader>
          <ZoneForm
            zone={selectedZone}
            onSubmit={handleUpdateZone}
            onCancel={() => {
              setShowEditDialog(false)
              setSelectedZone(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
