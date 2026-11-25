import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft, Tag, X } from 'lucide-react'
import { useCart } from '../../../hooks/useCart'
import { formatCurrency } from '../../../functionality/formatters'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Card, CardContent } from '../../../components/ui/Card'
import { PATHS } from '../../../routes/routes'

export const CartPage: React.FC = () => {
  const {
    cart,
    cartCount,
    cartSubtotal,
    discountAmount,
    coupon,
    shippingCost,
    taxAmount,
    cartTotal,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart()

  const [couponCode, setCouponCode] = useState('')
  const navigate = useNavigate()

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (couponCode.trim()) {
      applyCoupon(couponCode)
      setCouponCode('')
    }
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-[#EF233C] flex items-center justify-center mx-auto">
          <ShoppingBag size={28} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          Your Shopping Cart is Empty
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Explore our reference-grade audio acoustics, creator hardware, and smartwatches.
        </p>
        <div className="pt-4">
          <Link to={PATHS.SHOP}>
            <Button size="lg" rightIcon={<ArrowRight size={16} />}>
              Explore Hardware Catalog
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Shopping Cart
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            You have {cartCount} item{cartCount > 1 ? 's' : ''} in your order
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5"
        >
          <Trash2 size={14} />
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Item Rows */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <Card key={item.id} className="p-4 flex flex-col sm:flex-row items-center gap-4">
              <Link
                to={`/product/${item.product.slug}`}
                className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 shrink-0"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </Link>

              <div className="flex-1 text-center sm:text-left">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {item.product.brand || item.product.category}
                </div>
                <Link
                  to={`/product/${item.product.slug}`}
                  className="text-sm font-bold text-slate-900 dark:text-white hover:text-[#EF233C] line-clamp-1 mt-0.5"
                >
                  {item.product.name}
                </Link>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  {formatCurrency(item.product.price)}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  -
                </button>
                <span className="px-3 py-1.5 text-xs font-bold min-w-8 text-center text-slate-900 dark:text-white">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  +
                </button>
              </div>

              {/* Line Subtotal & Remove */}
              <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {formatCurrency(item.product.price * item.quantity)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-slate-400 hover:text-red-500 p-1"
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}

          <div className="pt-2">
            <Link
              to={PATHS.SHOP}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#EF233C]"
            >
              <ArrowLeft size={14} /> Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary & Coupon Card */}
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal ({cartCount} items)</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(cartSubtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Promotional Discount</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Estimated Shipping</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Estimated Sales Tax (8.5%)</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(taxAmount)}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-black text-slate-900 dark:text-white">Estimated Total</span>
                <span className="text-xl font-black text-[#EF233C]">{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            {/* Promo Coupon Form */}
            <form onSubmit={handleCouponSubmit} className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Promo Code (e.g. SAVE10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  leftIcon={<Tag size={14} />}
                />
                <Button type="submit" variant="outline" size="sm">
                  Apply
                </Button>
              </div>

              {coupon && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
                  <span>Active: {coupon.code} ({coupon.discountPercent}% OFF)</span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </form>

            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate(PATHS.CHECKOUT)}
              rightIcon={<ArrowRight size={16} />}
            >
              Proceed to Checkout
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CartPage
