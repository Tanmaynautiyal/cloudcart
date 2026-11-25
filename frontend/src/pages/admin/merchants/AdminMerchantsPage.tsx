import React, { useState, useMemo } from 'react'
import {
  Store,
  CheckCircle,
  ShieldAlert,
  Pause,
  Play,
  Search,
  DollarSign,
  Package,
  ExternalLink,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Percent,
  Eye,
  Plus,
  Lock,
  Unlock,
  Power,
  ShoppingBag,
  FileText,
  UserCheck,
  Users,
} from 'lucide-react'
import { useStore } from '../../../hooks/useStore'
import { formatCurrency, formatDate } from '../../../functionality/formatters'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Product, User, Order, OrderStatus } from '../../../types'
import { ordersApi } from '../../../api/baseApi'
import { useToast } from '../../../components/toaster/Toaster'

export const AdminMerchantsPage: React.FC = () => {
  const {
    users,
    products,
    orders,
    categories,
    setUserStatus,
    toggleUserBlock,
    deleteUser,
    updateStock,
    toggleProductPause,
    deleteProduct,
    addProduct,
    updateOrderStatus,
  } = useStore()
  const { showToast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [managingSeller, setManagingSeller] = useState<any | null>(null)
  const [sellerModalTab, setSellerModalTab] = useState<'products' | 'orders' | 'report'>('products')
  const [sellerToDelete, setSellerToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAddingProduct, setIsAddingProduct] = useState(false)

  // Form for admin adding product to seller store
  const [newProdName, setNewProdName] = useState('')
  const [newProdPrice, setNewProdPrice] = useState('24999')
  const [newProdStock, setNewProdStock] = useState('25')
  const [newProdCategory, setNewProdCategory] = useState('mobiles')
  const [newProdImage, setNewProdImage] = useState('/assets/exact/prod_iphone_full.png')
  const [trackingNumberInputs, setTrackingNumberInputs] = useState<Record<string, string>>({})

  const merchants = useMemo(() => {
    return users.filter((u) => u.role === 'merchant' || u.role === 'seller')
  }, [users])

  const customers = useMemo(() => {
    return users.filter((u) => u.role === 'customer')
  }, [users])

  // Five Critical Metric Counters
  const totalRegisteredSellers = merchants.length
  const activeSellers = merchants.filter(
    (m) => (m.is_active ?? m.isActive ?? true) && !(m.is_blocked ?? m.isBlocked ?? false)
  ).length
  const blockedSellers = merchants.filter(
    (m) => m.is_blocked ?? m.isBlocked ?? false
  ).length
  const deactivatedSellers = merchants.filter(
    (m) => !(m.is_active ?? m.isActive ?? true) && !(m.is_blocked ?? m.isBlocked ?? false)
  ).length
  const totalCustomers = customers.length

  const merchantStats = useMemo(() => {
    return merchants.map((m) => {
      const storeProducts = products.filter(
        (p) =>
          String(p.merchantId) === String(m.id) ||
          (p.storeName && m.storeName && p.storeName.toLowerCase() === m.storeName.toLowerCase()) ||
          (m.email === 'seller@cloudcart.com' && (p.storeName === 'Apex Tech Hub' || String(p.merchantId) === '17'))
      )
      const estimatedGMV = storeProducts.reduce((sum, p) => sum + (p.price || 0) * 8, 0)
      const commission = estimatedGMV * 0.085
      const netPayout = estimatedGMV - commission

      const storeOrders = orders.filter((o) =>
        o.items.some(
          (item) =>
            storeProducts.some((sp) => String(sp.id) === String(item.productId || item.product_id)) ||
            storeProducts.some((sp) => sp.name.toLowerCase() === (item.name || item.productName || '').toLowerCase())
        )
      )

      return {
        ...m,
        storeProducts,
        storeOrders,
        productCount: storeProducts.length,
        orderCount: storeOrders.length,
        estimatedGMV,
        commission,
        netPayout,
      }
    })
  }, [merchants, products, orders])

  const filtered = useMemo(() => {
    return merchantStats.filter((m) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.storeName && m.storeName.toLowerCase().includes(q)) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q))

      const isBlocked = Boolean(m.is_blocked ?? m.isBlocked)
      const isActive = Boolean(m.is_active ?? m.isActive ?? true)

      let matchesStatus = true
      if (statusFilter === 'ACTIVE') {
        matchesStatus = isActive && !isBlocked
      } else if (statusFilter === 'BLOCKED') {
        matchesStatus = isBlocked
      } else if (statusFilter === 'DEACTIVATED') {
        matchesStatus = !isActive && !isBlocked
      }

      return matchesSearch && matchesStatus
    })
  }, [merchantStats, searchTerm, statusFilter])

  const handleDeleteSeller = async () => {
    if (!sellerToDelete) return
    setIsDeleting(true)
    try {
      await deleteUser(sellerToDelete.id)
      if (managingSeller?.id === sellerToDelete.id) {
        setManagingSeller(null)
      }
      setSellerToDelete(null)
      showToast('Seller account deleted successfully', 'success')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpdateTracking = async (orderId: string | number) => {
    const tracking = trackingNumberInputs[String(orderId)]
    if (!tracking || !tracking.trim()) return
    try {
      await ordersApi.updateOrderTracking(orderId, tracking.trim())
      showToast(`Tracking updated for Order #${orderId}`, 'success')
    } catch {
      showToast('Failed to update tracking number', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Multi-Vendor Merchant Oversight & Dashboards
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Super Admin governance over third-party merchant stores, personal seller dashboards, commission tracking, and catalog controls.
        </p>
      </div>

      {/* Five Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Registered Sellers
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
              <Store size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {totalRegisteredSellers}
          </div>
          <div className="text-[10px] text-indigo-600 font-bold mt-0.5">Total Merchants</div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Active Sellers
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <UserCheck size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">
            {activeSellers}
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Selling Live</div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Blocked Sellers
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 text-[#EF233C] flex items-center justify-center">
              <Lock size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#EF233C] mt-1.5">
            {blockedSellers}
          </div>
          <div className="text-[10px] text-[#EF233C] font-bold mt-0.5">Policy Suspended</div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Deactivated
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Power size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1.5">
            {deactivatedSellers}
          </div>
          <div className="text-[10px] text-amber-600 font-bold mt-0.5">Storefront Paused</div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Customers
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Users size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {totalCustomers}
          </div>
          <div className="text-[10px] text-blue-600 font-bold mt-0.5">Platform Shoppers</div>
        </Card>
      </div>

      {/* Main Sellers Table Card */}
      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              Marketplace Merchants & Stores ({filtered.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Independent sellers operating under the CloudCart multi-vendor marketplace
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All Statuses ({totalRegisteredSellers})</option>
              <option value="ACTIVE">Active Only ({activeSellers})</option>
              <option value="BLOCKED">Blocked Only ({blockedSellers})</option>
              <option value="DEACTIVATED">Deactivated Only ({deactivatedSellers})</option>
            </select>

            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search store or merchant name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#EF233C] w-48 sm:w-60"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 uppercase text-[10px] font-bold text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-5">STOREFRONT</th>
                <th className="py-3 px-4">OWNER DETAILS</th>
                <th className="py-3 px-4">CATALOG COUNT</th>
                <th className="py-3 px-4">COMMISSION RATE</th>
                <th className="py-3 px-4">ESTIMATED VOLUME</th>
                <th className="py-3 px-4">ACCOUNT STATUS</th>
                <th className="py-3 px-5 text-right">MANAGE SELLER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((m) => {
                const isBlocked = Boolean(m.is_blocked ?? m.isBlocked)
                const isActive = Boolean(m.is_active ?? m.isActive ?? true)

                let statusBadge = (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle size={10} /> Active
                  </span>
                )
                if (isBlocked) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900">
                      <Lock size={10} /> Blocked
                    </span>
                  )
                } else if (!isActive) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      <Power size={10} /> Deactivated
                    </span>
                  )
                }

                return (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#EF233C] text-white flex items-center justify-center font-bold shadow-xs">
                          <Store size={15} />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white">
                            {m.storeName || 'Merchant Store'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: #{m.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {m.name}
                      <div className="text-[10px] text-slate-400 font-mono">{m.email}</div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                      {m.productCount} products
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-purple-600">
                      8.5% Take-Rate
                    </td>

                    <td className="py-3.5 px-4 font-black text-[#EF233C]">
                      {formatCurrency(m.estimatedGMV)}
                    </td>

                    <td className="py-3.5 px-4">{statusBadge}</td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setManagingSeller(m)
                            setSellerModalTab('products')
                          }}
                          className="text-xs h-7 px-3 bg-[#EF233C] hover:bg-[#D90429] text-white font-bold"
                          leftIcon={<Eye size={12} />}
                        >
                          Manage Dashboard
                        </Button>

                        {/* Block / Unblock Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleUserBlock(m.id)}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                            isBlocked
                              ? 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              : 'border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                          }`}
                          title={isBlocked ? 'Unblock Seller' : 'Block / Suspend Seller'}
                        >
                          {isBlocked ? <Unlock size={13} /> : <Lock size={13} />}
                        </button>

                        {/* Activate / Deactivate Toggle */}
                        <button
                          type="button"
                          onClick={() =>
                            setUserStatus(
                              m.id,
                              isActive ? 'deactivated' : 'active'
                            )
                          }
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                            isActive
                              ? 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={isActive ? 'Deactivate Storefront' : 'Activate Storefront'}
                        >
                          <Power size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setSellerToDelete(m)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors"
                          title="Permanently Delete Seller"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Seller Personal Dashboard Modal */}
      {managingSeller && (
        <Modal
          isOpen={Boolean(managingSeller)}
          onClose={() => setManagingSeller(null)}
          title={`Seller Dashboard: ${managingSeller.storeName || managingSeller.name}`}
          subtitle="Real-time merchant performance telemetry, catalog control, and customer order fulfillment"
        >
          <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto px-1">
            {/* Merchant Header Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#EF233C] text-white flex items-center justify-center font-black text-xl shadow-md">
                  <Store size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {managingSeller.storeName || 'Official Merchant Store'}
                  </h3>
                  <p className="text-slate-300 text-xs">
                    Owner: <strong>{managingSeller.name}</strong> ({managingSeller.email})
                  </p>
                  <p className="text-slate-400 font-mono text-[10px] mt-0.5">
                    Account ID: #{managingSeller.id} • Phone: {managingSeller.phone || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    managingSeller.is_blocked || managingSeller.isBlocked
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : managingSeller.is_active || managingSeller.isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {managingSeller.is_blocked || managingSeller.isBlocked
                    ? '● Blocked Account'
                    : managingSeller.is_active || managingSeller.isActive
                    ? '● Live Storefront'
                    : '● Deactivated'}
                </span>
              </div>
            </div>

            {/* Financial Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold uppercase text-[10px]">
                  Estimated GMV
                </span>
                <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {formatCurrency(managingSeller.estimatedGMV)}
                </p>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/40">
                <span className="text-purple-600 font-bold uppercase text-[10px]">
                  Take-Rate (8.5%)
                </span>
                <p className="text-base font-black text-purple-700 dark:text-purple-300 mt-1">
                  {formatCurrency(managingSeller.commission)}
                </p>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-emerald-600 font-bold uppercase text-[10px]">
                  Net Payout (91.5%)
                </span>
                <p className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  {formatCurrency(managingSeller.netPayout)}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold uppercase text-[10px]">
                  Store Ledger
                </span>
                <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {managingSeller.storeProducts.length} SKUs • {managingSeller.orderCount} Orders
                </p>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
              <button
                type="button"
                onClick={() => setSellerModalTab('products')}
                className={`pb-2 font-bold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
                  sellerModalTab === 'products'
                    ? 'border-[#EF233C] text-[#EF233C]'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Package size={14} />
                Manage Products ({managingSeller.storeProducts.length})
              </button>

              <button
                type="button"
                onClick={() => setSellerModalTab('orders')}
                className={`pb-2 font-bold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
                  sellerModalTab === 'orders'
                    ? 'border-[#EF233C] text-[#EF233C]'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <ShoppingBag size={14} />
                Manage Store Orders ({managingSeller.storeOrders.length})
              </button>

              <button
                type="button"
                onClick={() => setSellerModalTab('report')}
                className={`pb-2 font-bold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
                  sellerModalTab === 'report'
                    ? 'border-[#EF233C] text-[#EF233C]'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <FileText size={14} />
                Detailed Activity Report
              </button>
            </div>

            {/* TAB 1: PRODUCTS */}
            {sellerModalTab === 'products' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Seller Catalog Listings
                  </span>
                  <Button
                    size="sm"
                    onClick={() => {
                      setNewProdName('')
                      setNewProdPrice('24999')
                      setNewProdStock('25')
                      setNewProdCategory(categories[0]?.slug || 'mobiles')
                      setNewProdImage('/assets/exact/prod_iphone_full.png')
                      setIsAddingProduct(true)
                    }}
                    className="bg-[#EF233C] hover:bg-[#D90429] text-white text-xs h-7 px-2.5 font-bold"
                    leftIcon={<Plus size={12} />}
                  >
                    + Add Product to Store
                  </Button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase text-[10px] text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3">PRODUCT</th>
                        <th className="py-2.5 px-3">PRICE</th>
                        <th className="py-2.5 px-3">STOCK</th>
                        <th className="py-2.5 px-3">STATUS</th>
                        <th className="py-2.5 px-3 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {managingSeller.storeProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">
                            No products currently listed for this seller. Click &apos;+ Add Product to Store&apos; above.
                          </td>
                        </tr>
                      ) : (
                        managingSeller.storeProducts.map((p: Product) => (
                          <tr key={p.id}>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-8 h-8 rounded object-cover bg-slate-100 shrink-0"
                                />
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-[160px]">
                                    {p.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    SKU: {p.slug.slice(0, 14)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                              {formatCurrency(p.price)}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold">
                              <span
                                className={
                                  (p.stock || 0) <= 10
                                    ? 'text-red-600'
                                    : 'text-slate-800 dark:text-slate-200'
                                }
                              >
                                {p.stock} units
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.isPaused
                                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
                                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                                }`}
                              >
                                {p.isPaused ? 'Paused' : 'Active'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => updateStock(p.id, (p.stock || 0) + 10)}
                                  className="px-1.5 py-0.5 text-[10px] rounded border border-slate-200 hover:bg-slate-100 dark:border-slate-700"
                                  title="Add 10 units"
                                >
                                  +10
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleProductPause(p.id)}
                                  className="p-1 rounded border border-slate-200 hover:bg-slate-100 dark:border-slate-700 text-slate-600"
                                  title={p.isPaused ? 'Unpause' : 'Pause'}
                                >
                                  {p.isPaused ? <Play size={11} /> : <Pause size={11} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteProduct(p.id)}
                                  className="p-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                                  title="Delete Product"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: ORDERS */}
            {sellerModalTab === 'orders' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Customer Orders Containing {managingSeller.storeName} Products
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase text-[10px] text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3">ORDER ID</th>
                        <th className="py-2.5 px-3">DATE</th>
                        <th className="py-2.5 px-3">CUSTOMER</th>
                        <th className="py-2.5 px-3">TOTAL</th>
                        <th className="py-2.5 px-3">STATUS & FULFILLMENT</th>
                        <th className="py-2.5 px-3 text-right">TRACKING</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {managingSeller.storeOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">
                            No store orders recorded yet.
                          </td>
                        </tr>
                      ) : (
                        managingSeller.storeOrders.map((o: Order) => (
                          <tr key={o.id}>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                              #{o.id}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">{formatDate(o.createdAt || o.date)}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {o.customerName || 'Customer'}
                            </td>
                            <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">
                              {formatCurrency(o.total)}
                            </td>
                            <td className="py-2.5 px-3">
                              <select
                                value={o.status}
                                onChange={(e) =>
                                  updateOrderStatus(o.id, e.target.value as OrderStatus)
                                }
                                className="px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="CONFIRMED">CONFIRMED</option>
                                <option value="PROCESSING">PROCESSING</option>
                                <option value="SHIPPED">SHIPPED</option>
                                <option value="DELIVERED">DELIVERED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="text"
                                  placeholder={o.trackingNumber || 'Tracking #'}
                                  value={trackingNumberInputs[o.id] ?? (o.trackingNumber || '')}
                                  onChange={(e) =>
                                    setTrackingNumberInputs({
                                      ...trackingNumberInputs,
                                      [o.id]: e.target.value,
                                    })
                                  }
                                  className="w-24 px-1.5 py-0.5 text-[10px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateTracking(o.id)}
                                  className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-[#EF233C] hover:text-white rounded font-bold transition-colors"
                                >
                                  Save
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: DETAILED REPORT */}
            {sellerModalTab === 'report' && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#EF233C]" />
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      Official Seller Performance & Audit Dossier
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Generated: {new Date().toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-bold text-[10px]">MERCHANT DETAILS</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-1">
                      {managingSeller.storeName || 'Official Merchant Store'}
                    </p>
                    <p className="text-slate-500 text-[11px]">Representative: {managingSeller.name}</p>
                    <p className="text-slate-500 text-[11px]">Email: {managingSeller.email}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-bold text-[10px]">SETTLEMENT & COMPLIANCE</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-1">
                      Platform Fee: 8.5% Fixed Tier
                    </p>
                    <p className="text-slate-500 text-[11px]">GSTIN: GSTIN-36AAACH7409R1ZZ</p>
                    <p className="text-slate-500 text-[11px]">Bank: Commercial Direct Deposit</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Listed SKUs:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {managingSeller.storeProducts.length} items
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Orders Processed:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {managingSeller.orderCount} orders
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Cumulative GMV:</span>
                    <span className="font-black text-emerald-600">
                      {formatCurrency(managingSeller.estimatedGMV)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CloudCart Platform Take-Rate:</span>
                    <span className="font-bold text-purple-600">8.5% Commission</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Net Seller Payout (Disbursement):</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {formatCurrency(managingSeller.netPayout)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Seller Account Governance Controls Footer */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    toggleUserBlock(managingSeller.id)
                    setManagingSeller((prev: any) =>
                      prev ? { ...prev, is_blocked: !prev.is_blocked, isBlocked: !prev.isBlocked } : null
                    )
                  }}
                  className={
                    managingSeller.is_blocked || managingSeller.isBlocked
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs'
                      : 'bg-red-600 hover:bg-red-700 text-white font-bold text-xs'
                  }
                >
                  {managingSeller.is_blocked || managingSeller.isBlocked
                    ? 'Unblock Seller Account'
                    : 'Block Seller Account'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const isCurrentlyActive = managingSeller.is_active || managingSeller.isActive
                    setUserStatus(managingSeller.id, isCurrentlyActive ? 'deactivated' : 'active')
                    setManagingSeller((prev: any) =>
                      prev
                        ? {
                            ...prev,
                            is_active: !isCurrentlyActive,
                            isActive: !isCurrentlyActive,
                            is_blocked: false,
                            isBlocked: false,
                          }
                        : null
                    )
                  }}
                  className="text-xs font-bold"
                >
                  {managingSeller.is_active || managingSeller.isActive
                    ? 'Deactivate Storefront'
                    : 'Activate Storefront'}
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setSellerToDelete(managingSeller)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  Delete Seller
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setManagingSeller(null)}
                className="text-xs"
              >
                Close Dashboard
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Add Product to Seller Store Modal */}
      {isAddingProduct && managingSeller && (
        <Modal
          isOpen={isAddingProduct}
          onClose={() => setIsAddingProduct(false)}
          title={`Publish Product to ${managingSeller.storeName || managingSeller.name}`}
          subtitle="Directly add a new merchandise listing into this seller's personal catalog"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!newProdName.trim()) return
              await addProduct({
                name: newProdName.trim(),
                price: parseFloat(newProdPrice) || 9999,
                stock: parseInt(newProdStock, 10) || 10,
                category: newProdCategory,
                image: newProdImage,
                merchantId: String(managingSeller.id),
                storeName: managingSeller.storeName || managingSeller.name,
              })
              setIsAddingProduct(false)
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <Label required>Product Name</Label>
              <Input
                type="text"
                required
                placeholder="Product Name"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Selling Price (₹)</Label>
                <Input
                  type="number"
                  required
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                />
              </div>
              <div>
                <Label required>Initial Stock Units</Label>
                <Input
                  type="number"
                  required
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Category</Label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Primary Image URL</Label>
                <Input
                  type="text"
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsAddingProduct(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#EF233C] hover:bg-[#D90429] text-white font-bold">
                Publish to Store
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Seller Confirmation Modal */}
      {sellerToDelete && (
        <Modal
          isOpen={Boolean(sellerToDelete)}
          onClose={() => setSellerToDelete(null)}
          title="Confirm Seller Deletion"
          subtitle="Are you sure you want to permanently delete this seller account?"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
              <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold text-red-900 dark:text-red-200 mb-1">
                  Permanent Seller Deletion Warning
                </p>
                <p className="text-red-800 dark:text-red-300">
                  Deleting merchant account <strong>{sellerToDelete.email}</strong> will revoke storefront access, suspend merchant payouts, and unlist merchant-exclusive SKUs.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => setSellerToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={isDeleting}
                onClick={handleDeleteSeller}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {isDeleting ? 'Deleting...' : 'Delete Seller Permanently'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AdminMerchantsPage
