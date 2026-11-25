import React from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign,
  ShoppingBag,
  Store,
  Package,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Users,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  Percent,
} from 'lucide-react'
import { useStore } from '../../../hooks/useStore'
import { formatCurrency, formatDate } from '../../../functionality/formatters'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import BarChart from '../../../components/charts/BarChart'
import DonutChart from '../../../components/charts/DonutChart'
import { PATHS } from '../../../routes/routes'

export const AdminDashboardPage: React.FC = () => {
  const { products, orders, categories, users, restockProduct } = useStore()

  const totalGMV = orders.reduce((sum, o) => sum + (o.total || 0), 0)
  const totalOrders = orders.length
  const totalProducts = products.length
  const totalCustomers = users.filter((u) => u.role === 'customer').length
  const totalSellers = users.filter((u) => u.role === 'merchant' || u.role === 'seller').length
  const platformCommission = totalGMV * 0.085

  // Low stock inventory tracking (stock <= 15)
  const lowStockProducts = products.filter((p) => (p.stock || 0) <= 15)

  const chartData = [
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

  const categoryDistribution = categories.slice(0, 5).map((c, i) => {
    const colors = ['#EF233C', '#2B2D42', '#3B82F6', '#10B981', '#F59E0B']
    const count = products.filter((p) => p.category === c.slug).length
    return {
      label: c.name,
      value: count || 1,
      color: colors[i % colors.length],
    }
  })

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Super Admin Governance Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time platform metrics, merchant oversight, and master fulfillment logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to={PATHS.ADMIN.PRODUCTS}>
            <Button
              className="bg-[#EF233C] hover:bg-[#D90429] text-white text-xs px-3.5 py-1.5 h-auto rounded-lg font-bold"
              leftIcon={<Package size={14} />}
            >
              Master Catalog
            </Button>
          </Link>
          <Link to={PATHS.ADMIN.MERCHANTS}>
            <Button
              variant="outline"
              className="text-xs px-3.5 py-1.5 h-auto rounded-lg font-bold"
              leftIcon={<Store size={14} />}
            >
              Manage Merchants
            </Button>
          </Link>
          <Link to={PATHS.ADMIN.USERS}>
            <Button
              variant="outline"
              className="text-xs px-3.5 py-1.5 h-auto rounded-lg font-bold"
              leftIcon={<Users size={14} />}
            >
              User Accounts
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards: 6-grid showing Customers, Sellers, Orders, GMV, Products, Take-Rate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Customers */}
        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Customers
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalCustomers}
          </div>
          <div className="text-[11px] text-blue-600 font-bold mt-1">
            Registered Shoppers
          </div>
        </Card>

        {/* Total Sellers */}
        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Verified Sellers
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Store size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalSellers}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <ShieldCheck size={12} />
            Active Storefronts
          </div>
        </Card>

        {/* Customer Orders */}
        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Customer Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalOrders}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across all vendors
          </div>
        </Card>

        {/* Master Products */}
        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Master Products
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-[#EF233C] flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalProducts}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Active in Catalog
          </div>
        </Card>

        {/* Platform GMV */}
        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Platform GMV
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalGMV)}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <TrendingUp size={12} />
            +24.8% YoY
          </div>
        </Card>

        {/* Platform Commission */}
        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Take-Rate (8.5%)
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <Percent size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrency(platformCommission)}
          </div>
          <div className="text-[11px] text-purple-600 font-bold mt-1">
            Platform Revenue
          </div>
        </Card>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  Monthly Gross Merchandise Volume (GMV)
                </h2>
                <p className="text-xs text-slate-400">12-month revenue trajectory and velocity</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
                +24.8% YoY Growth
              </span>
            </div>
            <BarChart data={chartData} height={200} />
          </Card>
        </div>

        <div>
          <Card className="p-5 border border-slate-200 dark:border-slate-800">
            <div className="mb-4">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Catalog by Department
              </h2>
              <p className="text-xs text-slate-400">Category product distribution</p>
            </div>
            <DonutChart data={categoryDistribution} size={180} />
          </Card>
        </div>
      </div>

      {/* Inventory Tracking & Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <Card className="p-5 border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
                  Inventory Alerts: Low Stock Detected ({lowStockProducts.length} items)
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Products with fewer than 15 units remaining. Restock immediately to avoid storefront stockouts.
                </p>
              </div>
            </div>
            <Link to={PATHS.ADMIN.PRODUCTS}>
              <Button size="sm" variant="outline" className="text-xs font-bold">
                View Master Inventory
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {lowStockProducts.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-10 h-10 rounded-md object-cover bg-slate-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {p.name}
                    </p>
                    <p className="text-[11px] font-mono text-red-600 font-bold">
                      {p.stock} units left
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => restockProduct(p.id, 25)}
                  className="text-xs h-7 px-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                  title="Quick Restock +25"
                >
                  +25
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Orders Overview */}
      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Recent Platform Transactions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live customer checkouts and settlement statuses
            </p>
          </div>
          <Link
            to={PATHS.ADMIN.ORDERS}
            className="text-xs font-bold text-[#EF233C] hover:underline flex items-center gap-1"
          >
            View all orders <ArrowUpRight size={13} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 uppercase text-[10px] font-bold text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-5">ORDER</th>
                <th className="py-3 px-4">CUSTOMER</th>
                <th className="py-3 px-4">DATE</th>
                <th className="py-3 px-4">AMOUNT</th>
                <th className="py-3 px-4">PAYMENT</th>
                <th className="py-3 px-5 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.slice(0, 6).map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-900 dark:text-white">
                    #{order.id}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {order.customerName || 'Customer'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                      Paid
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Badge variant={order.status === 'DELIVERED' ? 'success' : 'info'}>
                      {order.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default AdminDashboardPage

