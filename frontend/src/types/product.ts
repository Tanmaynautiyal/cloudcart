export interface Category {
  id: string | number
  name: string
  slug: string
  icon?: string
  description?: string
  image?: string
  image_url?: string
  itemCount?: number
  salesCount?: number
  revenue?: number
  status?: 'Active' | 'Paused'
  is_active?: boolean
  discountLabel?: string
  rawId?: number
}

export interface Product {
  id: string | number
  rawId?: number
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  original_price?: number
  category: string
  categoryId?: number
  category_id?: number
  stock: number
  brand?: string
  badge?: string
  rating: number
  reviewsCount?: number
  reviews_count?: number
  image?: string
  imageUrl?: string
  image_url?: string
  isFeatured?: boolean
  is_featured?: boolean
  isPaused?: boolean
  is_active?: boolean
  merchantId?: string | number
  merchantName?: string
  storeName?: string
  created_at?: string
}

export interface Review {
  id: string | number
  productId: string | number
  userName: string
  rating: number
  date: string
  comment: string
  avatar?: string
}
