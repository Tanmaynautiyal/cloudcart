import { STORAGE_KEYS } from '../constants/storage'
import { Role } from '../types/auth'

/**
 * Isolated Cookie / Token Storage Utilities
 * Implements strict role-isolated session storage
 */

export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export const setCookie = (name: string, value: string, days = 7): void => {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export const removeCookie = (name: string): void => {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`
}

export const getRoleTokenKey = (role: Role): string => {
  switch (role) {
    case 'admin':
      return STORAGE_KEYS.ADMIN_TOKEN
    case 'merchant':
      return STORAGE_KEYS.MERCHANT_TOKEN
    case 'customer':
    default:
      return STORAGE_KEYS.CUSTOMER_TOKEN
  }
}

export const getAuthToken = (role?: Role): string | null => {
  if (role) {
    const key = getRoleTokenKey(role)
    return getCookie(key) || localStorage.getItem(key)
  }

  // Auto-detect based on current path with robust fallback
  if (typeof window !== 'undefined') {
    const path = window.location.pathname
    if (path.startsWith('/admin')) {
      return (
        getCookie(STORAGE_KEYS.ADMIN_TOKEN) ||
        localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) ||
        localStorage.getItem('cloudcart_token')
      )
    }
    if (path.startsWith('/merchant')) {
      return (
        getCookie(STORAGE_KEYS.MERCHANT_TOKEN) ||
        localStorage.getItem(STORAGE_KEYS.MERCHANT_TOKEN) ||
        localStorage.getItem('cloudcart_token')
      )
    }
    return (
      getCookie(STORAGE_KEYS.CUSTOMER_TOKEN) ||
      localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN) ||
      getCookie(STORAGE_KEYS.ADMIN_TOKEN) ||
      localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) ||
      getCookie(STORAGE_KEYS.MERCHANT_TOKEN) ||
      localStorage.getItem(STORAGE_KEYS.MERCHANT_TOKEN) ||
      localStorage.getItem('cloudcart_token')
    )
  }
  return null
}

export const setAuthToken = (token: string, role: Role): void => {
  const key = getRoleTokenKey(role)
  setCookie(key, token, 7)
  localStorage.setItem(key, token)
  // Also keep general token in sync for fallback
  localStorage.setItem('cloudcart_token', token)
}

export const removeAuthToken = (role?: Role): void => {
  if (role) {
    const key = getRoleTokenKey(role)
    removeCookie(key)
    localStorage.removeItem(key)
  } else {
    removeCookie(STORAGE_KEYS.ADMIN_TOKEN)
    removeCookie(STORAGE_KEYS.MERCHANT_TOKEN)
    removeCookie(STORAGE_KEYS.CUSTOMER_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.MERCHANT_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER_TOKEN)
    localStorage.removeItem('cloudcart_token')
  }
}
