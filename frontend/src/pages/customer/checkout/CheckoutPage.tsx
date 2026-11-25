import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Truck, CreditCard, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useCart } from '../../../hooks/useCart'
import { useAuth } from '../../../hooks/useAuth'
import { useStore } from '../../../hooks/useStore'
import { useToast } from '../../../hooks/useToast'
import { formatCurrency } from '../../../functionality/formatters'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Card, CardContent } from '../../../components/ui/Card'
import { PATHS } from '../../../routes/routes'
import { shippingAddressSchema, validateWithZod } from '../../../validations'

export const CheckoutPage: React.FC = () => {
  const { cart, cartTotal, cartSubtotal, shippingCost, taxAmount, clearCart } = useCart()
  const { user } = useAuth()
  const { createOrder } = useStore()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState(user?.name || 'Tanmay Sharma')
  const [email, setEmail] = useState(user?.email || 'tanmay@cloudcart.com')
  const [phone, setPhone] = useState(user?.phone || '+1 (555) 234-5678')
  const [street, setStreet] = useState('742 Evergreen Terrace')
  const [city, setCity] = useState('San Francisco')
  const [state, setState] = useState('CA')
  const [zipCode, setZipCode] = useState('94105')
  const [country, setCountry] = useState('United States')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'cod'>('card')
  const [submitting, setSubmitting] = useState(false)

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          Your Cart is Empty
        </h2>
        <p className="text-xs text-slate-500">
          Add items to your cart before proceeding to checkout.
        </p>
        <Link to={PATHS.SHOP}>
          <Button>Browse Products</Button>
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateWithZod(shippingAddressSchema, {
      fullName,
      address: street,
      city,
      state,
      zipCode,
      country,
      phone,
    })

    if (!validation.success) {
      showToast(validation.errorMessage, 'error')
      return
    }

    setSubmitting(true)

    const formattedAddress = `${fullName}, ${street}, ${city}, ${state} ${zipCode}, ${country}`
    const paymentLabel =
      paymentMethod === 'card'
        ? 'Credit Card (•••• 4242)'
        : paymentMethod === 'paypal'
        ? 'PayPal Express'
        : 'Cash on Delivery'

    try {
      const orderId = await createOrder({
        customerName: fullName,
        customer: {
          name: fullName,
          email,
        },
        items: cart,
        total: cartTotal,
        shippingAddress: formattedAddress,
        shipping_address: formattedAddress,
        paymentMethod: paymentLabel,
        payment_method: paymentLabel,
      })

      await clearCart()
      setSubmitting(false)
      showToast(`Order #${orderId} placed successfully!`, 'success')
      navigate(PATHS.ORDERS)
    } catch (err: any) {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link
        to={PATHS.CART}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#EF233C]"
      >
        <ArrowLeft size={14} /> Return to Shopping Cart
      </Link>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
        Checkout & Payment
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Delivery Form & Payment Selector */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Delivery Address Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/60 text-[#EF233C] text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Delivery Address
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label required>Full Name</Label>
                <Input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Email Address</Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label required>Phone Number</Label>
                  <Input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label required>Street Address</Label>
                <Input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <Label required>City</Label>
                  <Input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <Label required>State</Label>
                  <Input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
                <div>
                  <Label required>ZIP</Label>
                  <Input
                    type="text"
                    required
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
                <div>
                  <Label required>Country</Label>
                  <Input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* 2. Payment Selector Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/60 text-[#EF233C] text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Payment Method
              </h2>
            </div>

            <div className="space-y-3">
              {/* Card Option */}
              <label
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-[#EF233C] bg-red-50/30 dark:bg-red-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="accent-[#EF233C]"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      Credit / Debit Card (Stripe Test Simulation)
                    </div>
                    <div className="text-xs text-slate-500">
                      Safe 256-bit encrypted simulated gateway
                    </div>
                  </div>
                </div>
                <CreditCard size={20} className="text-slate-400" />
              </label>

              {/* PayPal Option */}
              <label
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === 'paypal'
                    ? 'border-[#EF233C] bg-red-50/30 dark:bg-red-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'paypal'}
                    onChange={() => setPaymentMethod('paypal')}
                    className="accent-[#EF233C]"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      PayPal Express
                    </div>
                    <div className="text-xs text-slate-500">Pay via authenticated PayPal balance</div>
                  </div>
                </div>
              </label>

              {/* Cash on Delivery */}
              <label
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === 'cod'
                    ? 'border-[#EF233C] bg-red-50/30 dark:bg-red-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="accent-[#EF233C]"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      Cash on Delivery
                    </div>
                    <div className="text-xs text-slate-500">Pay cash upon courier arrival</div>
                  </div>
                </div>
              </label>
            </div>
          </Card>
        </div>

        {/* Right Column: Order Review & Submit */}
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Order Review ({cart.length} items)
            </h3>

            <div className="space-y-3 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
              {cart.map((it) => (
                <div key={it.id} className="pt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={it.product.image}
                      alt={it.product.name}
                      className="w-10 h-10 rounded-md object-cover"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-[130px]">
                        {it.product.name}
                      </div>
                      <div className="text-slate-400">Qty: {it.quantity}</div>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(it.product.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Shipping</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Sales Tax (8.5%)</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(taxAmount)}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-black text-slate-900 dark:text-white">Total</span>
                <span className="text-xl font-black text-[#EF233C]">{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-4"
              isLoading={submitting}
            >
              Place Confirmed Order
            </Button>
          </Card>
        </div>
      </form>
    </div>
  )
}

export default CheckoutPage
