import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { CartItem, Product, Coupon, CartTotals } from '../types'
import { cartApi } from '../api/baseApi'
import { calculateCartTotals } from '../functionality/calculations'
import { useToast } from '../components/toaster/Toaster'
import { STORAGE_KEYS } from '../constants/storage'

interface CartContextType {
  cart: CartItem[]
  cartCount: number
  cartSubtotal: number
  discountAmount: number
  shippingCost: number
  taxAmount: number
  cartTotal: number
  totals: CartTotals
  coupon: Coupon | null
  loading: boolean
  addToCart: (product: Product, quantity?: number) => Promise<void>
  updateQuantity: (productId: string | number, quantity: number) => Promise<void>
  removeFromCart: (productId: string | number) => Promise<void>
  clearCart: () => Promise<void>
  applyCoupon: (code: string) => boolean
  removeCoupon: () => void
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const VALID_COUPONS: Record<string, Coupon> = {
  SAVE10: { code: 'SAVE10', discountPercent: 10, description: '10% OFF hardware order' },
  CLOUDCART20: { code: 'CLOUDCART20', discountPercent: 20, description: '20% OFF sitewide sale' },
  WELCOME15: { code: 'WELCOME15', discountPercent: 15, description: '15% new customer discount' },
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast()

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.CART)
        if (saved) return JSON.parse(saved)
      } catch {
        return []
      }
    }
    return []
  })

  const [loading, setLoading] = useState(false)
  const [coupon, setCoupon] = useState<Coupon | null>(null)

  // Recalculate totals using reusable calculation utility
  const totals = calculateCartTotals(cart, coupon ? coupon.discountPercent : 0)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart))
  }, [cart])

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true)
      const res = await cartApi.getCart()
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        const mapped: CartItem[] = res.items.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          price: Number(item.product?.price || 0),
          product: {
            id: item.product?.id || item.product_id,
            name: item.product?.name || 'Product',
            slug: item.product?.slug || `prod-${item.product_id}`,
            description: item.product?.description || '',
            price: Number(item.product?.price || 0),
            stock: item.product?.stock || 50,
            category: item.product?.category?.slug || 'audio',
            rating: 4.8,
            image: item.product?.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
          },
        }))
        setCart(mapped)
      }
    } catch (e) {
      // Use local state
    } finally {
      setLoading(false)
    }
  }, [])

  const addToCart = useCallback(
    async (product: Product, quantity = 1) => {
      setCart((prev) => {
        const existing = prev.find(
          (item) => String(item.product.id) === String(product.id)
        )
        if (existing) {
          const newQty = existing.quantity + quantity
          showToast(`Updated "${product.name}" quantity to ${newQty}`, 'success')
          return prev.map((item) =>
            String(item.product.id) === String(product.id)
              ? { ...item, quantity: newQty }
              : item
          )
        }
        showToast(`Added "${product.name}" to cart!`, 'success')
        return [
          ...prev,
          {
            id: `item-${Date.now()}`,
            product,
            quantity,
            price: product.price,
          },
        ]
      })

      // Backend sync
      if (product.rawId || typeof product.id === 'number') {
        const idNum = Number(product.rawId || product.id)
        if (!isNaN(idNum)) {
          try {
            await cartApi.addItem(idNum, quantity)
          } catch (e) {
            // Local state preserved
          }
        }
      }
    },
    [showToast]
  )

  const removeFromCart = useCallback(
    async (productId: string | number) => {
      setCart((prev) => {
        const target = prev.find((item) => String(item.product.id) === String(productId))
        if (target) {
          showToast(`Removed "${target.product.name}" from cart`, 'info')
        }
        return prev.filter((item) => String(item.product.id) !== String(productId))
      })

      const idNum = Number(productId)
      if (!isNaN(idNum)) {
        try {
          await cartApi.removeItem(idNum)
        } catch {
          // Local state preserved
        }
      }
    },
    [showToast]
  )

  const updateQuantity = useCallback(
    async (productId: string | number, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId)
        return
      }

      setCart((prev) =>
        prev.map((item) =>
          String(item.product.id) === String(productId)
            ? { ...item, quantity }
            : item
        )
      )

      const idNum = Number(productId)
      if (!isNaN(idNum)) {
        try {
          await cartApi.updateItem(idNum, quantity)
        } catch {
          // Local state preserved
        }
      }
    },
    [removeFromCart]
  )

  const clearCart = useCallback(async () => {
    setCart([])
    setCoupon(null)
    localStorage.removeItem(STORAGE_KEYS.CART)
    try {
      await cartApi.clearCart()
    } catch (e) {
      // Local state cleared
    }
  }, [])

  const applyCoupon = useCallback(
    (code: string): boolean => {
      const normalized = code.trim().toUpperCase()
      if (VALID_COUPONS[normalized]) {
        setCoupon(VALID_COUPONS[normalized])
        showToast(`Coupon "${normalized}" applied (${VALID_COUPONS[normalized].discountPercent}% OFF)!`, 'success')
        return true
      }
      showToast(`Invalid promo coupon code "${code}". Try SAVE10 or CLOUDCART20.`, 'error')
      return false
    },
    [showToast]
  )

  const removeCoupon = useCallback(() => {
    setCoupon(null)
    showToast('Promo coupon removed', 'info')
  }, [showToast])

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount: totals.itemCount,
        cartSubtotal: totals.subtotal,
        discountAmount: totals.discount,
        shippingCost: totals.shipping,
        taxAmount: totals.tax,
        cartTotal: totals.total,
        totals,
        coupon,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export default CartProvider
