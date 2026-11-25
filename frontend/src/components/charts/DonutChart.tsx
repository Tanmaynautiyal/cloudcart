import React from 'react'

export interface DonutItem {
  label: string
  value?: number
  percentage?: number
  color: string
}

export interface DonutChartProps {
  items?: DonutItem[]
  data?: DonutItem[]
  size?: number
}

export const DonutChart: React.FC<DonutChartProps> = ({ items, data }) => {
  const source = data || items || []
  const totalValue = source.reduce((sum, item) => sum + (item.value || item.percentage || 0), 0) || 100

  const normalizedItems = source.map((item) => {
    const rawVal = item.value !== undefined ? item.value : item.percentage || 0
    const pct = item.percentage !== undefined ? item.percentage : Math.round((rawVal / totalValue) * 100)
    return {
      label: item.label,
      percentage: pct,
      color: item.color,
    }
  })

  return (
    <div className="flex flex-col gap-3">
      {/* Segmented Bar Representation */}
      <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {normalizedItems.map((item, idx) => (
          <div
            key={idx}
            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
            title={`${item.label}: ${item.percentage}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {normalizedItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
              {item.label} ({item.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DonutChart
