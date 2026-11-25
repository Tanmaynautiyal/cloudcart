import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { PATHS } from './Paths'
import { Role } from '../types'

interface GuestRouteProps {
  children?: React.ReactNode
}

export const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { isAuthenticated, role } = useAuth()

  if (isAuthenticated && role) {
    if (role === 'admin') {
      return <Navigate to={PATHS.ADMIN.DASHBOARD} replace />
    }
    if (role === 'merchant') {
      return <Navigate to={PATHS.MERCHANT.DASHBOARD} replace />
    }
    return <Navigate to={PATHS.PROFILE} replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default GuestRoute
