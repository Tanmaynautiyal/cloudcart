import React, { useState, useEffect } from 'react'
import {
  Search,
  ShoppingBag,
  Eye,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  PackageCheck,
  RefreshCw,
} from 'lucide-react'
import { useStore } from '../../../hooks/useStore'
import { useAuth } from '../../../hooks/useAuth'
import { formatCurrency, formatDate } from '../../../functionality/formatters'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Order, OrderStatus } from '../../../types'
import { ordersApi } from '../../../api/baseApi'
import { useToast } from '../../../components/toaster/Toaster'

export const MerchantOrdersPage: React.FC = () => {
  const { user } = useAuth()
  const { updateOrderStatus } = useStore()
  const { showToast } = useToast()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await ordersApi.getMerchantOrders()
      if (Array.isArray(res)) {
        setOrders(res)
      }
    } catch {
      showToast('Failed to load merchant orders', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [user?.id])

  const filteredOrders = orders.filter((o) => {
    const q = searchTerm.toLowerCase().trim()
    const matchesSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q))
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return 'success'
      case 'SHIPPED':
      case 'PROCESSING':
        return 'info'
      case 'CONFIRMED':
        return 'primary'
      case 'PENDING':
        return 'warning'
      case 'CANCELLED':
        return 'danger'
      default:
        return 'neutral'
    }
  }

  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order)
    setTrackingNumber(order.trackingNumber || '')
    setIsModalOpen(true)
  }

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return
    try {
      await updateOrderStatus(selectedOrder.id, newStatus)
      setSelectedOrder({ ...selectedOrder, status: newStatus })
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: newStatus } : o))
      )
      showToast(`Order #${selectedOrder.id} status updated to ${newStatus}`, 'success')
    } catch {
      showToast('Failed to update status', 'error')
    }
  }

  const handleSaveTracking = async () => {
    if (!selectedOrder || !trackingNumber.trim()) return
    setIsUpdatingTracking(true)
    try {
      await ordersApi.updateOrderTracking(selectedOrder.id, trackingNumber.trim())
      setSelectedOrder({ ...selectedOrder, trackingNumber: trackingNumber.trim() })
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? { ...o, trackingNumber: trackingNumber.trim() }
            : o
        )
      )
      showToast('Tracking number updated successfully!', 'success')
    } catch {
      showToast('Failed to save tracking number', 'error')
    } finally {
      setIsUpdatingTracking(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Customer Orders & Fulfillment
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage dispatch workflow, packing slips, shipping tracking codes, and delivery statuses.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          leftIcon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
          className="self-start sm:self-auto text-xs"
        >
          Refresh Orders
        </Button>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Filters and Search */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              Store Orders ({filteredOrders.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live customer transactions requiring fulfillment
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search Order ID, customer, tracking..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#EF233C] w-52 sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <ShoppingBag size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No store orders found
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              When shoppers purchase items from your catalog, their orders will appear here for dispatch and logistics tracking.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/40 uppercase text-[10px] font-bold text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-5">ORDER ID</th>
                  <th className="py-3 px-4">CUSTOMER</th>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">ITEMS</th>
                  <th className="py-3 px-4">TOTAL</th>
                  <th className="py-3 px-4">TRACKING</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900 dark:text-white">
                      #{o.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {o.customerName || 'Anonymous Customer'}
                      </div>
                      {o.customerEmail && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {o.customerEmail}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDate(o.createdAt || o.date)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {o.items?.length || 1} items
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                      {formatCurrency(o.total)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {o.trackingNumber ? (
                        <span className="text-emerald-600 font-bold">{o.trackingNumber}</span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">Pending</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={getStatusBadgeVariant(o.status)}>
                        {o.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetails(o)}
                        leftIcon={<Eye size={12} />}
                        className="text-xs h-7 px-2.5"
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Order Detail & Fulfillment Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Fulfill Order #${selectedOrder.id}`}
          subtitle="Review ordered items, shipping address, and manage dispatch lifecycle."
        >
          <div className="space-y-4 text-xs">
            {/* Customer & Address Overview */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Customer:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedOrder.customerName || 'Customer'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Date Placed:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatDate(selectedOrder.createdAt || selectedOrder.date)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Order Total:</span>
                <span className="font-black text-[#EF233C] text-sm">
                  {formatCurrency(selectedOrder.total)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 flex items-center gap-1">
                  <MapPin size={11} /> Shipping:
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300 text-right max-w-xs truncate">
                  {selectedOrder.shippingAddress || 'Standard Delivery Address'}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                Order Items ({selectedOrder.items?.length || 0})
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.image || '/assets/exact/prod_iphone_full.png'}
                        alt={item.name}
                        className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Qty: {item.quantity} × {formatCurrency(item.price)}
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Courier Tracking */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Logistics & Courier Tracking Number
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="e.g. BLUEDART-8492019 / FEDEX-93821"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="text-xs h-8"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveTracking}
                  disabled={isUpdatingTracking}
                  className="bg-[#EF233C] hover:bg-[#D90429] text-white text-xs h-8 px-3 font-bold"
                >
                  {isUpdatingTracking ? 'Saving...' : 'Save Tracking'}
                </Button>
              </div>
            </div>

            {/* Status Transition Buttons */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Update Fulfillment Status:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as OrderStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`py-2 px-2.5 text-xs font-bold rounded-lg border transition-all ${
                      selectedOrder.status === st
                        ? 'bg-[#EF233C] text-white border-[#EF233C] shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#EF233C] hover:text-[#EF233C]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default MerchantOrdersPage
