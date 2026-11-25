import React, { useState } from 'react'
import { Search, ShoppingBag, Eye, Truck, CheckCircle2, Clock } from 'lucide-react'
import { useStore } from '../../../hooks/useStore'
import { formatCurrency, formatDate } from '../../../functionality/formatters'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { Order, OrderStatus } from '../../../types'

export const AdminOrdersPage: React.FC = () => {
  const { orders, updateOrderStatus } = useStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
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
    setIsModalOpen(true)
  }

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return
    await updateOrderStatus(selectedOrder.id, newStatus)
    setSelectedOrder({ ...selectedOrder, status: newStatus })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          Master Platform Orders
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Global order fulfillment tracking, status overrides, and transaction audits
        </p>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              All Platform Orders ({filteredOrders.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Unified cross-vendor customer transactions
            </p>
          </div>

          <div className="flex items-center gap-3">
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
                placeholder="Search Order ID or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#EF233C] w-56"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 uppercase text-[10px] font-bold text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-5">ORDER ID</th>
                <th className="py-3 px-4">CUSTOMER</th>
                <th className="py-3 px-4">DATE</th>
                <th className="py-3 px-4">ITEMS</th>
                <th className="py-3 px-4">TOTAL</th>
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
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {o.customerName || 'Customer'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {formatDate(o.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {o.items.length} items
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                    {formatCurrency(o.total)}
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
                      Audit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Admin Order Audit #${selectedOrder?.id}`}
        subtitle="Super Admin governance override for customer orders."
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedOrder.customerName || 'Customer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date Placed:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatDate(selectedOrder.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total:</span>
                <span className="font-black text-[#EF233C]">
                  {formatCurrency(selectedOrder.total)}
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                Order Items ({selectedOrder.items.length})
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-8 h-8 rounded object-cover"
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

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Set Global Order Status:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                      selectedOrder.status === st
                        ? 'bg-[#EF233C] text-white border-[#EF233C]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminOrdersPage
