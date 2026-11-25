import React from 'react'
import { Link } from 'react-router-dom'
import { Package, Truck, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useStore } from '../../../hooks/useStore'
import { formatCurrency, formatDate } from '../../../functionality/formatters'
import { Card, CardHeader, CardContent } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { PATHS } from '../../../routes/routes'

export const CustomerOrdersPage: React.FC = () => {
  const { orders } = useStore()

  if (orders.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Package size={28} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          No Orders Yet
        </h2>
        <p className="text-xs text-slate-500">
          When you place orders on CloudCart, their itemized receipts and dispatch tracking will appear here.
        </p>
        <div className="pt-2">
          <Link to={PATHS.SHOP}>
            <Button>Explore Hardware Catalog</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          My Order History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Track active shipments, download receipts, and review past purchases.
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const isDelivered = order.status === 'Delivered'
          const isProcessing = order.status === 'Processing'
          const badgeVariant = isDelivered ? 'success' : isProcessing ? 'primary' : 'warning'

          return (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-slate-50/70 dark:bg-slate-850/50">
                <div className="flex flex-wrap items-center justify-between gap-2 w-full text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      Order #{order.id}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar size={13} /> {formatDate(order.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={badgeVariant}>{order.status}</Badge>
                    <span className="font-black text-slate-900 dark:text-white text-sm">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Tracking bar */}
                {order.trackingNumber && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Truck size={16} className="text-[#EF233C]" />
                      <span>Tracking Number: <strong>{order.trackingNumber}</strong></span>
                    </div>
                    <span className="text-emerald-600 font-bold">In Transit</span>
                  </div>
                )}

                {/* Items */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(order.items as any[]).map((it, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={it.product?.image || it.productImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                          alt={it.product?.name || it.productName || 'Hardware Item'}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                            {it.product?.name || it.productName || 'Hardware Item'}
                          </div>
                          <div className="text-slate-400">Qty: {it.quantity}</div>
                        </div>
                      </div>

                      <div className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency((it.product?.price || it.price || 0) * (it.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery destination */}
                <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  Shipping Destination: <span className="text-slate-700 dark:text-slate-300">{order.shippingAddress}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default CustomerOrdersPage
