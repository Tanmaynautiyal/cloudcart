import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  Layers,
  ShoppingBag,
  TrendingUp,
  Settings,
  ExternalLink,
  X,
} from 'lucide-react'
import BrandLogo from '../../components/common/BrandLogo'
import { PATHS } from '../../routes/routes'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { to: PATHS.ADMIN.DASHBOARD, label: 'Overview', icon: LayoutDashboard, end: true },
    { to: PATHS.ADMIN.USERS, label: 'User Governance', icon: Users },
    { to: PATHS.ADMIN.MERCHANTS, label: 'Merchants & Stores', icon: Store },
    { to: PATHS.ADMIN.PRODUCTS, label: 'Master Catalog', icon: Package },
    { to: PATHS.ADMIN.CATEGORIES, label: 'Departments', icon: Layers },
    { to: PATHS.ADMIN.ORDERS, label: 'Customer Orders', icon: ShoppingBag },
    { to: PATHS.ADMIN.ANALYTICS, label: 'Sales & Revenue', icon: TrendingUp },
    { to: PATHS.ADMIN.SETTINGS, label: 'Platform Settings', icon: Settings },
  ]

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <BrandLogo to={PATHS.ADMIN.DASHBOARD} badgeText="Admin" />
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Group */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Governance Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-red-50 text-[#EF233C] dark:bg-red-950/40 dark:text-red-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer Link to Storefront */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#EF233C] dark:hover:text-red-400 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink size={14} />
              View Customer Storefront
            </span>
          </a>
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar
