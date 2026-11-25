import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Store, Mail, Lock, Phone, Eye, EyeOff, UserPlus, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Card, CardContent } from '../../../components/ui/Card'
import { Role } from '../../../types'
import { PATHS } from '../../../routes/routes'
import { registerSchema, validateWithZod } from '../../../validations'

export const RegisterPage: React.FC = () => {
  const { register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [role, setRole] = useState<Role>('customer')
  const [name, setName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validation = validateWithZod(registerSchema, {
      name,
      email,
      password,
      confirmPassword,
      role,
      storeName: role === 'merchant' ? storeName : undefined,
    })

    if (!validation.success) {
      setError(validation.errorMessage)
      return
    }

    setLoading(true)

    const result = await register({
      name,
      email,
      password,
      confirmPassword,
      phone,
      role,
      storeName: role === 'merchant' ? storeName : undefined,
    })

    setLoading(false)

    if (!result.success || !result.user) {
      setError(result.error || 'Failed to create account. Please try again.')
      return
    }

    if (role === 'merchant') {
      showToast(`Welcome to your merchant console, ${storeName || name}!`, 'success')
      navigate(PATHS.MERCHANT.DASHBOARD, { replace: true })
    } else {
      showToast('Welcome to CloudCart! Account created successfully.', 'success')
      navigate(PATHS.HOME, { replace: true })
    }
  }

  return (
    <div className="w-full max-w-lg">
      <Card className="p-2 sm:p-4 shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Create an Account
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Join CloudCart to discover acoustics, hardware, or register as a merchant seller.
            </p>
          </div>

          {/* Account Type Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                role === 'customer'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User size={16} />
              <span>Customer</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('merchant')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                role === 'merchant'
                  ? 'bg-white dark:bg-slate-900 text-[#EF233C] dark:text-red-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Store size={16} />
              <span>Merchant Seller</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label required>Full Name</Label>
              <Input
                type="text"
                required
                placeholder="Tanmay Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User size={16} />}
              />
            </div>

            {role === 'merchant' && (
              <div>
                <Label required>Store Name</Label>
                <Input
                  type="text"
                  required
                  placeholder="Apex Electronics & Acoustics"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  leftIcon={<Store size={16} />}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone size={16} />}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label required>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock size={16} />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <Label required>Confirm Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    leftIcon={<Lock size={16} />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Password must be at least 8 characters with at least one uppercase letter (A-Z) and one number (0-9).
            </p>

            <Button
              type="submit"
              className="w-full mt-4"
              size="lg"
              isLoading={loading}
              rightIcon={<UserPlus size={16} />}
            >
              {role === 'merchant' ? 'Launch Merchant Console' : 'Create Customer Account'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link to={PATHS.LOGIN} className="font-bold text-[#EF233C] hover:underline">
                Sign in here
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegisterPage
