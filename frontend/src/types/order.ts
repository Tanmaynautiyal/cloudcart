export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded'

export interface OrderItem {
  id?: string | number
  productId?: string | number
  product_id?: string | number
  name?: string
  productName?: string
  image?: string
  productImage?: string
  quantity: number
  price: number
  subtotal?: number
}

export interface Order {
  id: string
  orderNumber?: string
  date?: string
  createdAt?: string
  created_at?: string
  customer?: {
    name: string
    email: string
    avatar?: string
  }
  customerName?: string
  customerEmail?: string
  merchantId?: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  deliveryStatus?: OrderStatus
  shippingAddress?: any
  paymentMethod?: string
  trackingNumber?: string
  tracking_number?: string
  rawId?: number
}
