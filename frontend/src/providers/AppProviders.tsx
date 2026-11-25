import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { ToastProvider } from '../components/toaster/Toaster'
import { AuthProvider } from '../contexts/AuthContext'
import { StoreProvider } from '../contexts/StoreContext'
import { CartProvider } from '../contexts/CartContext'
import ErrorBoundary from '../components/error-boundary/ErrorBoundary'

interface AppProvidersProps {
  children: React.ReactNode
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <StoreProvider>
              <CartProvider>
                <BrowserRouter>{children}</BrowserRouter>
              </CartProvider>
            </StoreProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default AppProviders
