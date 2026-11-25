import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  Trash2,
  Mail,
  Check,
  Store,
  Calendar,
  AlertTriangle,
  Eye,
  ShoppingBag,
  CreditCard,
  MapPin,
  Package,
  Activity,
  DollarSign,
  Loader2,
  Lock,
  Unlock,
  Power,
  TrendingUp,
  Percent,
  Plus,
  Play,
  Pause,
  ExternalLink,
  FileText,
  Printer,
  ChevronRight,
} from 'lucide-react'
import { useStore } from '../../../hooks/useStore'
import { formatDate, formatCurrency } from '../../../functionality/formatters'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { User, Product, Order, OrderStatus } from '../../../types'
import { usersApi, ordersApi } from '../../../api/baseApi'
import { useToast } from '../../../components/toaster/Toaster'

export const AdminUsersPage: React.FC = () => {
  const {
    users,
    products,
    orders,
    categories,
    setUserStatus,
    toggleUserBlock,
    toggleUserActive,
    deleteUser,
    addProduct,
    updateStock,
    toggleProductPause,
    deleteProduct,
    updateOrderStatus,
  } = useStore()
  const { showToast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Modals state
  const [inspectUser, setInspectUser] = useState<User | null>(null)
  const [userActivity, setUserActivity] = useState<any | null>(null)
  const [isLoadingActivity, setIsLoadingActivity] = useState(false)
  const [managingSeller, setManagingSeller] = useState<User | null>(null)
  const [sellerModalTab, setSellerModalTab] = useState<'products' | 'orders' | 'report'>('products')
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Seller Dashboard Products & Orders in Admin Modal
  const [isAddingSellerProduct, setIsAddingSellerProduct] = useState(false)
  const [newProdName, setNewProdName] = useState('')
  const [newProdPrice, setNewProdPrice] = useState('19999')
  const [newProdStock, setNewProdStock] = useState('25')
  const [newProdCategory, setNewProdCategory] = useState('mobiles')
  const [newProdImage, setNewProdImage] = useState('/assets/exact/prod_iphone_full.png')
  const [trackingNumberInputs, setTrackingNumberInputs] = useState<Record<string, string>>({})

  // Fetch telemetry whenever inspectUser changes
  useEffect(() => {
    if (!inspectUser) {
      setUserActivity(null)
      return
    }
    let isMounted = true
    const loadTelemetry = async () => {
      setIsLoadingActivity(true)
      try {
        const res = await usersApi.getUserActivity(inspectUser.id)
        if (isMounted) setUserActivity(res)
      } catch {
        if (isMounted) setUserActivity(null)
      } finally {
        if (isMounted) setIsLoadingActivity(false)
      }
    }
    loadTelemetry()
    return () => {
      isMounted = false
    }
  }, [inspectUser?.id])

  // Sellers and Customers Categorization
  const sellers = useMemo(() => {
    return users.filter((u) => u.role === 'merchant' || u.role === 'seller')
  }, [users])

  const customers = useMemo(() => {
    return users.filter((u) => u.role === 'customer')
  }, [users])

  // Five Critical Metric Counters requested by user:
  // 1. Total Registered Sellers
  const totalRegisteredSellers = sellers.length

  // 2. Active Sellers (isActive = true and not isBlocked)
  const activeSellers = sellers.filter(
    (s) => (s.is_active ?? s.isActive ?? true) && !(s.is_blocked ?? s.isBlocked ?? false)
  ).length

  // 3. Blocked Sellers (isBlocked = true)
  const blockedSellers = sellers.filter(
    (s) => s.is_blocked ?? s.isBlocked ?? false
  ).length

  // 4. Deactivated Sellers (not active and not blocked)
  const deactivatedSellers = sellers.filter(
    (s) => !(s.is_active ?? s.isActive ?? true) && !(s.is_blocked ?? s.isBlocked ?? false)
  ).length

  // 5. Total Customers
  const totalCustomers = customers.length

  // Filter accounts
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.storeName && u.storeName.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q))

      const matchesRole =
        roleFilter === 'ALL' ||
        u.role.toLowerCase() === roleFilter.toLowerCase() ||
        (roleFilter === 'MERCHANT' && (u.role === 'seller' || u.role === 'merchant'))

      const isBlocked = Boolean(u.is_blocked ?? u.isBlocked)
      const isActive = Boolean(u.is_active ?? u.isActive ?? true)

      let matchesStatus = true
      if (statusFilter === 'ACTIVE') {
        matchesStatus = isActive && !isBlocked
      } else if (statusFilter === 'BLOCKED') {
        matchesStatus = isBlocked
      } else if (statusFilter === 'DEACTIVATED') {
        matchesStatus = !isActive && !isBlocked
      }

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  // Get products belonging to a given seller
  const getSellerProducts = (seller: User | null): Product[] => {
    if (!seller) return []
    return products.filter(
      (p) =>
        String(p.merchantId) === String(seller.id) ||
        (p.storeName &&
          seller.storeName &&
          p.storeName.trim().toLowerCase() === seller.storeName.trim().toLowerCase()) ||
        (seller.email === 'seller@cloudcart.com' &&
          (p.storeName === 'Apex Tech Hub' || String(p.merchantId) === '17'))
    )
  }

  // Get orders containing items belonging to a given seller
  const getSellerOrders = (seller: User | null): Order[] => {
    if (!seller) return []
    const sellerProds = getSellerProducts(seller)
    const sellerProdIds = new Set(sellerProds.map((p) => String(p.id)))
    return orders.filter((o) =>
      o.items.some(
        (item) =>
          sellerProdIds.has(String(item.productId || item.product_id)) ||
          sellerProds.some(
            (sp) => sp.name.toLowerCase() === (item.name || item.productName || '').toLowerCase()
          )
      )
    )
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    try {
      await deleteUser(userToDelete.id)
      if (inspectUser?.id === userToDelete.id) setInspectUser(null)
      if (managingSeller?.id === userToDelete.id) setManagingSeller(null)
      setUserToDelete(null)
      showToast('Account permanently removed from system.', 'success')
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
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Seller & User Governance Management
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Super Admin platform authority over all registered merchants, customer accounts, store catalog overrides, and policy compliance.
        </p>
      </div>

      {/* Five Mandatory Metric Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Registered Sellers */}
        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Sellers
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
              <Store size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {totalRegisteredSellers}
          </div>
          <div className="text-[10px] text-indigo-600 font-bold mt-0.5">Registered Sellers</div>
        </Card>

        {/* Active Sellers */}
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

        {/* Blocked Sellers */}
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

        {/* Deactivated Sellers */}
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

        {/* Total Customers */}
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
          <div className="text-[10px] text-blue-600 font-bold mt-0.5">Registered Shoppers</div>
        </Card>
      </div>

      {/* Main Governance Data Table Card */}
      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Table Header & Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              Platform Accounts Directory ({filteredUsers.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Super Admin control over all sellers, customer profiles, and security states
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All Roles</option>
              <option value="MERCHANT">Sellers Only ({totalRegisteredSellers})</option>
              <option value="CUSTOMER">Customers Only ({totalCustomers})</option>
              <option value="ADMIN">Super Admins</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="BLOCKED">Blocked / Suspended</option>
              <option value="DEACTIVATED">Deactivated</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search name, store, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#EF233C] w-48 sm:w-60"
              />
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 uppercase text-[10px] font-bold text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-5">ACCOUNT PROFILE</th>
                <th className="py-3 px-4">ROLE</th>
                <th className="py-3 px-4">STOREFRONT BRAND</th>
                <th className="py-3 px-4">JOINED DATE</th>
                <th className="py-3 px-4">ACCOUNT STATUS</th>
                <th className="py-3 px-5 text-right">GOVERNANCE ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((user) => {
                const isBlocked = Boolean(user.is_blocked ?? user.isBlocked)
                const isActive = Boolean(user.is_active ?? user.isActive ?? true)
                const isSeller = user.role === 'merchant' || user.role === 'seller'

                let statusBadge = (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <Check size={10} /> Active
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
                    key={user.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* ACCOUNT PROFILE */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            user.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'
                          }
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-[10px] text-slate-400">
                              📞 {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* ROLE */}
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          user.role === 'admin'
                            ? 'danger'
                            : isSeller
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {user.role.toUpperCase()}
                      </Badge>
                    </td>

                    {/* STOREFRONT BRAND */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {isSeller ? (
                        <div className="flex items-center gap-1.5">
                          <Store size={13} className="text-[#EF233C]" />
                          <span>{user.storeName || 'Merchant Store'}</span>
                        </div>
                      ) : user.role === 'customer' ? (
                        <span className="text-slate-400">Customer Shopper</span>
                      ) : (
                        <span className="text-[#EF233C] font-bold">System Admin</span>
                      )}
                    </td>

                    {/* JOINED DATE */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* ACCOUNT STATUS */}
                    <td className="py-3.5 px-4">{statusBadge}</td>

                    {/* GOVERNANCE ACTIONS */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* If Seller: Direct Button to Manage Store Dashboard */}
                        {isSeller && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setManagingSeller(user)
                              setSellerModalTab('products')
                            }}
                            className="text-xs h-7 px-2.5 bg-[#EF233C] hover:bg-[#D90429] text-white font-bold"
                            title="Open Seller Store Dashboard"
                          >
                            <Store size={12} className="mr-1" /> Store Dashboard
                          </Button>
                        )}

                        {/* Inspect Activity / Telemetry */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectUser(user)}
                          className="text-xs h-7 px-2"
                          title="Inspect Telemetry & Activity Report"
                        >
                          <Eye size={12} className="mr-1" /> Inspect
                        </Button>

                        {/* Block / Unblock Button */}
                        <button
                          type="button"
                          onClick={() => toggleUserBlock(user.id)}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                            isBlocked
                              ? 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              : 'border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                          }`}
                          title={isBlocked ? 'Unblock Account' : 'Block / Suspend Account'}
                        >
                          {isBlocked ? <Unlock size={13} /> : <Lock size={13} />}
                        </button>

                        {/* Activate / Deactivate Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setUserStatus(
                              user.id,
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

                        {/* Delete Account */}
                        {user.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => setUserToDelete(user)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors"
                            title="Permanently Delete Account"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================= */}
      {/* MODAL 1: SELLER STORE DASHBOARD & MANAGEMENT (ADMIN OVERRIDE) */}
      {/* ========================================================= */}
      {managingSeller && (
        <Modal
          isOpen={Boolean(managingSeller)}
          onClose={() => setManagingSeller(null)}
          title={`Seller Management: ${managingSeller.storeName || managingSeller.name}`}
          subtitle="Full Administrator access to manage this seller's products, customer orders, and financial telemetry."
        >
          <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto px-1">
            {/* Top Store Overview Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#EF233C] text-white flex items-center justify-center font-bold shadow">
                  <Store size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {managingSeller.storeName || 'Official Merchant Store'}
                  </h3>
                  <p className="text-slate-300 text-xs">
                    Seller Owner: <strong>{managingSeller.name}</strong> ({managingSeller.email})
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
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : managingSeller.is_active || managingSeller.isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
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
            {(() => {
              const sellerProds = getSellerProducts(managingSeller)
              const sellerOrds = getSellerOrders(managingSeller)
              const estGMV = sellerProds.reduce((sum, p) => sum + (p.price || 0) * 8, 0)
              const fee = estGMV * 0.085
              const netPayout = estGMV - fee
              const totalStockUnits = sellerProds.reduce((sum, p) => sum + (p.stock || 0), 0)

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">
                      Estimated GMV
                    </span>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                      {formatCurrency(estGMV)}
                    </p>
                  </div>

                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/40">
                    <span className="text-purple-600 font-bold uppercase text-[10px]">
                      Take-Rate (8.5%)
                    </span>
                    <p className="text-base font-black text-purple-700 dark:text-purple-300 mt-1">
                      {formatCurrency(fee)}
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                    <span className="text-emerald-600 font-bold uppercase text-[10px]">
                      Net Payout (91.5%)
                    </span>
                    <p className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-1">
                      {formatCurrency(netPayout)}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">
                      Store Ledger
                    </span>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                      {sellerProds.length} SKUs • {totalStockUnits} Units
                    </p>
                  </div>
                </div>
              )
            })()}

            {/* Modal Tabs Navigation */}
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
                Manage Products ({getSellerProducts(managingSeller).length})
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
                Manage Store Orders ({getSellerOrders(managingSeller).length})
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

            {/* TAB 1: MANAGE SELLER PRODUCTS */}
            {sellerModalTab === 'products' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Products Listed Under {managingSeller.storeName}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => {
                      setNewProdName('')
                      setNewProdPrice('24999')
                      setNewProdStock('20')
                      setNewProdCategory(categories[0]?.slug || 'mobiles')
                      setNewProdImage('/assets/exact/prod_iphone_full.png')
                      setIsAddingSellerProduct(true)
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
                        <th className="py-2.5 px-3 text-right">ADMIN OVERRIDE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {getSellerProducts(managingSeller).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">
                            No products currently listed for this seller. Click &apos;+ Add Product to Store&apos; above to publish an item.
                          </td>
                        </tr>
                      ) : (
                        getSellerProducts(managingSeller).map((p) => (
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

            {/* TAB 2: MANAGE STORE ORDERS */}
            {sellerModalTab === 'orders' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Customer Transactions Containing {managingSeller.storeName} Merchandise
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
                      {getSellerOrders(managingSeller).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">
                            No store orders on record yet. Customer transactions for this seller will appear here.
                          </td>
                        </tr>
                      ) : (
                        getSellerOrders(managingSeller).map((o) => (
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

            {/* TAB 3: DETAILED SELLER ACTIVITY REPORT */}
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
                      {getSellerProducts(managingSeller).length} items
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Warehouse Units:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {getSellerProducts(managingSeller).reduce((sum, p) => sum + (p.stock || 0), 0)} units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Cumulative GMV:</span>
                    <span className="font-black text-emerald-600">
                      {formatCurrency(
                        getSellerProducts(managingSeller).reduce((sum, p) => sum + (p.price || 0) * 8, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CloudCart Platform Take-Rate:</span>
                    <span className="font-bold text-purple-600">8.5% Commission</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Net Seller Payout (Disbursement):</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {formatCurrency(
                        getSellerProducts(managingSeller).reduce((sum, p) => sum + (p.price || 0) * 8, 0) * 0.915
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Seller Account Governance Controls Footer */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Block / Unblock Seller */}
                <Button
                  size="sm"
                  onClick={() => {
                    toggleUserBlock(managingSeller.id)
                    setManagingSeller((prev) =>
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

                {/* Activate / Deactivate Storefront */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const isCurrentlyActive = managingSeller.is_active || managingSeller.isActive
                    setUserStatus(managingSeller.id, isCurrentlyActive ? 'deactivated' : 'active')
                    setManagingSeller((prev) =>
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

                {/* Permanent Delete Seller */}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setUserToDelete(managingSeller)}
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
      {isAddingSellerProduct && managingSeller && (
        <Modal
          isOpen={isAddingSellerProduct}
          onClose={() => setIsAddingSellerProduct(false)}
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
              setIsAddingSellerProduct(false)
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingSellerProduct(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-[#EF233C] hover:bg-[#D90429] text-white font-bold">
                Publish to Store
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CUSTOMER ACTIVITY DASHBOARD (FOR SHOPPERS) */}
      {/* ========================================================= */}
      {inspectUser && (
        <Modal
          isOpen={Boolean(inspectUser)}
          onClose={() => setInspectUser(null)}
          title={`Customer Activity Dashboard: ${inspectUser.name}`}
          subtitle="Real-time PostgreSQL telemetry, lifetime spend, order history, and saved addresses."
        >
          <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto px-1">
            {/* Header */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3.5">
                <img
                  src={
                    inspectUser.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'
                  }
                  alt={inspectUser.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-700"
                />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {inspectUser.name}
                  </h3>
                  <p className="text-slate-400 font-mono text-[11px]">{inspectUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={inspectUser.role === 'admin' ? 'danger' : inspectUser.role === 'merchant' ? 'warning' : 'info'}>
                      {inspectUser.role.toUpperCase()}
                    </Badge>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        inspectUser.is_blocked || inspectUser.isBlocked
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/40'
                          : inspectUser.is_active || inspectUser.isActive
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
                      }`}
                    >
                      {inspectUser.is_blocked || inspectUser.isBlocked
                        ? 'Blocked'
                        : inspectUser.is_active || inspectUser.isActive
                        ? 'Active'
                        : 'Deactivated'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400">Registered</span>
                <div className="font-bold text-slate-700 dark:text-slate-300">
                  {formatDate(inspectUser.createdAt)}
                </div>
              </div>
            </div>

            {/* Telemetry Metrics */}
            {isLoadingActivity ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-[#EF233C]" />
                <span>Loading PostgreSQL telemetry...</span>
              </div>
            ) : userActivity ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Lifetime Spend</span>
                    <div className="text-base font-black text-emerald-600 mt-1">
                      {formatCurrency(userActivity.metrics?.total_spent || 0)}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Orders Placed</span>
                    <div className="text-base font-black text-slate-900 dark:text-white mt-1">
                      {userActivity.metrics?.total_orders || 0} Orders
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Active Cart Items</span>
                    <div className="text-base font-black text-blue-600 mt-1">
                      {userActivity.metrics?.cart_items_count || 0} Items
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {inspectUser.role === 'customer' ? 'Customer Loyalty' : 'Vendor SKUs'}
                    </span>
                    <div className="text-base font-black text-purple-600 mt-1">
                      {inspectUser.role === 'customer'
                        ? 'Standard'
                        : `${userActivity.metrics?.merchant_products_count || 0} Listed`}
                    </div>
                  </div>
                </div>

                {/* Orders Telemetry Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                    <ShoppingBag size={13} className="text-[#EF233C]" />
                    Customer Order History ({userActivity.orders?.length || 0})
                  </h4>
                  {userActivity.orders?.length === 0 ? (
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center text-slate-400 text-xs">
                      No purchase orders on record for this customer.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase text-[10px] text-slate-400">
                          <tr>
                            <th className="py-2 px-3">ORDER ID</th>
                            <th className="py-2 px-3">DATE</th>
                            <th className="py-2 px-3">ITEMS</th>
                            <th className="py-2 px-3">TOTAL</th>
                            <th className="py-2 px-3 text-right">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {userActivity.orders.map((o: any) => (
                            <tr key={o.id}>
                              <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">
                                #{o.id}
                              </td>
                              <td className="py-2 px-3 text-slate-400">{formatDate(o.created_at)}</td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                                {o.items?.length || 1} items
                              </td>
                              <td className="py-2 px-3 font-black text-slate-900 dark:text-white">
                                {formatCurrency(o.total_amount)}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <Badge variant={o.status === 'DELIVERED' ? 'success' : 'info'}>
                                  {o.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Saved Shipping Addresses */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#EF233C]" />
                    Saved Shipping Addresses ({userActivity.addresses?.length || 0})
                  </h4>
                  {userActivity.addresses?.length === 0 ? (
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center text-slate-400 text-xs">
                      No saved delivery addresses.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                      {userActivity.addresses.map((addr: any) => (
                        <div
                          key={addr.id}
                          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {addr.full_name || 'Customer Address'}
                            </span>
                            {addr.is_default_shipping && (
                              <span className="text-[9px] bg-red-50 text-[#EF233C] px-1.5 py-0.5 rounded font-bold">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 mt-1 line-clamp-2">
                            {addr.address_line_1}, {addr.city}, {addr.state} {addr.postal_code}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}

            {/* Governance Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    toggleUserBlock(inspectUser.id)
                    setInspectUser((prev) =>
                      prev
                        ? { ...prev, is_blocked: !prev.is_blocked, isBlocked: !prev.isBlocked }
                        : null
                    )
                  }}
                  className={
                    inspectUser.is_blocked || inspectUser.isBlocked
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs'
                      : 'bg-red-600 hover:bg-red-700 text-white font-bold text-xs'
                  }
                >
                  {inspectUser.is_blocked || inspectUser.isBlocked
                    ? 'Unblock Account'
                    : 'Block Account'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const isCurrentlyActive = inspectUser.is_active || inspectUser.isActive
                    setUserStatus(inspectUser.id, isCurrentlyActive ? 'deactivated' : 'active')
                    setInspectUser((prev) =>
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
                  {inspectUser.is_active || inspectUser.isActive
                    ? 'Deactivate Account'
                    : 'Activate Account'}
                </Button>

                {inspectUser.role !== 'admin' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setUserToDelete(inspectUser)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                  >
                    Delete Account
                  </Button>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={() => setInspectUser(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DELETE ACCOUNT CONFIRMATION */}
      {/* ========================================================= */}
      {userToDelete && (
        <Modal
          isOpen={Boolean(userToDelete)}
          onClose={() => setUserToDelete(null)}
          title="Confirm Account Deletion"
          subtitle="Are you sure you want to permanently delete this user account?"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
              <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-red-900 dark:text-red-200">
                <p className="font-bold mb-1">Permanent Removal Warning</p>
                <p>
                  Deleting account <strong>{userToDelete.email}</strong> will remove their user record, associated storefront listings (if seller), and revoke all login credentials. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account Permanently'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AdminUsersPage
