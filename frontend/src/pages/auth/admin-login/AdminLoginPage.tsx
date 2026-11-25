import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Lock, Mail, Eye, EyeOff, KeyRound } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Card, CardContent } from '../../../components/ui/Card'
import { PATHS } from '../../../routes/routes'
import { loginSchema, validateWithZod } from '../../../validations'

export const AdminLoginPage: React.FC = () => {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validation = validateWithZod(loginSchema, { email, password, role: 'admin' })
    if (!validation.success) {
      setError(validation.errorMessage)
      return
    }

    setLoading(true)

    const result = await login({ email, password }, 'admin')
    setLoading(false)

    if (!result.success || !result.user) {
      setError(result.error || 'Invalid administrator credentials.')
      return
    }

    if (result.user.role !== 'admin' && !result.user.is_admin) {
      setError('Access Denied: Administrator governance credentials required.')
      return
    }

    showToast('Governance Session Authenticated', 'success')
    navigate(PATHS.ADMIN.DASHBOARD, { replace: true })
  }

  return (
    <div className="w-full max-w-md">
      <Card className="p-2 sm:p-4 border-red-200 dark:border-red-950/60 shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#EF233C] dark:bg-red-950/80 dark:text-red-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Administrator Governance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Restricted portal. Super Admin credentials are required.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label required>Admin Email</Label>
              <Input
                type="email"
                required
                placeholder="admin@cloudcart.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={16} />}
              />
            </div>

            <div>
              <Label required>Governance Password</Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={loading}
              rightIcon={<KeyRound size={16} />}
            >
              Verify Governance Session
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              to={PATHS.HOME}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              ← Back to Customer Storefront
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminLoginPage
