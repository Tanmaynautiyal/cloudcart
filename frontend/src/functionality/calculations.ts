import { CartItem, CartTotals } from '../types/cart'

export const TAX_RATE = 0.085 // 8.5%
export const FREE_SHIPPING_THRESHOLD = 50.0
export const STANDARD_SHIPPING_COST = 9.99

export const calculateCartTotals = (
  items: CartItem[],
  discountPercent: number = 0
): CartTotals => {
  const itemCount = items.reduce((acc, item) => acc + (item.quantity || 1), 0)
  const subtotal = items.reduce((acc, item) => {
    const price = typeof item.price === 'number' ? item.price : item.product?.price || 0
    return acc + price * (item.quantity || 1)
  }, 0)

  const discount = discountPercent > 0 ? (subtotal * discountPercent) / 100 : 0
  const taxableAmount = Math.max(0, subtotal - discount)
  const tax = Number((taxableAmount * TAX_RATE).toFixed(2))
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || items.length === 0 ? 0 : STANDARD_SHIPPING_COST
  const total = Number((taxableAmount + tax + shipping).toFixed(2))

  return {
    itemCount,
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    shipping: Number(shipping.toFixed(2)),
    tax,
    total,
  }
}

export const calculateDiscountSavings = (
  price: number,
  originalPrice?: number
): { savingsAmount: number; savingsPercentage: number } => {
  if (!originalPrice || originalPrice <= price) {
    return { savingsAmount: 0, savingsPercentage: 0 }
  }
  const savingsAmount = originalPrice - price
  const savingsPercentage = Math.round((savingsAmount / originalPrice) * 100)
  return { savingsAmount, savingsPercentage }
}
