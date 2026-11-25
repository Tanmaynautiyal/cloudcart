import React from 'react'
import AppProviders from './providers/AppProviders'
import AppRoutes from './routes/Routes'

export const App: React.FC = () => {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  )
}

export default App
