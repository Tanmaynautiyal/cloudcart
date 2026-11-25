export const ROLES = {
  ADMIN: 'admin',
  MERCHANT: 'merchant',
  CUSTOMER: 'customer',
} as const

export type AppRole = typeof ROLES[keyof typeof ROLES]
