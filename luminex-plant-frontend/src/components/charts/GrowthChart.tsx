'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'

interface Measurement {
  id: string
  girth: number
  height: number
  createdAt: string
}

interface GrowthChartProps {
  measurements: Measurement[]
  targetGirth: number
  targetHeight: number
  title?: string
}

export function GrowthChart({ 
  measurements, 
  targetGirth, 
  targetHeight, 
  title = "Growth Progress"
}: GrowthChartProps) {
  const chartData = measurements.map((measurement, index) => ({
    date: format(new Date(measurement.createdAt), 'MMM dd'),
    girth: measurement.girth,
    height: measurement.height,
    targetGirth,
    targetHeight,
    week: index + 1
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`Date: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey === 'girth' ? 'Girth' : 
                 entry.dataKey === 'height' ? 'Height' :
                 entry.dataKey === 'targetGirth' ? 'Target Girth' : 'Target Height'}: ${entry.value} cm`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300" />
            <XAxis 
              dataKey="date" 
              className="text-xs fill-gray-600"
            />
            <YAxis 
              className="text-xs fill-gray-600"
              label={{ value: 'Size (cm)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="girth"
              stroke="#8884d8"
              strokeWidth={3}
              dot={{ r: 5, fill: '#8884d8' }}
              name="Girth"
            />
            <Line
              type="monotone"
              dataKey="height"
              stroke="#82ca9d"
              strokeWidth={3}
              dot={{ r: 5, fill: '#82ca9d' }}
              name="Height"
            />
            <Line
              type="monotone"
              dataKey="targetGirth"
              stroke="#ff7300"
              strokeDasharray="8 8"
              dot={false}
              name="Target Girth"
            />
            <Line
              type="monotone"
              dataKey="targetHeight"
              stroke="#ff0000"
              strokeDasharray="8 8"
              dot={false}
              name="Target Height"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
