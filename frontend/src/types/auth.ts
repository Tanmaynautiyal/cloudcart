export type Role = 'admin' | 'merchant' | 'customer'

export interface User {
  id: string | number
  email: string
  name: string
  username?: string
  full_name?: string
  phone?: string
  role: Role
  is_admin?: boolean
  is_active?: boolean
  isActive?: boolean
  is_blocked?: boolean
  isBlocked?: boolean
  storeName?: string
  store_name?: string
  avatar?: string
  avatar_url?: string
  createdAt?: string
  created_at?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isMerchant: boolean
  isCustomer: boolean
  token: string | null
  loading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  confirmPassword?: string
  phone?: string
  role: Role
  storeName?: string
}

export interface AuthResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  user: User
}
