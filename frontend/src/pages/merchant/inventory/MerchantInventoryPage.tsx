import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, AlertTriangle, Plus, RotateCw, Play, Check, Package } from 'lucide-react'
import { useStore } from '../../../hooks/useStore'
import { useAuth } from '../../../hooks/useAuth'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { PATHS } from '../../../routes/routes'
import { Product } from '../../../types'

export const MerchantInventoryPage: React.FC = () => {
  const { user } = useAuth()
  const { products, restockProduct, restockAllLow, toggleProductPause } = useStore()

  // Strict seller product filtering
  const merchantProducts = useMemo(() => {
    if (!user) return []
    return products.filter((p) => {
      if (p.merchantId && String(p.merchantId) === String(user.id)) return true
      if (
        user.storeName &&
        p.storeName &&
        p.storeName.trim().toLowerCase() === user.storeName.trim().toLowerCase()
      )
        return true
      if (
        user.email === 'seller@cloudcart.com' &&
        (p.storeName === 'Apex Tech Hub' || String(p.merchantId) === '17')
      )
        return true
      return false
    })
  }, [products, user])

  const lowStockCount = merchantProducts.filter((p) => (p.stock || 0) <= 10).length
  const totalStock = merchantProducts.reduce((sum, p) => sum + (p.stock || 0), 0)

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Warehouse Inventory & Stock Control
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time warehouse SKU units, critical replenishment alerts, and batch restock operations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {lowStockCount > 0 && (
            <Button
              onClick={restockAllLow}
              leftIcon={<RotateCw size={14} />}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
            >
              Restock All Low ({lowStockCount})
            </Button>
          )}

          <Link to={PATHS.MERCHANT.PRODUCTS}>
            <Button
              leftIcon={<Plus size={14} />}
              className="bg-[#EF233C] hover:bg-[#D90429] text-white text-xs font-bold"
            >
              Add New SKU
            </Button>
          </Link>
        </div>
      </div>

      {/* Low Stock Warning Alert */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold">Inventory Threshold Warning: </span>
            {lowStockCount} product(s) in your store have 10 or fewer units remaining. Replenish batch inventory below to avoid customer stock-outs.
          </div>
        </div>
      )}

      {/* Main Inventory Card */}
      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              Inventory Ledger ({merchantProducts.length} SKUs • {totalStock} Total Units)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Available warehouse units tracked automatically upon customer order fulfillment
            </p>
          </div>
        </div>

        {merchantProducts.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Boxes size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No inventory tracked yet
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add products in your Product Catalog to manage real-time inventory counts and warehouse stock levels.
            </p>
            <Link to={PATHS.MERCHANT.PRODUCTS}>
              <Button size="sm" className="bg-[#EF233C] hover:bg-[#D90429] text-white text-xs font-bold mt-2">
                Add Product
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/40 uppercase text-[10px] font-bold text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-5">PRODUCT SKU</th>
                  <th className="py-3 px-4">CURRENT UNITS</th>
                  <th className="py-3 px-4">MIN THRESHOLD</th>
                  <th className="py-3 px-4">HEALTH STATUS</th>
                  <th className="py-3 px-4">AVAILABILITY</th>
                  <th className="py-3 px-5 text-right">BATCH REPLENISH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {merchantProducts.map((p) => {
                  const isLow = (p.stock || 0) <= 10
                  const isOut = (p.stock || 0) === 0
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-sm">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              SKU: {p.slug.toUpperCase().slice(0, 18)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-black text-sm">
                        <span
                          className={
                            isOut
                              ? 'text-red-600 dark:text-red-400'
                              : isLow
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-900 dark:text-white'
                          }
                        >
                          {p.stock} units
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-medium">10 units</td>

                      <td className="py-3.5 px-4">
                        {isOut ? (
                          <Badge variant="danger">Out of Stock</Badge>
                        ) : isLow ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">Healthy Stock</Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => toggleProductPause(p.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            p.isPaused
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100'
                          }`}
                        >
                          {p.isPaused ? (
                            <>
                              <Play size={10} /> Paused
                            </>
                          ) : (
                            <>
                              <Check size={10} /> Active
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-5 text-right space-x-1.5">
                        <button
                          onClick={() => restockProduct(p.id, 10)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-[#EF233C] hover:text-white hover:border-[#EF233C] transition-colors"
                          title="Add 10 units"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => restockProduct(p.id, 25)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-[#EF233C] hover:text-white hover:border-[#EF233C] transition-colors"
                          title="Add 25 units"
                        >
                          +25
                        </button>
                        <button
                          onClick={() => restockProduct(p.id, 50)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-[#EF233C] hover:text-white hover:border-[#EF233C] transition-colors"
                          title="Add 50 units"
                        >
                          +50
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default MerchantInventoryPage
