import React from 'react'
import { Outlet } from 'react-router-dom'
import BrandLogo from '../../components/common/BrandLogo'
import ThemeToggle from '../../components/common/ThemeToggle'
import LangSwitcher from '../../components/common/LangSwitcher'

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6">
      {/* Auth Top Header */}
      <header className="flex items-center justify-between max-w-5xl mx-auto w-full py-2">
        <BrandLogo />
        <div className="flex items-center gap-2">
          <LangSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Form Center */}
      <main className="flex items-center justify-center py-8">
        <Outlet />
      </main>

      {/* Auth Footer */}
      <footer className="text-center text-xs text-slate-500 py-4">
        CloudCart Multi-Vendor E-Commerce Platform • Safe & Isolated Sessions
      </footer>
    </div>
  )
}

export default AuthLayout
