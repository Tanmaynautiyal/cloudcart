import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ShoppingCart,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useStore } from '../../../hooks/useStore'
import { useCart } from '../../../hooks/useCart'
import { formatCurrency } from '../../../functionality/formatters'
import { PATHS } from '../../../routes/routes'

export const HomePage: React.FC = () => {
  // 100% Database-Driven: Categories and Products fetched directly from backend APIs
  const { products, categories, toggleWishlist, isWishlisted, loading } = useStore()
  const { addToCart } = useCart()

  // Carousel Slide State for Hero Banner
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0)
  const [featuredPage, setFeaturedPage] = useState(0)

  // Filter and sort categories from the database API
  const priorityCategorySlugs = ['mobiles', 'laptops', 'headphones', 'earbuds', 'smartwatches', 'accessories']
  const departmentCategories = [...categories]
    .filter((c) => priorityCategorySlugs.includes(c.slug))
    .sort((a, b) => priorityCategorySlugs.indexOf(a.slug) - priorityCategorySlugs.indexOf(b.slug))

  // If specific priority slugs not found, use first 6 available from DB
  const displayCategories = departmentCategories.length >= 4 
    ? departmentCategories 
    : categories.slice(0, 6)

  // Filter and prioritize featured products from the database API
  const priorityProductSlugs = [
    'iphone-16-pro',
    'sony-wh-1000xm5-wireless-headphones',
    'macbook-air-m2',
    'samsung-galaxy-buds2-pro',
  ]
  const featuredList = [...products]
    .filter((p) => p.isFeatured || priorityProductSlugs.includes(p.slug))
    .sort((a, b) => {
      const aIdx = priorityProductSlugs.indexOf(a.slug)
      const bIdx = priorityProductSlugs.indexOf(b.slug)
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
      if (aIdx !== -1) return -1
      if (bIdx !== -1) return 1
      return 0
    })

  // Visible items per page
  const featuredSlice = featuredList.slice(featuredPage * 4, featuredPage * 4 + 4)

  // Promotional Hero Slides
  const heroSlides = [
    {
      badge: 'Next-Gen Technology',
      title1: 'Smart Tech.',
      title2: 'Better Life.',
      desc: 'Discover the latest electronics with unbeatable prices and top quality.',
    },
    {
      badge: 'Exclusive Flagships',
      title1: 'Ultra Speed.',
      title2: 'Pure Power.',
      desc: 'Experience Apple M-series silicon, titanium flagships, and spatial audio.',
    },
    {
      badge: 'Studio Acoustic Audio',
      title1: 'Pure Sound.',
      title2: 'Zero Noise.',
      desc: 'Industry-leading Active Noise Cancellation headphones and Hi-Res earbuds.',
    },
  ]

  const handleNextHero = () => {
    setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length)
  }

  const handlePrevHero = () => {
    setCurrentHeroSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
  }

  const handleNextFeatured = () => {
    if ((featuredPage + 1) * 4 < featuredList.length) {
      setFeaturedPage((prev) => prev + 1)
    } else {
      setFeaturedPage(0)
    }
  }

  const handlePrevFeatured = () => {
    if (featuredPage > 0) {
      setFeaturedPage((prev) => prev - 1)
    } else {
      setFeaturedPage(Math.max(0, Math.ceil(featuredList.length / 4) - 1))
    }
  }

  const activeHero = heroSlides[currentHeroSlide]

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#FAFAFA] dark:bg-slate-950">
      {/* Top Content Container */}
      <div className="space-y-10 sm:space-y-14">
        {/* ========================================================
            1. MODERN HERO BANNER WITH PROMOTIONAL OFFERS
        ======================================================== */}
        <section className="relative overflow-hidden bg-gradient-to-r from-[#07090E] via-[#140608] to-[#220408] text-white py-10 md:py-16 px-4 sm:px-6 lg:px-8 shadow-2xl">
          {/* Glowing Red Radial Background Lights */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#EF233C]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 right-10 -translate-y-1/2 w-[550px] h-[550px] bg-[#EF233C]/25 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center relative z-10">
            {/* Left Text Column */}
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
              {/* Next-Gen Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/70 border border-red-800/80 text-red-400 text-xs font-semibold shadow-inner">
                <Sparkles size={14} className="text-[#EF233C]" />
                <span>{activeHero.badge}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]">
                {activeHero.title1} <br />
                <span className="text-[#EF233C]">{activeHero.title2}</span>
              </h1>

              {/* Description Subtitle */}
              <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal">
                {activeHero.desc}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1">
                <Link
                  to={PATHS.SHOP}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#EF233C] hover:bg-[#D90429] text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-red-600/40 hover:scale-105 active:scale-95"
                >
                  <ShoppingCart size={17} />
                  <span>Shop Now →</span>
                </Link>
                <Link
                  to="/shop?deals=true"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                >
                  Explore Deals
                </Link>
              </div>
            </div>

            {/* Right Showcase Pedestal Column */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              <div className="relative w-full max-w-lg aspect-auto flex items-center justify-center">
                <img
                  src="/assets/exact/hero_devices.png"
                  alt="Next-Gen Technology Showcase"
                  className="w-full h-auto object-contain select-none pointer-events-none filter drop-shadow-[0_20px_40px_rgba(239,35,60,0.4)]"
                />
              </div>
            </div>
          </div>

          {/* Carousel Left and Right Navigation Buttons */}
          <button
            onClick={handlePrevHero}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/20 bg-black/40 text-white flex items-center justify-center hover:bg-[#EF233C] hover:border-[#EF233C] transition-all z-20 backdrop-blur-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNextHero}
            aria-label="Next slide"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/20 bg-black/40 text-white flex items-center justify-center hover:bg-[#EF233C] hover:border-[#EF233C] transition-all z-20 backdrop-blur-sm"
          >
            <ChevronRight size={20} />
          </button>

          {/* Carousel Bottom Pagination Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentHeroSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  currentHeroSlide === idx
                    ? 'w-7 h-2 bg-[#EF233C]'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </section>

        {/* ========================================================
            2. SHOP BY DEPARTMENT SECTION (FROM DB API)
        ======================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-1.5 text-2xl sm:text-3xl font-black tracking-tight">
                <span className="text-[#EF233C] font-mono">//</span>
                <span className="text-slate-900 dark:text-white">Shop by</span>
                <span className="text-[#EF233C]">Department</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Find exactly what you need from our top categories
              </p>
            </div>

            <Link
              to={PATHS.SHOP}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-1.5 rounded-full bg-red-50 dark:bg-red-950/40 text-[#EF233C] dark:text-red-400 border border-red-200 dark:border-red-900/60 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors shadow-2xs"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Loading Skeletons */}
          {loading && displayCategories.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 flex flex-col items-center animate-pulse">
                  <div className="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-xl mb-2" />
                  <div className="w-16 h-3 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
                  <div className="w-12 h-2.5 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : (
            /* 6 Category Cards Grid - Directly From PostgreSQL/SQLite DB */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {displayCategories.map((cat) => (
                <Link
                  key={cat.id || cat.slug}
                  to={`/shop?category=${cat.slug}`}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 flex flex-col items-center text-center shadow-2xs hover:shadow-lg hover:border-red-200 dark:hover:border-red-900/50 transition-all duration-300"
                >
                  {/* Image Preview Box */}
                  <div className="w-full aspect-[4/3] rounded-xl bg-[#F8F9FA] dark:bg-slate-800/60 p-2 mb-2 flex items-center justify-center overflow-hidden">
                    <img
                      src={cat.image || '/assets/exact/cat_mobiles.png'}
                      alt={cat.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Title from DB */}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#EF233C] transition-colors">
                    {cat.name}
                  </h3>

                  {/* Shop Now Link */}
                  <div className="text-xs font-semibold text-[#EF233C] inline-flex items-center gap-1 mt-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>Shop Now</span>
                    <span className="text-[11px]">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ========================================================
            3. FEATURED PRODUCTS SECTION (FROM DB API)
        ======================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-1.5 text-2xl sm:text-3xl font-black tracking-tight">
                <span className="text-[#EF233C] font-mono">//</span>
                <span className="text-slate-900 dark:text-white">Featured</span>
                <span className="text-[#EF233C]">Products</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Our most popular electronics, loved by customers
              </p>
            </div>

            {/* Carousel Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevFeatured}
                aria-label="Previous featured products"
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextFeatured}
                aria-label="Next featured products"
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Loading Skeletons */}
          {loading && featuredSlice.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col justify-between animate-pulse h-72">
                  <div className="w-12 h-4 bg-slate-200 dark:bg-slate-700 rounded-full mb-2" />
                  <div className="w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-xl my-2" />
                  <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                  <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
                  <div className="w-full h-9 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            /* 4 Featured Product Cards Grid - Directly From PostgreSQL/SQLite DB */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {featuredSlice.map((prod) => {
                const wishlisted = isWishlisted(prod.id)
                return (
                  <div
                    key={prod.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col justify-between shadow-2xs hover:shadow-xl hover:border-red-200 dark:hover:border-red-900/50 transition-all duration-300 group relative"
                  >
                    {/* Top Row: Discount Badge & Wishlist Heart */}
                    <div className="flex items-center justify-between w-full mb-1">
                      {prod.badge ? (
                        <span className="bg-[#EF233C] text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs">
                          {prod.badge}
                        </span>
                      ) : (
                        <span />
                      )}

                      <button
                        onClick={() => toggleWishlist(prod)}
                        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        className={`p-1.5 rounded-full transition-colors ${
                          wishlisted
                            ? 'text-[#EF233C] bg-red-50 dark:bg-red-950/40'
                            : 'text-slate-400 hover:text-[#EF233C] hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Heart
                          size={18}
                          className={wishlisted ? 'fill-[#EF233C]' : ''}
                        />
                      </button>
                    </div>

                    {/* Product Image from DB */}
                    <Link
                      to={`/product/${prod.slug}`}
                      className="w-full h-36 flex items-center justify-center p-2 my-2 overflow-hidden"
                    >
                      <img
                        src={prod.image || '/assets/exact/prod_iphone_full.png'}
                        alt={prod.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Product Details from DB */}
                    <div className="space-y-2 mt-auto">
                      <Link
                        to={`/product/${prod.slug}`}
                        className="block text-sm font-bold text-slate-900 dark:text-white hover:text-[#EF233C] line-clamp-2 h-10 transition-colors"
                      >
                        {prod.name}
                      </Link>

                      {/* Price Row: Formatted INR */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                          {formatCurrency(prod.price)}
                        </span>
                        {prod.originalPrice && (
                          <span className="text-xs text-slate-400 line-through font-normal">
                            {formatCurrency(prod.originalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Full-Width Red Add to Cart Button */}
                      <button
                        onClick={() => addToCart(prod, 1)}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#EF233C] hover:bg-[#D90429] text-white font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.98]"
                      >
                        <ShoppingCart size={15} />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* ========================================================
          4. TRENDING ELECTRONICS FULL-WIDTH BANNER (TOUCHING FOOTER WITH ZERO GAP)
      ======================================================== */}
      <section className="w-full bg-[#0B0D13] text-white pt-8 pb-8 px-4 sm:px-6 lg:px-8 border-t border-red-950/60 relative overflow-hidden mt-12 sm:mt-16">
        {/* Angled Glowing Red Edges */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#EF233C]/20 to-transparent pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center relative z-10">
          {/* Left Content */}
          <div className="lg:col-span-5 space-y-3.5 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Trending <span className="text-[#EF233C]">Electronics</span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm font-normal">
              Stay ahead with the latest trends in tech!
            </p>
            <div className="pt-1">
              <Link
                to={PATHS.SHOP}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/60 bg-white/5 hover:bg-white hover:text-black text-white font-bold text-xs tracking-wide transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <span>Shop Trending</span>
                <span className="text-sm">→</span>
              </Link>
            </div>
          </div>

          {/* Right Tech Showcase Visual */}
          <div className="lg:col-span-7 flex items-center justify-center lg:justify-end">
            <img
              src="/assets/exact/trending_devices.png"
              alt="Trending Electronics"
              className="w-full max-w-md h-auto object-contain select-none filter drop-shadow-[0_15px_30px_rgba(239,35,60,0.3)]"
            />
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
