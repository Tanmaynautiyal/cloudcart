import React from 'react'
import { Outlet } from 'react-router-dom'
import CustomerHeader from './CustomerHeader'
import CustomerFooter from './CustomerFooter'

export const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <CustomerHeader />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <CustomerFooter />
    </div>
  )
}

export default CustomerLayout
