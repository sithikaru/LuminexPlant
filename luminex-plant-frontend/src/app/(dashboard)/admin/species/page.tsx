'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Trash2, MoreHorizontal } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { speciesAPI } from '@/lib/api'
import { Species } from '@/types'

interface SpeciesFormData {
  name: string
  scientificName: string
  targetGirth: number
  targetHeight: number
  isActive: boolean
}

function SpeciesForm({ 
  species, 
  onSubmit, 
  onCancel 
}: { 
  species?: Species | null
  onSubmit: (data: SpeciesFormData) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<SpeciesFormData>({
    name: species?.name || '',
    scientificName: species?.scientificName || '',
    targetGirth: species?.targetGirth || 0,
    targetHeight: species?.targetHeight || 0,
    isActive: species?.isActive ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Species Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter species name"
          required
        />
      </div>

      <div>
        <Label htmlFor="scientificName">Scientific Name</Label>
        <Input
          id="scientificName"
          value={formData.scientificName}
          onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
          placeholder="Enter scientific name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="targetGirth">Target Girth (cm) *</Label>
          <Input
            id="targetGirth"
            type="number"
            step="0.1"
            min="0"
            value={formData.targetGirth}
            onChange={(e) => setFormData({ ...formData, targetGirth: parseFloat(e.target.value) || 0 })}
            placeholder="0.0"
            required
          />
        </div>

        <div>
          <Label htmlFor="targetHeight">Target Height (cm) *</Label>
          <Input
            id="targetHeight"
            type="number"
            step="0.1"
            min="0"
            value={formData.targetHeight}
            onChange={(e) => setFormData({ ...formData, targetHeight: parseFloat(e.target.value) || 0 })}
            placeholder="0.0"
            required
          />
        </div>
      </div>

      {species && (
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {species ? 'Update' : 'Create'} Species
        </Button>
      </div>
    </form>
  )
}

export default function SpeciesPage() {
  const [search, setSearch] = useState('')
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const queryClient = useQueryClient()

  // Fetch species
  const { data: speciesData, isLoading } = useQuery({
    queryKey: ['species', { search }],
    queryFn: async () => {
      const response = await speciesAPI.getSpecies({ search })
      return response.data
    },
  })

  // Create species mutation
  const createSpeciesMutation = useMutation({
    mutationFn: (data: SpeciesFormData) => speciesAPI.createSpecies(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['species'] })
      setShowCreateDialog(false)
      toast.success('Species created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create species')
    },
  })

  // Update species mutation
  const updateSpeciesMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SpeciesFormData> }) =>
      speciesAPI.updateSpecies(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['species'] })
      setShowEditDialog(false)
      setSelectedSpecies(null)
      toast.success('Species updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update species')
    },
  })

  // Delete species mutation
  const deleteSpeciesMutation = useMutation({
    mutationFn: (id: string) => speciesAPI.deleteSpecies(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['species'] })
      toast.success('Species deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete species')
    },
  })

  const handleCreateSpecies = (data: SpeciesFormData) => {
    createSpeciesMutation.mutate(data)
  }

  const handleUpdateSpecies = (data: SpeciesFormData) => {
    if (selectedSpecies) {
      updateSpeciesMutation.mutate({ id: selectedSpecies.id, data })
    }
  }

  const handleDeleteSpecies = (species: Species) => {
    if (confirm(`Are you sure you want to delete "${species.name}"?`)) {
      deleteSpeciesMutation.mutate(species.id)
    }
  }

  const species = speciesData?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Species Management</h2>
          <p className="text-muted-foreground">
            Manage plant species and their target specifications
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Species
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Species</DialogTitle>
              <DialogDescription>
                Add a new plant species to the system
              </DialogDescription>
            </DialogHeader>
            <SpeciesForm
              onSubmit={handleCreateSpecies}
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
            placeholder="Search species..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Species Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Species ({species.length})</CardTitle>
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
                  <TableHead>Scientific Name</TableHead>
                  <TableHead>Target Girth</TableHead>
                  <TableHead>Target Height</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {species.map((species: any) => (
                  <TableRow key={species.id}>
                    <TableCell className="font-medium">{species.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {species.scientificName || '-'}
                    </TableCell>
                    <TableCell>{species.targetGirth} cm</TableCell>
                    <TableCell>{species.targetHeight} cm</TableCell>
                    <TableCell>
                      <Badge variant={species.isActive ? 'default' : 'secondary'}>
                        {species.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {species._count?.batches || 0}
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
                              setSelectedSpecies(species)
                              setShowEditDialog(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteSpecies(species)}
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
            <DialogTitle>Edit Species</DialogTitle>
            <DialogDescription>
              Update species information and settings
            </DialogDescription>
          </DialogHeader>
          <SpeciesForm
            species={selectedSpecies}
            onSubmit={handleUpdateSpecies}
            onCancel={() => {
              setShowEditDialog(false)
              setSelectedSpecies(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
