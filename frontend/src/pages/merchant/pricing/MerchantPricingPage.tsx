import React, { useState } from 'react'
import { DollarSign, Tag, Percent, Plus, Sparkles, Check } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { useStore } from '../../../hooks/useStore'
import { formatCurrency } from '../../../functionality/formatters'

interface Deal {
  id: string
  title: string
  code: string
  discount: number
  type: 'percentage' | 'fixed'
  minSpend: number
  active: boolean
}

export const MerchantPricingPage: React.FC = () => {
  const { products } = useStore()
  const [deals, setDeals] = useState<Deal[]>([
    {
      id: 'deal-1',
      title: 'Storewide Summer Clearance',
      code: 'SUMMER25',
      discount: 25,
      type: 'percentage',
      minSpend: 50,
      active: true,
    },
    {
      id: 'deal-2',
      title: 'First-time Hardware Buyer',
      code: 'WELCOME15',
      discount: 15,
      type: 'percentage',
      minSpend: 100,
      active: true,
    },
    {
      id: 'deal-3',
      title: 'Free Shipping Voucher',
      code: 'FREESHIP',
      discount: 10,
      type: 'fixed',
      minSpend: 40,
      active: false,
    },
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [discount, setDiscount] = useState('20')
  const [minSpend, setMinSpend] = useState('50')

  const toggleDeal = (id: string) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, active: !d.active } : d))
    )
  }

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault()
    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      title,
      code: code.toUpperCase(),
      discount: parseFloat(discount) || 10,
      type: 'percentage',
      minSpend: parseFloat(minSpend) || 0,
      active: true,
    }
    setDeals([newDeal, ...deals])
    setIsModalOpen(false)
    setTitle('')
    setCode('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Pricing, Deals & Promotions
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create coupon codes, storewide discount campaigns, and flash sale events
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#EF233C] hover:bg-[#D90429] text-white text-xs px-3.5 py-1.5 h-auto rounded-lg font-bold"
          leftIcon={<Plus size={14} />}
        >
          + Create New Promo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#EF233C] flex items-center justify-center font-bold">
              <Percent size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400">Active Promotions</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {deals.filter((d) => d.active).length} Campaigns
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400">Average Store Margin</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                34.8%
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400">Promo Sales Generated</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                $14,820.00
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Active Discount Codes & Coupons
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Customer-facing redemption codes applied during checkout
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 uppercase text-[10px] font-bold text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-5">CAMPAIGN TITLE</th>
                <th className="py-3 px-4">PROMO CODE</th>
                <th className="py-3 px-4">DISCOUNT</th>
                <th className="py-3 px-4">MINIMUM SPEND</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">
                    {deal.title}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#EF233C]">
                    <span className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                      {deal.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                    {deal.discount}% OFF
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {formatCurrency(deal.minSpend)}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={deal.active ? 'success' : 'neutral'}>
                      {deal.active ? 'Active' : 'Paused'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Button
                      variant={deal.active ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => toggleDeal(deal.id)}
                      className="text-xs h-7 px-3"
                    >
                      {deal.active ? 'Pause' : 'Activate'}
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
        title="Create Promotional Discount"
        subtitle="Set up a customer coupon code to boost storefront sales."
      >
        <form onSubmit={handleCreateDeal} className="space-y-4">
          <div>
            <Label required>Campaign Title</Label>
            <Input
              type="text"
              required
              placeholder="e.g. Flash Weekend Special"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Coupon Code</Label>
              <Input
                type="text"
                required
                placeholder="e.g. FLASH20"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div>
              <Label required>Discount (% off)</Label>
              <Input
                type="number"
                required
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Minimum Spend Requirement ($)</Label>
            <Input
              type="number"
              value={minSpend}
              onChange={(e) => setMinSpend(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Launch Promotion</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default MerchantPricingPage
