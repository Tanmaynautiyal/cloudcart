import React, { useState, useMemo } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  Check,
  Upload,
  Image as ImageIcon,
  Pause,
  Play,
  AlertTriangle,
  Sparkles,
  Tag,
  Boxes,
} from 'lucide-react'
import { useStore } from '../../../hooks/useStore'
import { useAuth } from '../../../hooks/useAuth'
import { formatCurrency } from '../../../functionality/formatters'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Product } from '../../../types'
import { productsApi } from '../../../api/baseApi'
import { useToast } from '../../../components/toaster/Toaster'

export const MerchantProductsPage: React.FC = () => {
  const { user } = useAuth()
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    toggleProductPause,
  } = useStore()
  const { showToast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [customImageUrl, setCustomImageUrl] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [brand, setBrand] = useState('')
  const [regularPrice, setRegularPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [stock, setStock] = useState('25')
  const [category, setCategory] = useState('mobiles')
  const [description, setDescription] = useState('')
  const [primaryImage, setPrimaryImage] = useState('/assets/exact/prod_iphone_full.png')
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)

  // Strict seller product filtering
  const merchantProducts = useMemo(() => {
    if (!user) return []
    return products.filter((p) => {
      // 1. Direct match on seller user id
      if (p.merchantId && String(p.merchantId) === String(user.id)) return true
      // 2. Direct match on storeName
      if (
        user.storeName &&
        p.storeName &&
        p.storeName.trim().toLowerCase() === user.storeName.trim().toLowerCase()
      )
        return true
      // 3. Demo seller fallback (seller@cloudcart.com -> Apex Tech Hub or merchantId 17)
      if (
        user.email === 'seller@cloudcart.com' &&
        (p.storeName === 'Apex Tech Hub' || String(p.merchantId) === '17')
      )
        return true
      return false
    })
  }, [products, user])

  const filteredProducts = useMemo(() => {
    return merchantProducts.filter((p) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      const matchesCat =
        selectedCategory === 'ALL' ||
        p.category.toLowerCase() === selectedCategory.toLowerCase()
      return matchesSearch && matchesCat
    })
  }, [merchantProducts, searchTerm, selectedCategory])

  const openAddModal = () => {
    setEditingProduct(null)
    setName('')
    setSku(`SKU-${Date.now().toString().slice(-6)}`)
    setBrand(user?.storeName || 'CloudCart')
    setRegularPrice('49999.00')
    setSalePrice('39999.00')
    setStock('25')
    setCategory(categories[0]?.slug || 'mobiles')
    setDescription('')
    setPrimaryImage('/assets/exact/prod_iphone_full.png')
    setGalleryImages(['/assets/exact/prod_iphone_full.png'])
    setIsActive(true)
    setCustomImageUrl('')
    setIsModalOpen(true)
  }

  const openEditModal = (p: Product) => {
    setEditingProduct(p)
    setName(p.name)
    setSku(p.slug || `SKU-${p.id}`)
    setBrand(p.brand || user?.storeName || 'CloudCart')
    setRegularPrice(
      p.originalPrice
        ? String(p.originalPrice)
        : String((p.price * 1.25).toFixed(2))
    )
    setSalePrice(String(p.price))
    setStock(String(p.stock))
    setCategory(p.category)
    setDescription(p.description || '')
    const mainImg = p.image || '/assets/exact/prod_iphone_full.png'
    setPrimaryImage(mainImg)
    setGalleryImages([mainImg])
    setIsActive(!p.isPaused)
    setCustomImageUrl('')
    setIsModalOpen(true)
  }

  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files)
    setIsUploading(true)
    try {
      const res = await productsApi.uploadMultipleProductImages(files)
      if (res.image_urls && res.image_urls.length > 0) {
        setGalleryImages((prev) => {
          const combined = [...prev, ...res.image_urls]
          return Array.from(new Set(combined))
        })
        if (!primaryImage || primaryImage.includes('exact/prod_')) {
          setPrimaryImage(res.image_urls[0])
        }
        showToast(`Uploaded ${res.image_urls.length} image(s) successfully!`, 'success')
      }
    } catch {
      showToast('Failed to upload image(s). Please try again.', 'error')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleAddImageUrl = () => {
    if (!customImageUrl.trim()) return
    const url = customImageUrl.trim()
    setGalleryImages((prev) => Array.from(new Set([...prev, url])))
    if (!primaryImage) setPrimaryImage(url)
    setCustomImageUrl('')
    showToast('Image URL added to gallery', 'info')
  }

  const handleRemoveImage = (imgUrl: string) => {
    setGalleryImages((prev) => {
      const updated = prev.filter((img) => img !== imgUrl)
      if (primaryImage === imgUrl && updated.length > 0) {
        setPrimaryImage(updated[0])
      }
      return updated
    })
  }

  const handleQuickAddStock = async (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta)
    await updateStock(product.id, newStock)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showToast('Product name is mandatory.', 'error')
      return
    }

    const parsedSalePrice = parseFloat(salePrice) || 0
    const parsedRegPrice = parseFloat(regularPrice) || parsedSalePrice * 1.25
    const parsedStock = parseInt(stock, 10) || 0

    if (parsedSalePrice <= 0) {
      showToast('Sale price must be greater than 0.', 'error')
      return
    }

    const mainImg = primaryImage || galleryImages[0] || '/assets/exact/prod_iphone_full.png'

    try {
      if (editingProduct) {
        await updateProduct({
          id: editingProduct.id,
          name: name.trim(),
          price: parsedSalePrice,
          originalPrice: parsedRegPrice,
          stock: parsedStock,
          category,
          brand: brand.trim() || user?.storeName || 'CloudCart',
          description: description.trim() || `${name.trim()} specifications and details.`,
          image: mainImg,
          isPaused: !isActive,
        })
      } else {
        await addProduct({
          name: name.trim(),
          price: parsedSalePrice,
          originalPrice: parsedRegPrice,
          stock: parsedStock,
          category,
          brand: brand.trim() || user?.storeName || 'CloudCart',
          description: description.trim() || `${name.trim()} specifications and details.`,
          image: mainImg,
          merchantId: user?.id,
          storeName: user?.storeName || 'Merchant Store',
          isPaused: !isActive,
        })
      }
      setIsModalOpen(false)
    } catch {
      // Error handled by store context toast
    }
  }

  // Calculate live discount percentage
  const regPriceNum = parseFloat(regularPrice) || 0
  const salePriceNum = parseFloat(salePrice) || 0
  const discountPercent =
    regPriceNum > salePriceNum && regPriceNum > 0
      ? Math.round(((regPriceNum - salePriceNum) / regPriceNum) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {user?.storeName ? `${user.storeName} — Store Catalog` : 'Store Catalog Management'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Personal merchant inventory, multi-image product listings, pricing, and stock controls.
          </p>
        </div>

        <Button
          onClick={openAddModal}
          className="bg-[#EF233C] hover:bg-[#D90429] text-white text-xs px-4 py-2 h-auto rounded-xl font-bold self-start sm:self-auto shadow-sm"
          leftIcon={<Plus size={15} />}
        >
          Add New Product
        </Button>
      </div>

      {/* Main Container Card */}
      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Card Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              Listed Products ({merchantProducts.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Active merchandise published on your public store front
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search products or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#EF233C] w-48 sm:w-60"
              />
            </div>
          </div>
        </div>

        {/* Empty State */}
        {merchantProducts.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-[#EF233C] flex items-center justify-center mx-auto">
              <Package size={32} />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Welcome to your Personal Seller Store!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You haven&apos;t listed any products yet. Add your first item with photos, pricing, category, and warehouse stock to start selling across ElectroMart.
              </p>
            </div>
            <Button
              onClick={openAddModal}
              className="bg-[#EF233C] hover:bg-[#D90429] text-white text-xs px-5 py-2.5 rounded-xl font-bold inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Add Your First Product
            </Button>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/40 uppercase text-[10px] font-bold text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-5">PRODUCT & SKU</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4">MRP / REGULAR</th>
                  <th className="py-3 px-4">SALE PRICE</th>
                  <th className="py-3 px-4">STOCK & REPLENISH</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((p) => {
                  const regularPriceValue = p.originalPrice || p.price * 1.25
                  const inStock = p.stock > 0

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* PRODUCT */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-11 h-11 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-100 dark:border-slate-800"
                          />
                          <div className="min-w-0 max-w-sm">
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              SKU: {p.slug.toUpperCase().slice(0, 20)}
                              {p.brand && ` • ${p.brand}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CATEGORY */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 capitalize font-medium">
                        {p.category}
                      </td>

                      {/* REGULAR PRICE */}
                      <td className="py-3.5 px-4 text-slate-400 line-through font-medium">
                        {formatCurrency(regularPriceValue)}
                      </td>

                      {/* SALE PRICE */}
                      <td className="py-3.5 px-4 font-black text-[#EF233C]">
                        {formatCurrency(p.price)}
                      </td>

                      {/* STOCK + QUICK REPLENISH */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black ${
                              p.stock <= 10
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {p.stock}
                          </span>
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQuickAddStock(p, 10)}
                              className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors"
                              title="Restock +10 units"
                            >
                              +10
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAddStock(p, 25)}
                              className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors"
                              title="Restock +25 units"
                            >
                              +25
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* STATUS TOGGLE */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => toggleProductPause(p.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                            p.isPaused
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 hover:bg-amber-100'
                              : inStock
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                          }`}
                          title={p.isPaused ? 'Click to activate' : 'Click to deactivate / pause'}
                        >
                          {p.isPaused ? (
                            <>
                              <Play size={11} /> Paused
                            </>
                          ) : (
                            <>
                              <Check size={11} /> Active
                            </>
                          )}
                        </button>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Catalog Product' : 'Add New Store Product'}
        subtitle="Manage product specifications, pricing, multiple images, and warehouse inventory."
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          {/* Product Name */}
          <div>
            <Label required>Product Name</Label>
            <Input
              type="text"
              required
              placeholder="e.g. iPhone 16 Pro, Studio Acoustic Monitors, M3 Max Laptop"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* SKU, Brand & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>Brand / Manufacturer</Label>
              <Input
                type="text"
                placeholder="e.g. Apple, Sony, Bose"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>

            <div>
              <Label>SKU / Model Number</Label>
              <Input
                type="text"
                placeholder="SKU-PROD123"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>

            <div>
              <Label required>Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#EF233C]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div>
              <Label required>Original MRP (₹)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={regularPrice}
                onChange={(e) => setRegularPrice(e.target.value)}
              />
            </div>

            <div>
              <Label required>Selling Price (₹)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
              />
              {discountPercent > 0 && (
                <div className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <Tag size={10} />
                  {discountPercent}% OFF Customer Discount
                </div>
              )}
            </div>

            <div>
              <Label required>Warehouse Stock</Label>
              <Input
                type="number"
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>

          {/* Multi-Image Gallery Management */}
          <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-extrabold text-slate-900 dark:text-white mb-0">
                  Product Image Gallery ({galleryImages.length})
                </Label>
                <p className="text-[11px] text-slate-400">
                  Upload multiple photos from your device or paste accessible image URLs.
                </p>
              </div>

              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EF233C] hover:bg-[#D90429] text-white rounded-lg text-xs font-bold transition-colors">
                <Upload size={13} />
                <span>{isUploading ? 'Uploading...' : 'Upload Photos'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleMultipleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick URL Input */}
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="Or paste an image URL (https://...)"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                className="text-xs h-8"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddImageUrl}
                className="text-xs h-8 whitespace-nowrap"
              >
                + Add URL
              </Button>
            </div>

            {/* Gallery Thumbnails */}
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 pt-2">
                {galleryImages.map((imgUrl, idx) => {
                  const isPrimary = primaryImage === imgUrl
                  return (
                    <div
                      key={idx}
                      className={`relative group rounded-lg overflow-hidden border-2 aspect-square bg-white dark:bg-slate-900 ${
                        isPrimary
                          ? 'border-[#EF233C] ring-2 ring-red-400/20'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Thumbnail ${idx}`}
                        className="w-full h-full object-cover"
                      />

                      {isPrimary && (
                        <div className="absolute top-1 left-1 bg-[#EF233C] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                          Primary
                        </div>
                      )}

                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(imgUrl)}
                            className="text-[9px] bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded shadow hover:bg-slate-100"
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(imgUrl)}
                          className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded shadow hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <Label>Product Specifications & Description</Label>
            <textarea
              rows={3}
              placeholder="Enter product description, technical specifications, and box contents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#EF233C]"
            />
          </div>

          {/* Active Status Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Storefront Availability
              </div>
              <div className="text-[11px] text-slate-400">
                {isActive
                  ? 'Product is active and visible to buyers on ElectroMart.'
                  : 'Product is paused / deactivated and hidden from storefront searches.'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-[#EF233C]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#EF233C] hover:bg-[#D90429] text-white font-bold"
            >
              {editingProduct ? 'Save Product Changes' : 'Publish Product to Store'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <Modal
          isOpen={Boolean(productToDelete)}
          onClose={() => setProductToDelete(null)}
          title="Delete Product"
          subtitle="Are you sure you want to permanently remove this product?"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
              <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-red-900 dark:text-red-200">
                <p className="font-bold mb-1">Confirm Product Deletion</p>
                <p>
                  Deleting <strong>{productToDelete.name}</strong> will remove it from your store catalog and from customer searches. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProductToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  await deleteProduct(productToDelete.id)
                  setProductToDelete(null)
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Delete Product
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default MerchantProductsPage
