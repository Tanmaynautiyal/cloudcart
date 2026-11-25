import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, SlidersHorizontal, ShoppingBag, Heart } from 'lucide-react'
import { useStore } from '../../../hooks/useStore'
import { useCart } from '../../../hooks/useCart'
import { formatCurrency } from '../../../functionality/formatters'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Badge } from '../../../components/ui/Badge'
import { Product } from '../../../types'

export const ShopPage: React.FC = () => {
  const { products, categories, toggleWishlist, isWishlisted } = useStore()
  const { addToCart } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentCategory = searchParams.get('category') || 'all'
  const currentSearch = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(currentSearch)
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured')
  const [inStockOnly, setInStockOnly] = useState(false)

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (currentCategory !== 'all' && p.category !== currentCategory) return false
        // Search filter
        if (currentSearch && !p.name.toLowerCase().includes(currentSearch.toLowerCase())) {
          return false
        }
        // In stock filter
        if (inStockOnly && p.stock <= 0) return false
        // Exclude paused
        if (p.isPaused) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price
        if (sortBy === 'price-desc') return b.price - a.price
        if (sortBy === 'rating') return b.rating - a.rating
        return 0
      })
  }, [products, currentCategory, currentSearch, inStockOnly, sortBy])

  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(searchParams)
    if (slug === 'all') {
      params.delete('category')
    } else {
      params.set('category', slug)
    }
    setSearchParams(params)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim())
    } else {
      params.delete('q')
    }
    setSearchParams(params)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            Hardware Catalog
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Showing {filteredProducts.length} verified products available for instant dispatch
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-64">
            <Input
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </form>

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#EF233C]"
          >
            <option value="featured">Featured First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => handleCategoryClick('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${
            currentCategory === 'all'
              ? 'bg-[#EF233C] text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          All Hardware ({products.length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.slug)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${
              currentCategory === cat.slug
                ? 'bg-[#EF233C] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">
            No products match your criteria.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Try clearing your search query or choosing a different category filter.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery('')
              setSearchParams({})
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => {
            const favorite = isWishlisted(prod.id)
            return (
              <Card key={prod.id} hoverEffect className="flex flex-col justify-between">
                <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <a href={`/product/${prod.slug}`}>
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </a>
                  {prod.badge && (
                    <Badge variant="primary" size="sm" className="absolute top-3 left-3">
                      {prod.badge}
                    </Badge>
                  )}
                  <button
                    onClick={() => toggleWishlist(prod)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs text-slate-700 dark:text-slate-200 hover:text-red-500 shadow-xs"
                    title={favorite ? 'Remove from wishlist' : 'Save to wishlist'}
                  >
                    <Heart
                      size={16}
                      fill={favorite ? '#EF233C' : 'none'}
                      color={favorite ? '#EF233C' : 'currentColor'}
                    />
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      {prod.brand || prod.category}
                    </div>
                    <a
                      href={`/product/${prod.slug}`}
                      className="text-sm font-bold text-slate-900 dark:text-white hover:text-[#EF233C] line-clamp-2 mt-1"
                    >
                      {prod.name}
                    </a>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-base font-black text-slate-900 dark:text-white">
                        {formatCurrency(prod.price)}
                      </div>
                      {prod.originalPrice && (
                        <div className="text-xs text-slate-400 line-through">
                          {formatCurrency(prod.originalPrice)}
                        </div>
                      )}
                    </div>

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
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ShopPage
