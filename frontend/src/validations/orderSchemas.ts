import { z } from 'zod'

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  address: z.string().trim().min(5, 'Street address is required'),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State / Province is required'),
  zipCode: z.string().trim().min(3, 'Postal / ZIP code is required'),
  country: z.string().trim().min(2, 'Country is required'),
  phone: z.string().trim().min(7, 'Contact telephone is required'),
})

export type ShippingAddressFormData = z.infer<typeof shippingAddressSchema>

export const checkoutSchema = z.object({
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(['CARD', 'COD', 'UPI', 'STRIPE']).default('CARD'),
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>

export const addToCartSchema = z.object({
  productId: z.union([z.string(), z.number()]),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
})

export type AddToCartInput = z.infer<typeof addToCartSchema>
