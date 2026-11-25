import React, { useState } from 'react'
import { User, Mail, Phone, Lock, Save, LogOut } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { Card, CardContent } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { updateProfileSchema, validateWithZod } from '../../../validations'

export const CustomerProfilePage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth()
  const { showToast } = useToast()

  const [name, setName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateWithZod(updateProfileSchema, {
      name,
      email,
      phone,
    })

    if (!validation.success) {
      showToast(validation.errorMessage, 'error')
      return
    }

    updateProfile({ name, phone })
    showToast('Profile information updated successfully!', 'success')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your customer credentials and contact details.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => logout('customer')}
          className="text-red-600 border-red-200 hover:bg-red-50"
          leftIcon={<LogOut size={16} />}
        >
          Sign Out
        </Button>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label required>Full Name</Label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User size={16} />}
            />
          </div>

          <div>
            <Label>Email Address (Immutable)</Label>
            <Input
              type="email"
              disabled
              value={email}
              leftIcon={<Mail size={16} />}
              className="bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <Label>Phone Number</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone size={16} />}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" leftIcon={<Save size={16} />}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default CustomerProfilePage
