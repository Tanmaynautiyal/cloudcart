import { z } from 'zod'

export const productFormSchema = z.object({
  name: z.string().trim().min(2, 'Product name must be at least 2 characters'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  originalPrice: z.coerce.number().positive('Regular price must be greater than 0').optional(),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  category: z.string().min(1, 'Please select a valid department/category'),
  description: z.string().optional().default(''),
  image: z.string().trim().min(1, 'Product image URL is required'),
  sku: z.string().trim().optional(),
})

export type ProductFormData = z.infer<typeof productFormSchema>

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, 'Department name must be at least 2 characters'),
  slug: z.string().trim().min(2, 'Slug URL must be at least 2 characters'),
  icon: z.string().optional().default('Layers'),
  description: z.string().optional().default(''),
  image: z.string().optional().default(''),
})

export type CategoryFormData = z.infer<typeof categoryFormSchema>
