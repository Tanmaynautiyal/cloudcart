import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'

interface BrandLogoProps {
  to?: string
  size?: 'sm' | 'md' | 'lg'
  badgeText?: string
  isLight?: boolean
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  to = '/',
  size = 'md',
  badgeText,
  isLight = false,
}) => {
  const iconBoxSize = size === 'sm' ? 'w-8 h-8 rounded-lg' : size === 'lg' ? 'w-11 h-11 rounded-2xl' : 'w-9 h-9 rounded-xl'
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 24 : 20
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'

  return (
    <Link to={to} className="inline-flex items-center gap-2.5 no-underline group select-none">
      <div className={`${iconBoxSize} bg-[#EF233C] flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0`}>
        <ShoppingBag size={iconSize} className="stroke-[2.2]" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`font-black tracking-tight ${textSize} ${isLight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
          Electro<span className="text-[#EF233C]">Mart</span>
        </span>
        {badgeText && (
          <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-[#EF233C] dark:bg-red-950/60 dark:text-red-400">
            {badgeText}
          </span>
        )}
      </div>
    </Link>
  )
}

export default BrandLogo
