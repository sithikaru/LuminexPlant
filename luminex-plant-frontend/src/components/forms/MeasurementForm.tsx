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
import { measurementSchema, type MeasurementData } from '@/lib/validations'
import { GIRTH_RANGES, HEIGHT_RANGES } from '@/lib/units'

interface MeasurementFormProps {
  onSubmit: (data: MeasurementData) => Promise<void>
  batches: Array<{ id: string; batchNumber: string; species: { name: string } }>
  isLoading?: boolean
  initialData?: Partial<MeasurementData>
  showBatchSelect?: boolean
}

export function MeasurementForm({ 
  onSubmit, 
  batches, 
  isLoading = false, 
  initialData,
  showBatchSelect = true 
}: MeasurementFormProps) {
  const [measurementType, setMeasurementType] = useState<'individual' | 'range'>('individual')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<MeasurementData>({
    resolver: zodResolver(measurementSchema),
    defaultValues: initialData
  })

  const handleFormSubmit = async (data: MeasurementData) => {
    try {
      await onSubmit(data)
      toast.success('Measurement saved successfully!')
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Failed to save measurement')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Measurement' : 'Record New Measurement'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {showBatchSelect && (
            <div className="space-y-2">
              <Label htmlFor="batchId">Batch *</Label>
              <Select
                value={watch('batchId')}
                onValueChange={(value) => setValue('batchId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batchNumber} - {batch.species.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.batchId && (
                <p className="text-sm text-red-600">{errors.batchId.message}</p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex space-x-4">
              <Button
                type="button"
                variant={measurementType === 'individual' ? 'default' : 'outline'}
                onClick={() => setMeasurementType('individual')}
              >
                Individual Measurement
              </Button>
              <Button
                type="button"
                variant={measurementType === 'range' ? 'default' : 'outline'}
                onClick={() => setMeasurementType('range')}
              >
                Range Measurement
              </Button>
            </div>

            {measurementType === 'individual' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="girth">Girth (cm) *</Label>
                  <Input
                    id="girth"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    {...register('girth', { valueAsNumber: true })}
                    placeholder="Enter girth"
                  />
                  {errors.girth && (
                    <p className="text-sm text-red-600">{errors.girth.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm) *</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    min="1"
                    max="1000"
                    {...register('height', { valueAsNumber: true })}
                    placeholder="Enter height"
                  />
                  {errors.height && (
                    <p className="text-sm text-red-600">{errors.height.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sampleSize">Sample Size *</Label>
                  <Input
                    id="sampleSize"
                    type="number"
                    min="1"
                    max="100"
                    {...register('sampleSize', { valueAsNumber: true })}
                    placeholder="Enter sample size"
                  />
                  {errors.sampleSize && (
                    <p className="text-sm text-red-600">{errors.sampleSize.message}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="girthRange">Girth Range *</Label>
                  <Select onValueChange={(value) => setValue('girth', parseFloat(value.split('-')[0]) as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select girth range" />
                    </SelectTrigger>
                    <SelectContent>
                      {GIRTH_RANGES.map((range) => (
                        <SelectItem key={range.label} value={`${range.min}-${range.max}`}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heightRange">Height Range *</Label>
                  <Select onValueChange={(value) => setValue('height', parseFloat(value.split('-')[0]) as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select height range" />
                    </SelectTrigger>
                    <SelectContent>
                      {HEIGHT_RANGES.map((range) => (
                        <SelectItem key={range.label} value={`${range.min}-${range.max}`}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sampleSize">Quantity *</Label>
                  <Input
                    id="sampleSize"
                    type="number"
                    min="1"
                    max="10000"
                    {...register('sampleSize', { valueAsNumber: true })}
                    placeholder="Enter quantity"
                  />
                  {errors.sampleSize && (
                    <p className="text-sm text-red-600">{errors.sampleSize.message}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Enter any additional notes"
                rows={3}
              />
              {errors.notes && (
                <p className="text-sm text-red-600">{errors.notes.message}</p>
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
                'Save Measurement'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
