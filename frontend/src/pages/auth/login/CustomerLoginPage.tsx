import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Card, CardContent } from '../../../components/ui/Card'
import { PATHS } from '../../../routes/routes'
import { loginSchema, validateWithZod } from '../../../validations'

export const CustomerLoginPage: React.FC = () => {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validation = validateWithZod(loginSchema, { email, password, role: 'customer' })
    if (!validation.success) {
      setError(validation.errorMessage)
      return
    }

    setLoading(true)

    const result = await login({ email, password }, 'customer')
    setLoading(false)

    if (!result.success || !result.user) {
      setError(result.error || 'Invalid email or password.')
      return
    }

    showToast(`Welcome back, ${result.user.name}!`, 'success')

    // Navigate to role-appropriate portal or intended destination
    if (result.user.role === 'admin') {
      navigate(PATHS.ADMIN.DASHBOARD, { replace: true })
    } else if (result.user.role === 'merchant') {
      navigate(PATHS.MERCHANT.DASHBOARD, { replace: true })
    } else {
      const destination = (location.state as any)?.from?.pathname || PATHS.HOME
      navigate(destination, { replace: true })
    }
  }

  return (
    <div className="w-full max-w-md">
      <Card className="p-2 sm:p-4">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Customer Sign In
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Access your orders, saved wishlist items, and express checkout.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label required>Email Address</Label>
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={16} />}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label required className="mb-0">Password</Label>
                <button
                  type="button"
                  onClick={() => showToast('Password reset link sent to registered email.', 'info')}
                  className="text-xs font-bold text-[#EF233C] hover:underline"
                >
                  Forgot?
                </button>
              </div>
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
              rightIcon={<LogIn size={16} />}
            >
              Sign In to Storefront
            </Button>
          </form>

          {/* Quick links to merchant or admin login */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Don't have an account yet?{' '}
              <Link to={PATHS.REGISTER} className="font-bold text-[#EF233C] hover:underline">
                Create one now
              </Link>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-500">
              <Link to={PATHS.MERCHANT_LOGIN} className="hover:text-[#EF233C]">
                Merchant Portal →
              </Link>
              <span>•</span>
              <Link to={PATHS.ADMIN_LOGIN} className="hover:text-[#EF233C]">
                Super Admin →
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerLoginPage
