import React from 'react'
import { Menu, LogOut, Store, ExternalLink, CheckCircle } from 'lucide-react'
import ThemeToggle from '../../components/common/ThemeToggle'
import LangSwitcher from '../../components/common/LangSwitcher'
import NotificationDropdown from '../../components/common/NotificationDropdown'
import { useAuth } from '../../hooks/useAuth'

interface MerchantHeaderProps {
  onToggleMobile: () => void
  storeName?: string
}

export const MerchantHeader: React.FC<MerchantHeaderProps> = ({
  onToggleMobile,
  storeName = 'plumb tools',
}) => {
  const { user, logout } = useAuth()
  const displayStore = user?.storeName || storeName

  return (
    <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleMobile}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          aria-label="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-xs">
            <Store size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                {displayStore}
              </h1>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle size={11} className="shrink-0" />
              <span>Seller Verified</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LangSwitcher />
        <ThemeToggle />
        <NotificationDropdown />

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ExternalLink size={13} />
          <span>Customer Storefront</span>
        </a>

        <button
          onClick={() => logout('merchant')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-xs font-semibold text-[#EF233C] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          title="Sign out of Merchant Console"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  )
}

export default MerchantHeader
