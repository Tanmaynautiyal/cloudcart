import React, { useState } from 'react'
import {
  Store,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  ShieldCheck,
  Check,
  Save,
} from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../components/toaster/Toaster'
import { usersApi } from '../../../api/baseApi'

export const MerchantProfilePage: React.FC = () => {
  const { user, updateProfile: updateAuthUser } = useAuth()
  const { showToast } = useToast()

  const [storeName, setStoreName] = useState(user?.storeName || 'Merchant Store')
  const [ownerName, setOwnerName] = useState(user?.name || user?.full_name || 'Store Owner')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210')
  const [address, setAddress] = useState('Tech Corridor, Cyber City, Hyderabad, India')
  const [bankAccount, setBankAccount] = useState('•••• •••• •••• 9284 (HDFC Commercial)')
  const [taxId, setTaxId] = useState('GSTIN-36AAACH7409R1ZZ')
  const [bio, setBio] = useState('Authorized electronics distributor and premium consumer hardware merchant.')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!storeName.trim()) {
      showToast('Store name is mandatory', 'error')
      return
    }

    setIsSaving(true)
    try {
      // Live persist to PostgreSQL via FastAPI PUT /users/profile
      const updated = await usersApi.updateProfile({
        store_name: storeName.trim(),
        full_name: ownerName.trim(),
        phone: phone.trim(),
      })

      // Update in local auth context
      updateAuthUser({
        storeName: updated.store_name || storeName.trim(),
        name: updated.full_name || ownerName.trim(),
        phone: updated.phone || phone.trim(),
      })

      setSaved(true)
      showToast('Storefront profile updated successfully in database!', 'success')
      setTimeout(() => setSaved(false), 3000)
    } catch {
      showToast('Failed to save profile changes. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Store Profile & Merchant Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure storefront branding, official business contacts, and banking payout details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#EF233C] flex items-center justify-center">
              <Store size={20} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Storefront Branding & Information
              </h2>
              <p className="text-xs text-slate-400">
                Public details visible to customers on your storefront and product cards
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Store Display Name</Label>
              <Input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Apex Tech Hub, NextGen Acoustics"
              />
            </div>
            <div>
              <Label required>Owner / Representative Name</Label>
              <Input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Full Legal Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Support Email Address</Label>
              <Input
                type="email"
                disabled
                value={email}
                className="bg-slate-50 dark:bg-slate-800 cursor-not-allowed opacity-80"
              />
            </div>
            <div>
              <Label required>Customer Service Phone</Label>
              <Input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Store Tagline & Overview</Label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief description of what your store specializes in..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#EF233C]"
            />
          </div>
        </Card>

        <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Payout & Legal Registration
              </h2>
              <p className="text-xs text-slate-400">
                Disbursements and automated weekly bank payouts (Net 91.5% GMV)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Commercial Bank Account (Direct Deposit)</Label>
              <Input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
              />
            </div>
            <div>
              <Label>GSTIN / Tax ID</Label>
              <Input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Business Registered Address</Label>
            <Input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-[#EF233C] hover:bg-[#D90429] text-white px-6 font-bold rounded-xl"
            leftIcon={saved ? <Check size={16} /> : <Save size={16} />}
          >
            {isSaving ? 'Saving to Database...' : saved ? 'Saved Successfully!' : 'Save Store Profile'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default MerchantProfilePage
