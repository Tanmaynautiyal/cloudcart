import React from 'react'
import { Menu, Search, LogOut } from 'lucide-react'
import BrandLogo from '../../components/common/BrandLogo'
import ThemeToggle from '../../components/common/ThemeToggle'
import LangSwitcher from '../../components/common/LangSwitcher'
import NotificationDropdown from '../../components/common/NotificationDropdown'
import { useAuth } from '../../hooks/useAuth'

interface AdminHeaderProps {
  onToggleMobile: () => void
  title?: string
  subtitle?: string
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleMobile,
  title = 'Administrator Governance',
  subtitle = 'Super Admin Platform Control',
}) => {
  const { user, logout } = useAuth()

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

        <div className="hidden sm:block">
          <h1 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
            {title}
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LangSwitcher />
        <ThemeToggle />
        <NotificationDropdown />

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        <div className="flex items-center gap-2.5">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'}
            alt={user?.name || 'Admin'}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {user?.name || 'Super Admin'}
            </div>
            <div className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
              Governance
            </div>
          </div>
        </div>

        <button
          onClick={() => logout('admin')}
          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Sign out of Governance Portal"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}

export default AdminHeader
