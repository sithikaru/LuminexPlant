export enum LengthUnit {
  CM = 'cm',
  MM = 'mm',
  INCH = 'inch',
  METER = 'm'
}

export const UNIT_CONVERSIONS: Record<LengthUnit, Record<LengthUnit, (value: number) => number>> = {
  [LengthUnit.CM]: {
    [LengthUnit.MM]: (value: number) => value * 10,
    [LengthUnit.CM]: (value: number) => value,
    [LengthUnit.INCH]: (value: number) => value / 2.54,
    [LengthUnit.METER]: (value: number) => value / 100,
  },
  [LengthUnit.MM]: {
    [LengthUnit.CM]: (value: number) => value / 10,
    [LengthUnit.MM]: (value: number) => value,
    [LengthUnit.INCH]: (value: number) => value / 25.4,
    [LengthUnit.METER]: (value: number) => value / 1000,
  },
  [LengthUnit.INCH]: {
    [LengthUnit.CM]: (value: number) => value * 2.54,
    [LengthUnit.MM]: (value: number) => value * 25.4,
    [LengthUnit.INCH]: (value: number) => value,
    [LengthUnit.METER]: (value: number) => value * 0.0254,
  },
  [LengthUnit.METER]: {
    [LengthUnit.CM]: (value: number) => value * 100,
    [LengthUnit.MM]: (value: number) => value * 1000,
    [LengthUnit.INCH]: (value: number) => value / 0.0254,
    [LengthUnit.METER]: (value: number) => value,
  },
}

export const convertLength = (
  value: number,
  fromUnit: LengthUnit,
  toUnit: LengthUnit
): number => {
  const converter = UNIT_CONVERSIONS[fromUnit]?.[toUnit]
  if (!converter) {
    throw new Error(`Conversion from ${fromUnit} to ${toUnit} not supported`)
  }
  return Number(converter(value).toFixed(2))
}

export const formatLength = (
  value: number,
  unit: LengthUnit,
  precision: number = 2
): string => {
  return `${value.toFixed(precision)} ${unit}`
}

// Predefined measurement ranges in CM (stored in database)
export const GIRTH_RANGES = [
  { label: '0.5-1.0 cm', min: 0.5, max: 1.0, value: '0.5-1.0' },
  { label: '1.0-1.5 cm', min: 1.0, max: 1.5, value: '1.0-1.5' },
  { label: '1.5-2.0 cm', min: 1.5, max: 2.0, value: '1.5-2.0' },
  { label: '2.0-2.5 cm', min: 2.0, max: 2.5, value: '2.0-2.5' },
  { label: '2.5-3.0 cm', min: 2.5, max: 3.0, value: '2.5-3.0' },
  { label: '3.0-4.0 cm', min: 3.0, max: 4.0, value: '3.0-4.0' },
  { label: '4.0-5.0 cm', min: 4.0, max: 5.0, value: '4.0-5.0' },
  { label: '5.0-7.5 cm', min: 5.0, max: 7.5, value: '5.0-7.5' },
  { label: '7.5-10.0 cm', min: 7.5, max: 10.0, value: '7.5-10.0' },
  { label: '10.0+ cm', min: 10.0, max: 999, value: '10.0+' },
]

export const HEIGHT_RANGES = [
  { label: '5-10 cm', min: 5, max: 10, value: '5-10' },
  { label: '10-15 cm', min: 10, max: 15, value: '10-15' },
  { label: '15-20 cm', min: 15, max: 20, value: '15-20' },
  { label: '20-25 cm', min: 20, max: 25, value: '20-25' },
  { label: '25-30 cm', min: 25, max: 30, value: '25-30' },
  { label: '30-40 cm', min: 30, max: 40, value: '30-40' },
  { label: '40-50 cm', min: 40, max: 50, value: '40-50' },
  { label: '50-75 cm', min: 50, max: 75, value: '50-75' },
  { label: '75-100 cm', min: 75, max: 100, value: '75-100' },
  { label: '100+ cm', min: 100, max: 9999, value: '100+' },
]

export const getRangeOptions = (
  ranges: typeof GIRTH_RANGES,
  displayUnit: LengthUnit = LengthUnit.CM
) => {
  return ranges.map(range => ({
    label: range.label,
    value: range.value,
    min: convertLength(range.min, LengthUnit.CM, displayUnit),
    max: convertLength(range.max, LengthUnit.CM, displayUnit),
  }))
}

export const parseRangeValue = (rangeValue: string): { min: number; max: number } | null => {
  if (rangeValue.includes('+')) {
    const min = parseFloat(rangeValue.replace('+', ''))
    return { min, max: 9999 }
  }
  
  const parts = rangeValue.split('-')
  if (parts.length === 2) {
    return {
      min: parseFloat(parts[0]),
      max: parseFloat(parts[1])
    }
  }
  
  return null
}

export const getAverageFromRange = (rangeValue: string): number => {
  const range = parseRangeValue(rangeValue)
  if (!range) return 0
  
  if (range.max === 9999) {
    return range.min + 5 // Add 5 for open-ended ranges
  }
  
  return (range.min + range.max) / 2
}
