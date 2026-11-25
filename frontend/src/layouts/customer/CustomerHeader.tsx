import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Truck,
  ShieldCheck,
  Headphones,
  Search,
  ShoppingBag,
  Heart,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
  LogIn,
  LogOut,
  Package,
  Shield,
  Store,
  Layers,
} from 'lucide-react'
import BrandLogo from '../../components/common/BrandLogo'
import ThemeToggle from '../../components/common/ThemeToggle'
import LangSwitcher from '../../components/common/LangSwitcher'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { useStore } from '../../hooks/useStore'
import { PATHS } from '../../routes/routes'

export const CustomerHeader: React.FC = () => {
  const { user, isAuthenticated, isAdmin, isMerchant, logout } = useAuth()
  const { cartCount } = useCart()
  const { wishlist, categories } = useStore()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false)

  const accountRef = useRef<HTMLDivElement>(null)
  const categoriesRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false)
      }
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setCategoriesDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
      setMobileMenuOpen(false)
    }
  }

  const categoryNavItems = [
    { label: 'Mobiles', slug: 'mobiles' },
    { label: 'Laptops', slug: 'laptops' },
    { label: 'Audio', slug: 'audio' },
    { label: 'Wearables', slug: 'smartwatches' },
    { label: 'Accessories', slug: 'accessories' },
    { label: 'Smart Home', slug: 'smart-home' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      {/* 1. Top Announcement Bar */}
      <div className="bg-[#D90429] text-white text-[11px] sm:text-xs font-semibold py-1.5 px-4 tracking-tight">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Truck size={14} className="shrink-0" />
            <span>Free Shipping on Orders Over $50</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <ShieldCheck size={14} className="shrink-0" />
            <span>Secure Payments | Easy Returns</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <Headphones size={14} className="shrink-0" />
            <span>24/7 Customer Support</span>
          </div>
        </div>
      </div>

      {/* 2. Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4 sm:gap-6">
          {/* Logo */}
          <div className="shrink-0">
            <BrandLogo />
          </div>

          {/* Centered Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xl relative items-center"
          >
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-5 pr-12 py-2 text-sm rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EF233C] focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1 w-8 h-8 rounded-full bg-[#EF233C] hover:bg-[#D90429] text-white flex items-center justify-center transition-colors shadow-xs"
            >
              <Search size={15} />
            </button>
          </form>

          {/* User Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden lg:flex items-center gap-1">
              <ThemeToggle />
              <LangSwitcher />
            </div>

            {/* Account Dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-[#EF233C] transition-colors py-1.5 px-1 focus:outline-none"
              >
                <UserIcon size={18} className="text-slate-600 dark:text-slate-300" />
                <span>
                  {isAuthenticated ? user?.name?.split(' ')[0] || 'Account' : 'Account'}
                </span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              {accountDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {user?.name || user?.email}
                        </p>
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-[#EF233C]">
                          {user?.role || 'Customer'}
                        </span>
                      </div>

                      <div className="py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <Link
                          to={PATHS.PROFILE}
                          onClick={() => setAccountDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                        >
                          <UserIcon size={15} className="text-slate-400" />
                          My Profile
                        </Link>
                        <Link
                          to={PATHS.ORDERS}
                          onClick={() => setAccountDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                        >
                          <Package size={15} className="text-slate-400" />
                          My Orders
                        </Link>
                        <Link
                          to={PATHS.WISHLIST}
                          onClick={() => setAccountDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                        >
                          <Heart size={15} className="text-slate-400" />
                          Saved Wishlist ({wishlist.length})
                        </Link>

                        {isAdmin && (
                          <Link
                            to={PATHS.ADMIN.DASHBOARD}
                            onClick={() => setAccountDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors font-semibold"
                          >
                            <Shield size={15} />
                            Admin Portal
                          </Link>
                        )}

                        {isMerchant && (
                          <Link
                            to={PATHS.MERCHANT.DASHBOARD}
                            onClick={() => setAccountDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors font-semibold"
                          >
                            <Store size={15} />
                            Seller Console
                          </Link>
                        )}
                      </div>

                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => {
                            logout()
                            setAccountDropdownOpen(false)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <LogOut size={15} />
                          Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-2 space-y-1">
                      <Link
                        to={PATHS.LOGIN}
                        onClick={() => setAccountDropdownOpen(false)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#EF233C] text-white text-xs font-bold hover:bg-[#D90429] transition-colors"
                      >
                        <LogIn size={15} />
                        Sign In
                      </Link>
                      <Link
                        to={PATHS.REGISTER}
                        onClick={() => setAccountDropdownOpen(false)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist Heart Icon */}
            <Link
              to={PATHS.WISHLIST}
              className="p-1.5 rounded-full text-slate-700 dark:text-slate-200 hover:text-[#EF233C] transition-colors relative"
              title="Saved Wishlist"
            >
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF233C] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Shopping Cart Bag Icon */}
            <Link
              to={PATHS.CART}
              className="p-1.5 rounded-full text-slate-700 dark:text-slate-200 hover:text-[#EF233C] transition-colors relative"
              title="Shopping Cart"
            >
              <ShoppingBag size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF233C] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            </Link>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-700 dark:text-slate-200 hover:text-[#EF233C]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* 3. Secondary Category Navigation Bar */}
        <div className="hidden md:flex items-center gap-6 py-2 border-t border-slate-100 dark:border-slate-800">
          {/* Solid Red All Categories Button */}
          <div className="relative" ref={categoriesRef}>
            <button
              onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#EF233C] hover:bg-[#D90429] text-white text-xs font-bold tracking-wide transition-colors shadow-2xs"
            >
              <Menu size={15} />
              <span>All Categories</span>
            </button>

            {categoriesDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50">
                <div className="px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Shop Departments
                </div>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/shop?category=${cat.slug}`}
                      onClick={() => setCategoriesDropdownOpen(false)}
                      className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-[#EF233C] transition-colors"
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] text-slate-400">→</span>
                    </Link>
                  ))
                ) : (
                  categoryNavItems.map((item) => (
                    <Link
                      key={item.slug}
                      to={`/shop?category=${item.slug}`}
                      onClick={() => setCategoriesDropdownOpen(false)}
                      className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-[#EF233C] transition-colors"
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] text-slate-400">→</span>
                    </Link>
                  ))
                )}
                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                  <Link
                    to={PATHS.SHOP}
                    onClick={() => setCategoriesDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#EF233C] hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <Layers size={14} />
                    View All Catalog
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Category Navigation Links */}
          <nav className="flex items-center gap-6 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {categoryNavItems.map((item) => (
              <Link
                key={item.slug}
                to={`/shop?category=${item.slug}`}
                className="inline-flex items-center gap-1 hover:text-[#EF233C] transition-colors py-1 group"
              >
                <span>{item.label}</span>
                <ChevronDown size={12} className="text-slate-400 group-hover:text-[#EF233C] transition-colors" />
              </Link>
            ))}

            <Link
              to="/shop?deals=true"
              className="hover:text-[#EF233C] transition-colors py-1 font-bold text-slate-800 dark:text-slate-200"
            >
              Deals
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-4 animate-in slide-in-from-top duration-200">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 text-sm rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#EF233C] text-white flex items-center justify-center"
            >
              <Search size={14} />
            </button>
          </form>

          <div className="flex flex-col gap-2.5 text-sm font-semibold">
            <Link
              to={PATHS.SHOP}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-slate-800 dark:text-slate-200 hover:text-[#EF233C]"
            >
              All Categories & Products
            </Link>
            {categoryNavItems.map((item) => (
              <Link
                key={item.slug}
                to={`/shop?category=${item.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 pl-2 text-slate-600 dark:text-slate-400 hover:text-[#EF233C]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={PATHS.ORDERS}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-slate-800 dark:text-slate-200 hover:text-[#EF233C]"
            >
              Track Orders
            </Link>
            <Link
              to={PATHS.WISHLIST}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-slate-800 dark:text-slate-200 hover:text-[#EF233C]"
            >
              Saved Wishlist ({wishlist.length})
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LangSwitcher />
            </div>
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                className="text-xs font-bold text-red-600"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to={PATHS.LOGIN}
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-bold text-[#EF233C]"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default CustomerHeader
