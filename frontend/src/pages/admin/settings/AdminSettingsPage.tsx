import React, { useState } from 'react'
import { Settings, Shield, Sliders, Database, Save, Check } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { useToast } from '../../../hooks/useToast'

export const AdminSettingsPage: React.FC = () => {
  const { showToast } = useToast()

  const [platformName, setPlatformName] = useState('CloudCart Super Store')
  const [commissionRate, setCommissionRate] = useState('8.5')
  const [taxRate, setTaxRate] = useState('8.0')
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('50.00')
  const [baseShippingFee, setBaseShippingFee] = useState('5.99')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    showToast('Platform governance configuration updated successfully!', 'success')
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          Platform Governance & System Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure marketplace fees, checkout taxation rules, and global operating policies
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#EF233C] flex items-center justify-center font-bold">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Marketplace Financial Rules
              </h2>
              <p className="text-xs text-slate-400">
                Commission take-rate and checkout calculations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Marketplace Take-Rate Commission (%)</Label>
              <Input
                type="number"
                step="0.1"
                required
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
              />
            </div>
            <div>
              <Label required>Default Sales Tax Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                required
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Free Shipping Minimum Order ($)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
              />
            </div>
            <div>
              <Label required>Base Standard Shipping Flat Rate ($)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={baseShippingFee}
                onChange={(e) => setBaseShippingFee(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Security & Platform Operations
              </h2>
              <p className="text-xs text-slate-400">
                Operating status and maintenance switches
              </p>
            </div>
          </div>

          <div>
            <Label required>Storefront Platform Title</Label>
            <Input
              type="text"
              required
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">
                Maintenance Mode
              </div>
              <div className="text-[11px] text-slate-400">
                When enabled, visitors are routed to a maintenance landing page
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                maintenanceMode ? 'bg-[#EF233C]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  maintenanceMode ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-[#EF233C] hover:bg-[#D90429] text-white px-6 font-bold"
            leftIcon={saved ? <Check size={16} /> : <Save size={16} />}
          >
            {saved ? 'Settings Saved!' : 'Save System Settings'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AdminSettingsPage
