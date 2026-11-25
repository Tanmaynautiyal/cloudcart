import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, Role, LoginCredentials, RegisterCredentials } from '../types'
import { authApi } from '../api/baseApi'
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
} from '../functionality/storage'
import { STORAGE_KEYS } from '../constants/storage'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  role: Role | null
  isAdmin: boolean
  isMerchant: boolean
  isCustomer: boolean
  loading: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials, preferredRole?: Role) => Promise<{ success: boolean; user?: User; error?: string }>
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; user?: User; error?: string }>
  logout: (role?: Role) => void
  updateProfile: (updatedData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const extractErrorMessage = (err: any, fallback: string): string => {
  const data = err.response?.data
  if (data?.error?.message) {
    if (Array.isArray(data.error.details) && data.error.details.length > 0) {
      return data.error.details
        .map((d: any) => `${d.field ? d.field + ': ' : ''}${d.message}`)
        .join(', ')
    }
    return data.error.message
  }
  if (typeof data?.detail === 'string') {
    return data.detail
  }
  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((d: any) => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`)
      .join(', ')
  }
  if (data?.message) {
    return data.message
  }
  if (err.message && !err.message.includes('422')) {
    return err.message
  }
  return fallback
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          return null
        }
      }
    }
    return null
  })

  const [token, setToken] = useState<string | null>(() => getAuthToken())
  const [loading, setLoading] = useState<boolean>(true)

  // Verify and refresh session on mount directly from backend API
  useEffect(() => {
    const initAuth = async () => {
      const activeToken = getAuthToken()
      if (activeToken) {
        try {
          const profile = await authApi.getMe()
          if (profile) {
            const rawRole = (profile.role || '').toLowerCase()
            const role: Role =
              rawRole === 'admin'
                ? 'admin'
                : rawRole === 'merchant' || rawRole === 'seller'
                ? 'merchant'
                : 'customer'

            const normalizedUser: User = {
              ...profile,
              role,
              name: profile.full_name || profile.username || 'User',
              storeName: profile.store_name || undefined,
            }
            setUser(normalizedUser)
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(normalizedUser))
          }
        } catch (err) {
          // If token expired or invalid, clear invalid state
          removeAuthToken()
          setUser(null)
          setToken(null)
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = useCallback(
    async (
      credentials: LoginCredentials,
      preferredRole?: Role
    ): Promise<{ success: boolean; user?: User; error?: string }> => {
      try {
        const res = await authApi.login(credentials)
        if (res && res.access_token) {
          const rawRole = (res.user?.role || preferredRole || 'customer').toLowerCase()
          const role: Role =
            rawRole === 'admin'
              ? 'admin'
              : rawRole === 'merchant' || rawRole === 'seller'
              ? 'merchant'
              : 'customer'

          const loggedInUser: User = {
            ...res.user,
            role,
            name: res.user?.full_name || res.user?.username || credentials.email.split('@')[0],
            storeName: res.user?.store_name || undefined,
          }

          setAuthToken(res.access_token, role)
          setToken(res.access_token)
          setUser(loggedInUser)
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(loggedInUser))

          return { success: true, user: loggedInUser }
        }
        return { success: false, error: 'Invalid response from authentication server.' }
      } catch (err: any) {
        const msg = extractErrorMessage(err, 'Invalid email or password. Please try again.')
        return { success: false, error: msg }
      }
    },
    []
  )

  const register = useCallback(
    async (
      credentials: RegisterCredentials
    ): Promise<{ success: boolean; user?: User; error?: string }> => {
      try {
        const res = await authApi.register(credentials)
        let token = res?.access_token

        // Auto-login fallback if register only returned user object
        if (!token) {
          try {
            const loginRes = await authApi.login({
              email: credentials.email,
              password: credentials.password,
            })
            token = loginRes?.access_token
          } catch {
            // Keep going with empty token
          }
        }

        const rawRole = (res?.user?.role || res?.role || credentials.role || 'customer').toLowerCase()
        const role: Role =
          rawRole === 'admin'
            ? 'admin'
            : rawRole === 'merchant' || rawRole === 'seller'
            ? 'merchant'
            : 'customer'

        const registeredUser: User = {
          ...(res?.user || res),
          id: String(res?.id || res?.user?.id || Date.now()),
          email: credentials.email,
          role,
          name: credentials.name,
          storeName: credentials.storeName || (role === 'merchant' ? 'Official Store' : undefined),
          isActive: true,
        }

        if (token) {
          setAuthToken(token, role)
          setToken(token)
        }
        setUser(registeredUser)
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(registeredUser))

        return { success: true, user: registeredUser }
      } catch (err: any) {
        const msg = extractErrorMessage(err, 'Registration failed. Please verify credentials.')
        return { success: false, error: msg }
      }
    },
    []
  )

  const logout = useCallback((role?: Role) => {
    authApi.logout()
    removeAuthToken(role || user?.role)
    setUser(null)
    setToken(null)
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
  }, [user?.role])

  const updateProfile = useCallback((updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null
      const next = { ...prev, ...updatedData }
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(next))
      return next
    })
  }, [])

  const role = user?.role || null
  const isAdmin = role === 'admin'
  const isMerchant = role === 'merchant'
  const isCustomer = role === 'customer'
  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        role,
        isAdmin,
        isMerchant,
        isCustomer,
        loading,
        isLoading: loading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
