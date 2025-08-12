export enum LengthUnit {
  CM = 'cm',
  MM = 'mm',
  INCH = 'inch',
  METER = 'm'
}

export const UNIT_CONVERSIONS = {
  [LengthUnit.CM]: {
    [LengthUnit.MM]: (value: number) => value * 10,
    [LengthUnit.INCH]: (value: number) => value / 2.54,
    [LengthUnit.METER]: (value: number) => value / 100,
    [LengthUnit.CM]: (value: number) => value,
  },
  [LengthUnit.MM]: {
    [LengthUnit.CM]: (value: number) => value / 10,
    [LengthUnit.INCH]: (value: number) => value / 25.4,
    [LengthUnit.METER]: (value: number) => value / 1000,
    [LengthUnit.MM]: (value: number) => value,
  },
  [LengthUnit.INCH]: {
    [LengthUnit.CM]: (value: number) => value * 2.54,
    [LengthUnit.MM]: (value: number) => value * 25.4,
    [LengthUnit.METER]: (value: number) => value * 0.0254,
    [LengthUnit.INCH]: (value: number) => value,
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
  { label: '0.5-1.0 cm', min: 0.5, max: 1.0 },
  { label: '1.0-1.5 cm', min: 1.0, max: 1.5 },
  { label: '1.5-2.0 cm', min: 1.5, max: 2.0 },
  { label: '2.0-2.5 cm', min: 2.0, max: 2.5 },
  { label: '2.5-3.0 cm', min: 2.5, max: 3.0 },
  { label: '3.0-4.0 cm', min: 3.0, max: 4.0 },
  { label: '4.0-5.0 cm', min: 4.0, max: 5.0 },
  { label: '5.0-7.5 cm', min: 5.0, max: 7.5 },
  { label: '7.5-10.0 cm', min: 7.5, max: 10.0 },
  { label: '10.0+ cm', min: 10.0, max: 999 },
]

export const HEIGHT_RANGES = [
  { label: '5-10 cm', min: 5, max: 10 },
  { label: '10-15 cm', min: 10, max: 15 },
  { label: '15-20 cm', min: 15, max: 20 },
  { label: '20-25 cm', min: 20, max: 25 },
  { label: '25-30 cm', min: 25, max: 30 },
  { label: '30-40 cm', min: 30, max: 40 },
  { label: '40-50 cm', min: 40, max: 50 },
  { label: '50-75 cm', min: 50, max: 75 },
  { label: '75-100 cm', min: 75, max: 100 },
  { label: '100+ cm', min: 100, max: 9999 },
]

export const getRangeOptions = (
  ranges: typeof GIRTH_RANGES,
  displayUnit: LengthUnit
) => {
  return ranges.map(range => ({
    value: `${range.min}-${range.max}`,
    label: `${formatLength(convertLength(range.min, LengthUnit.CM, displayUnit), displayUnit)} - ${formatLength(convertLength(range.max, LengthUnit.CM, displayUnit), displayUnit)}`,
    min: range.min,
    max: range.max,
  }))
}
