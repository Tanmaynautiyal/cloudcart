import React from 'react'
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  ArrowUpRight,
  BarChart3,
  Download,
  FileSpreadsheet,
  Package,
  Layers,
} from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import BarChart from '../../../components/charts/BarChart'
import { useStore } from '../../../hooks/useStore'
import { formatCurrency, formatDate } from '../../../functionality/formatters'

export const AdminAnalyticsPage: React.FC = () => {
  const { products, orders, categories, users } = useStore()

  const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0)
  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0
  const platformTakeRate = totalRevenue * 0.085

  const monthlyData = [
    { label: 'Jan', value: 24500 },
    { label: 'Feb', value: 28900 },
    { label: 'Mar', value: 34200 },
    { label: 'Apr', value: 39100 },
    { label: 'May', value: 45600 },
    { label: 'Jun', value: 52400 },
    { label: 'Jul', value: 61800 },
    { label: 'Aug', value: 58200 },
    { label: 'Sep', value: 69500 },
    { label: 'Oct', value: 74200 },
    { label: 'Nov', value: 89600 },
    { label: 'Dec', value: 104200 },
  ]

  // Export Sales Report as CSV
  const handleExportSalesReport = () => {
    const headers = ['Order ID', 'Customer Name', 'Date', 'Total GMV (INR)', 'Platform Fee 8.5% (INR)', 'Status']
    const rows = orders.map((o) => [
      o.id,
      `"${o.customerName || 'Customer'}"`,
      formatDate(o.createdAt),
      (o.total || 0).toFixed(2),
      ((o.total || 0) * 0.085).toFixed(2),
      o.status,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `cloudcart-sales-report-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export Inventory Report as CSV
  const handleExportInventoryReport = () => {
    const headers = ['Product ID', 'SKU', 'Product Name', 'Department', 'Price (INR)', 'Stock Units', 'Status', 'Store']
    const rows = products.map((p) => [
      p.id,
      `"${p.slug}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.price.toFixed(2),
      p.stock,
      p.isPaused ? 'Paused' : 'Active',
      `"${p.storeName || 'Direct'}"`,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `cloudcart-inventory-stock-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Marketplace Sales Analytics & Velocity
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprehensive performance telemetry, commission payouts, and conversion analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSalesReport}
            className="text-xs font-bold"
            leftIcon={<FileSpreadsheet size={13} />}
          >
            Export Sales (CSV)
          </Button>
          <Button
            size="sm"
            onClick={handleExportInventoryReport}
            className="bg-[#EF233C] hover:bg-[#D90429] text-white text-xs font-bold"
            leftIcon={<Download size={13} />}
          >
            Export Inventory
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Cards matching reference screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
            TOTAL NET VOLUME
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <TrendingUp size={12} />
            +24.8% YoY Growth
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
            AVERAGE ORDER VALUE
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(avgOrderValue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Across {orders.length} transactions
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
            PLATFORM TAKE-RATE
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            8.5%
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">
            Net commission earned ({formatCurrency(platformTakeRate)})
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
            CART CONVERSION
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            4.82%
          </div>
          <div className="text-[11px] text-blue-600 font-bold mt-1">
            Top tier e-commerce benchmark
          </div>
        </Card>
      </div>

      {/* 2-column layout matching reference screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Monthly GMV BarChart */}
        <div className="lg:col-span-2">
          <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="mb-4">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Monthly Gross Merchandise Volume (GMV)
              </h2>
              <p className="text-xs text-slate-400">12-month revenue trajectory</p>
            </div>
            <BarChart data={monthlyData} height={220} />
          </Card>
        </div>

        {/* Right 1 col: Acquisition Channels strip & legend matching screenshot */}
        <div>
          <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Acquisition Channels
              </h2>
              <p className="text-xs text-slate-400">Customer traffic attribution</p>

              {/* Segmented bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex my-5">
                <div className="bg-[#EF233C]" style={{ width: '45%' }} title="Direct Organic (45%)" />
                <div className="bg-[#1E293B]" style={{ width: '25%' }} title="Search Engines (25%)" />
                <div className="bg-[#3B82F6]" style={{ width: '20%' }} title="Social & Deals (20%)" />
                <div className="bg-[#10B981]" style={{ width: '10%' }} title="Affiliates (10%)" />
              </div>

              {/* Legend matching screenshot */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF233C] shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    Direct Organic (45%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1E293B] shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    Search Engines (25%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    Social & Deals (20%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    Affiliates (10%)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Performance Telemetry:
              </span>{' '}
              94.2% checkout conversion efficiency on verified orders.
            </div>
          </Card>
        </div>
      </div>

      {/* Department Breakdown Telemetry Table */}
      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Department Performance & Commission Telemetry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Category gross merchandise volume, catalog count, and net take-rate earnings
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 uppercase text-[10px] font-bold text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-5">DEPARTMENT</th>
                <th className="py-3 px-4">CATALOG SKUS</th>
                <th className="py-3 px-4">ESTIMATED VOLUME</th>
                <th className="py-3 px-4">COMMISSION (8.5%)</th>
                <th className="py-3 px-5 text-right">CONVERSION RATING</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat.slug).length
                const estimatedDeptGMV = count * 45000
                const deptCommission = estimatedDeptGMV * 0.085

                return (
                  <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">
                      {cat.name}
                      <span className="text-[10px] text-slate-400 font-mono ml-2">/{cat.slug}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {count} products
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(estimatedDeptGMV)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                      {formatCurrency(deptCommission)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                        Top Performer
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default AdminAnalyticsPage
