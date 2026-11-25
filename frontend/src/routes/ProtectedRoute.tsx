import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { PATHS } from './Paths'
import { Role } from '../types'
import FullScreenLoader from '../components/loaders/FullScreenLoader'

interface ProtectedRouteProps {
  requiredRole?: Role | Role[]
  children?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRole,
  children,
}) => {
  const { isAuthenticated, role, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <FullScreenLoader message="Verifying secure credentials..." />
  }

  // Not authenticated
  if (!isAuthenticated) {
    // Direct to the appropriate portal login
    if (requiredRole === 'admin') {
      return <Navigate to={PATHS.ADMIN_LOGIN} state={{ from: location }} replace />
    }
    if (requiredRole === 'merchant') {
      return <Navigate to={PATHS.MERCHANT_LOGIN} state={{ from: location }} replace />
    }
    return <Navigate to={PATHS.LOGIN} state={{ from: location }} replace />
  }

  // Check required role
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (role && !roles.includes(role)) {
      // Authenticated but unauthorized for this portal
      if (role === 'admin') {
        return <Navigate to={PATHS.ADMIN.DASHBOARD} replace />
      }
      if (role === 'merchant') {
        return <Navigate to={PATHS.MERCHANT.DASHBOARD} replace />
      }
      return <Navigate to={PATHS.HOME} replace />
    }
  }

  return children ? <>{children}</> : <Outlet />
}

export default ProtectedRoute
