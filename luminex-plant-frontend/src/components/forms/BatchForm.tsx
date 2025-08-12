'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { batchSchema, type BatchData } from '@/lib/validations'

interface BatchFormProps {
  onSubmit: (data: BatchData) => Promise<void>
  species: Array<{ id: string; name: string }>
  isLoading?: boolean
  initialData?: Partial<BatchData>
}

export function BatchForm({ onSubmit, species, isLoading = false, initialData }: BatchFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<BatchData>({
    resolver: zodResolver(batchSchema),
    defaultValues: initialData
  })

  const handleFormSubmit = async (data: BatchData) => {
    try {
      await onSubmit(data)
      toast.success('Batch saved successfully!')
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Failed to save batch')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Batch' : 'Create New Batch'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="speciesId">Species *</Label>
              <Select
                value={watch('speciesId')}
                onValueChange={(value) => setValue('speciesId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  {species.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.speciesId && (
                <p className="text-sm text-red-600">{errors.speciesId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pathway">Pathway *</Label>
              <Select
                value={watch('pathway')}
                onValueChange={(value) => setValue('pathway', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pathway" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PURCHASING">Purchasing</SelectItem>
                  <SelectItem value="SEED_GERMINATION">Seed Germination</SelectItem>
                  <SelectItem value="CUTTING_GERMINATION">Cutting Germination</SelectItem>
                  <SelectItem value="OUT_SOURCING">Out Sourcing</SelectItem>
                </SelectContent>
              </Select>
              {errors.pathway && (
                <p className="text-sm text-red-600">{errors.pathway.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialQty">Initial Quantity *</Label>
              <Input
                id="initialQty"
                type="number"
                min="1"
                max="10000"
                {...register('initialQty', { valueAsNumber: true })}
                placeholder="Enter initial quantity"
              />
              {errors.initialQty && (
                <p className="text-sm text-red-600">{errors.initialQty.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customName">Custom Name (Optional)</Label>
              <Input
                id="customName"
                {...register('customName')}
                placeholder="Enter custom name"
              />
              {errors.customName && (
                <p className="text-sm text-red-600">{errors.customName.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Batch'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
