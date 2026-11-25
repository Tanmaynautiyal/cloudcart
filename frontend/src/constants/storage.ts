export const STORAGE_KEYS = {
  // Isolated tokens per role to prevent session collisions
  ADMIN_TOKEN: 'cloudcart_admin_token',
  MERCHANT_TOKEN: 'cloudcart_merchant_token',
  CUSTOMER_TOKEN: 'cloudcart_customer_token',

  // User state
  CURRENT_USER: 'cloudcart_user',
  THEME: 'cloudcart_theme',
  LANGUAGE: 'cloudcart_language',

  // Store persistence keys
  CART: 'cloudcart_cart',
  WISHLIST: 'cloudcart_wishlist',
  PRODUCTS: 'cloudcart_products_v3',
  CATEGORIES: 'cloudcart_categories_v3',
  ORDERS: 'cloudcart_orders_v3',
  MERCHANTS: 'cloudcart_merchants_v3',
} as const
