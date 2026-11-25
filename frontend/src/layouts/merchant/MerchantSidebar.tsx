import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  DollarSign,
  Boxes,
  ShoppingBag,
  Truck,
  Settings,
  ExternalLink,
  LogOut,
  X,
  Store,
} from 'lucide-react'
import { PATHS } from '../../routes/routes'
import { useAuth } from '../../hooks/useAuth'

interface MerchantSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const MerchantSidebar: React.FC<MerchantSidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth()

  const navItems = [
    { to: PATHS.MERCHANT.DASHBOARD, label: 'Store Overview', icon: LayoutDashboard, end: true },
    { to: PATHS.MERCHANT.PRODUCTS, label: 'My Products', icon: Package },
    { to: PATHS.MERCHANT.PRICING, label: 'Pricing & Deals', icon: DollarSign },
    { to: PATHS.MERCHANT.INVENTORY, label: 'Inventory Control', icon: Boxes },
    { to: PATHS.MERCHANT.ORDERS, label: 'Customer Orders', icon: ShoppingBag },
    { to: PATHS.MERCHANT.LOGISTICS, label: 'Logistics & Dispatch', icon: Truck },
    { to: PATHS.MERCHANT.PROFILE, label: 'Store Profile', icon: Settings },
  ]

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Store Header */}
        <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EF233C] text-white flex items-center justify-center font-black text-sm">
              <Store size={18} />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                {user?.storeName || 'plumb tools'}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ Seller Verified
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Section title & Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Merchant Console
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
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-red-50 text-[#EF233C] dark:bg-red-950/40 dark:text-red-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer Area: View Live Storefront & Merchant User Profile */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-850/50">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#EF233C] dark:hover:text-red-400 px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <ExternalLink size={14} />
            <span>View Live Storefront</span>
          </a>

          <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'}
                alt={user?.name || 'Jony'}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || 'Jony'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">Merchant Account</div>
              </div>
            </div>
            <button
              onClick={() => logout('merchant')}
              className="p-1.5 text-slate-400 hover:text-[#EF233C] transition-colors"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default MerchantSidebar
