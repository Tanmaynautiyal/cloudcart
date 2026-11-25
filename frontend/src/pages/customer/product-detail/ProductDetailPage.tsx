import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Heart,
  Share2,
  Check,
  ShoppingBag,
  Zap,
  ArrowLeft,
  Store,
} from 'lucide-react'
import { useStore } from '../../../hooks/useStore'
import { useCart } from '../../../hooks/useCart'
import { useToast } from '../../../hooks/useToast'
import { formatCurrency } from '../../../functionality/formatters'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Card, CardContent } from '../../../components/ui/Card'
import { PATHS } from '../../../routes/routes'

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const { products, toggleWishlist, isWishlisted } = useStore()
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [quantity, setQuantity] = useState(1)
  const [copied, setCopied] = useState(false)

  const product = products.find((p) => p.slug === slug || String(p.id) === slug)

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          Product Not Found
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          The requested hardware product might have been moved or archived.
        </p>
        <Link to={PATHS.SHOP}>
          <Button leftIcon={<ArrowLeft size={16} />}>Back to Hardware Catalog</Button>
        </Link>
      </div>
    )
  }

  const isFavorite = isWishlisted(product.id)

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      showToast('Product URL copied to clipboard!', 'success')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleBuyNow = async () => {
    await addToCart(product, quantity)
    navigate(PATHS.CHECKOUT)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to={PATHS.HOME} className="hover:text-slate-900 dark:hover:text-white">Home</Link>
        <span>/</span>
        <Link to={PATHS.SHOP} className="hover:text-slate-900 dark:hover:text-white">Shop</Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white capitalize">{product.category}</span>
        <span>/</span>
        <span className="truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Product Media Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.badge && (
              <Badge variant="primary" className="absolute top-4 left-4 shadow-sm">
                {product.badge}
              </Badge>
            )}
          </div>
        </div>

        {/* Product Details & Actions */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#EF233C]">
                {product.brand || 'CloudCart Certified'}
              </span>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Star size={14} className="text-amber-400" fill="currentColor" />
                <span>{product.rating}</span>
                <span className="text-slate-400">({product.reviewsCount || 42} reviews)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <Store size={14} className="text-slate-400" />
              <span>Fulfilled by <strong>{product.storeName || 'Apex Tech Hub'}</strong></span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {formatCurrency(product.price)}
              </div>
              {product.originalPrice && (
                <div className="text-xs text-slate-400 line-through">
                  Original price: {formatCurrency(product.originalPrice)}
                </div>
              )}
            </div>

            <div>
              {product.stock > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                  <Check size={14} /> In Stock ({product.stock} units)
                </span>
              ) : (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                  Temporarily Sold Out
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {product.description}
          </p>

          {/* Quantity and Primary Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-bold text-slate-900 dark:text-white min-w-10 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  +
                </button>
              </div>

              <Button
                size="lg"
                className="flex-1"
                disabled={product.stock <= 0}
                onClick={() => addToCart(product, quantity)}
                leftIcon={<ShoppingBag size={18} />}
              >
                Add to Cart
              </Button>

              <Button
                size="lg"
                variant="secondary"
                disabled={product.stock <= 0}
                onClick={handleBuyNow}
                leftIcon={<Zap size={18} />}
              >
                Buy Now
              </Button>
            </div>

            {/* Secondary Action Toolbar: Wishlist & Share */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant={isFavorite ? 'primary' : 'outline'}
                onClick={() => toggleWishlist(product)}
                leftIcon={
                  <Heart
                    size={16}
                    fill={isFavorite ? 'currentColor' : 'none'}
                    color="currentColor"
                  />
                }
              >
                {isFavorite ? 'Saved in Wishlist' : 'Add to Wishlist'}
              </Button>

              <Button
                variant="outline"
                onClick={handleShare}
                leftIcon={copied ? <Check size={16} /> : <Share2 size={16} />}
              >
                {copied ? 'Link Copied!' : 'Share Product'}
              </Button>
            </div>
          </div>

          {/* Value Guarantees Box */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
              <Truck size={16} className="text-[#EF233C] shrink-0" />
              <span><strong>Free Express Shipping:</strong> Guaranteed delivery within 2-3 business days.</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
              <ShieldCheck size={16} className="text-[#EF233C] shrink-0" />
              <span><strong>Official Factory Warranty:</strong> 2-Year comprehensive hardware guarantee.</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
              <RotateCcw size={16} className="text-[#EF233C] shrink-0" />
              <span><strong>Hassle-Free Returns:</strong> 30-Day money-back guarantee with zero restocking fee.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage
