import React from 'react'

export interface BarChartItem {
  label: string
  value: number
  color?: string
}

export const BarChart: React.FC<{
  data: BarChartItem[]
  height?: number
}> = ({ data, height = 180 }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="w-full flex items-end gap-2 pt-6" style={{ height: `${height}px` }}>
      {data.map((item, idx) => {
        const heightPercent = Math.round((item.value / maxValue) * 100)
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
            <div
              className="w-full rounded-t-md transition-all duration-300 relative group-hover:brightness-90"
              style={{
                height: `${Math.max(8, heightPercent)}%`,
                backgroundColor: item.color || '#EF233C',
              }}
            >
              <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-0.5 px-1.5 rounded pointer-events-none transition-opacity whitespace-nowrap z-10">
                ${item.value.toLocaleString()}
              </div>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate w-full text-center">
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default BarChart
