import React, { useState } from 'react'
import { Truck, MapPin, CheckCircle, Package, Clock, ExternalLink } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { formatCurrency, formatDate } from '../../../functionality/formatters'
import { useStore } from '../../../hooks/useStore'

export const MerchantLogisticsPage: React.FC = () => {
  const { orders } = useStore()
  const [carrier, setCarrier] = useState('FedEx Priority')

  const carriers = [
    { name: 'FedEx Express', active: true, avgTime: '1-2 Days', rates: '$8.50 base' },
    { name: 'UPS Ground', active: true, avgTime: '2-3 Days', rates: '$6.90 base' },
    { name: 'DHL eCommerce', active: true, avgTime: '3-5 Days', rates: '$5.40 base' },
    { name: 'USPS Priority', active: false, avgTime: '2-4 Days', rates: '$7.10 base' },
  ]

  const dispatchQueue = orders.filter(
    (o) => o.status === 'PROCESSING' || o.status === 'SHIPPED'
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          Logistics, Shipping & Dispatch
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage fulfillment carriers, print shipping labels, and track transit dispatches
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {carriers.map((c) => (
          <Card
            key={c.name}
            className={`p-4 border transition-all ${
              c.active
                ? 'border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/20'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                {c.name}
              </span>
              <Badge variant={c.active ? 'success' : 'neutral'}>
                {c.active ? 'Integrated' : 'Inactive'}
              </Badge>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <div>Transit: {c.avgTime}</div>
              <div>Rate: {c.rates}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Dispatch & Fulfillment Queue ({dispatchQueue.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Orders packed and awaiting carrier pickup or in active transit
            </p>
          </div>

          <Button
            size="sm"
            className="bg-[#EF233C] hover:bg-[#D90429] text-white text-xs px-3.5 py-1.5 h-auto rounded-lg font-bold"
            leftIcon={<Truck size={14} />}
          >
            Request Carrier Pickup
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 uppercase text-[10px] font-bold text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-5">PACKAGE / ORDER</th>
                <th className="py-3 px-4">DESTINATION</th>
                <th className="py-3 px-4">CARRIER</th>
                <th className="py-3 px-4">TRACKING NUMBER</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-5 text-right">SHIPPING LABEL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dispatchQueue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No parcels currently in the dispatch queue.
                  </td>
                </tr>
              ) : (
                dispatchQueue.map((order, idx) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">
                      Order #{order.id}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {order.items.length} items ({formatCurrency(order.total)})
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {order.shippingAddress?.city || 'San Francisco'},{' '}
                      {order.shippingAddress?.country || 'USA'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      FedEx Express
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      FDX-{order.id.slice(0, 8).toUpperCase()}-US
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={order.status === 'SHIPPED' ? 'info' : 'warning'}>
                        {order.status === 'SHIPPED' ? 'In Transit' : 'Label Created'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Print Label
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default MerchantLogisticsPage
