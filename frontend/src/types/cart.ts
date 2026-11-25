import { Product } from './product'

export interface CartItem {
  id: string | number
  product: Product
  quantity: number
  price: number
}

export interface Coupon {
  code: string
  discountPercent: number
  description: string
}

export interface CartTotals {
  itemCount: number
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
}
