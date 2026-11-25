export type Theme = 'light' | 'dark'

export type Language = 'en' | 'hi'

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}
