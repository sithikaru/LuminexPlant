'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface AnalyticsChartsProps {
  speciesDistribution?: Array<{ name: string; count: number; percentage: number }>
  stagePipeline?: Array<{ stage: string; count: number }>
  zoneUtilization?: Array<{ name: string; capacity: number; occupied: number; utilization: number }>
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff0000', '#00aaff']

export function AnalyticsCharts({ 
  speciesDistribution = [], 
  stagePipeline = [], 
  zoneUtilization = [] 
}: AnalyticsChartsProps) {
  return (
    <div className="space-y-8">
      {/* Species Distribution Pie Chart */}
      {speciesDistribution.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Species Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={speciesDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {speciesDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Stage Pipeline Bar Chart */}
      {stagePipeline.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Batch Stage Pipeline</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stagePipeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="stage" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Zone Utilization Chart */}
      {zoneUtilization.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Zone Utilization</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneUtilization}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'capacity' ? `${value} total` :
                    name === 'occupied' ? `${value} occupied` :
                    `${value}%`,
                    name === 'capacity' ? 'Capacity' :
                    name === 'occupied' ? 'Occupied' : 'Utilization'
                  ]}
                />
                <Legend />
                <Bar dataKey="capacity" fill="#e0e7ff" name="Capacity" />
                <Bar dataKey="occupied" fill="#8884d8" name="Occupied" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
