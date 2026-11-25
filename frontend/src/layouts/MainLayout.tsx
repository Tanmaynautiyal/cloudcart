import React from 'react'
import CustomerLayout from './customer/CustomerLayout'

// Alias MainLayout to CustomerLayout for default public presentation
export const MainLayout: React.FC = () => {
  return <CustomerLayout />
}

export default MainLayout
