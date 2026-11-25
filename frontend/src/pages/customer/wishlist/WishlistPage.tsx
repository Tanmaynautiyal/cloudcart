import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useStore } from '../../../hooks/useStore'
import { useCart } from '../../../hooks/useCart'
import { formatCurrency } from '../../../functionality/formatters'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { PATHS } from '../../../routes/routes'

export const WishlistPage: React.FC = () => {
  const { wishlist, toggleWishlist } = useStore()
  const { addToCart } = useCart()

  if (wishlist.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <Heart size={28} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          Your Wishlist is Empty
        </h2>
        <p className="text-xs text-slate-500">
          Save products you love so you can quickly find and purchase them later.
        </p>
        <div className="pt-2">
          <Link to={PATHS.SHOP}>
            <Button rightIcon={<ArrowRight size={16} />}>
              Explore Hardware Catalog
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Saved Wishlist ({wishlist.length})
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Your bookmarked acoustics, ultrabooks, and creator accessories.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.map((prod) => (
          <Card key={prod.id} hoverEffect className="flex flex-col justify-between">
            <div className="relative aspect-square overflow-hidden bg-slate-100">
              <Link to={`/product/${prod.slug}`}>
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </Link>
              <button
                onClick={() => toggleWishlist(prod)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 text-red-500 shadow-xs"
                title="Remove from wishlist"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {prod.brand || prod.category}
                </div>
                <Link
                  to={`/product/${prod.slug}`}
                  className="text-sm font-bold text-slate-900 dark:text-white hover:text-[#EF233C] line-clamp-2 mt-1"
                >
                  {prod.name}
                </Link>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {formatCurrency(prod.price)}
                </span>
                <Button
                  size="sm"
                  onClick={() => addToCart(prod, 1)}
                  leftIcon={<ShoppingBag size={14} />}
                >
                  Add
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default WishlistPage
