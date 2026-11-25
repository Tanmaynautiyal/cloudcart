import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import MerchantHeader from './MerchantHeader'
import MerchantSidebar from './MerchantSidebar'

export const MerchantLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      <MerchantSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <MerchantHeader onToggleMobile={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-6 md:p-8 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MerchantLayout
