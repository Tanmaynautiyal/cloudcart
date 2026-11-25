import React, { useState } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Pause,
  Play,
  Package,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  X,
  Star,
  Layers,
} from 'lucide-react'
import { useStore } from '../../../hooks/useStore'
import { formatCurrency } from '../../../functionality/formatters'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Product } from '../../../types'
import { productFormSchema, validateWithZod } from '../../../validations'
import { productsApi } from '../../../api/baseApi'
import { useToast } from '../../../components/toaster/Toaster'

export const AdminProductsPage: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductPause,
    updateStock,
    restockProduct,
  } = useStore()
  const { showToast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [stockFilter, setStockFilter] = useState<'ALL' | 'HEALTHY' | 'LOW' | 'OUT'>('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [price, setPrice] = useState('99.99')
  const [originalPrice, setOriginalPrice] = useState('')
  const [stock, setStock] = useState('50')
  const [category, setCategory] = useState('audio')
  const [brand, setBrand] = useState('')
  const [badge, setBadge] = useState('')
  const [description, setDescription] = useState('')
  const [primaryImage, setPrimaryImage] = useState('/assets/exact/prod_iphone_full.png')
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [manualImageUrl, setManualImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')

  // Inventory breakdown metrics
  const totalItems = products.length
  const healthyStock = products.filter((p) => (p.stock || 0) > 15).length
  const lowStock = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 15).length
  const outOfStock = products.filter((p) => (p.stock || 0) <= 0).length

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory
    const s = p.stock || 0
    const matchesStock =
      stockFilter === 'ALL' ||
      (stockFilter === 'HEALTHY' && s > 15) ||
      (stockFilter === 'LOW' && s > 0 && s <= 15) ||
      (stockFilter === 'OUT' && s <= 0)
    return matchesSearch && matchesCategory && matchesStock
  })

  const openAddModal = () => {
    setEditingProduct(null)
    setName('')
    setPrice('129.99')
    setOriginalPrice('169.99')
    setStock('40')
    setCategory(categories[0]?.slug || 'mobiles')
    setBrand('ElectroMart')
    setBadge('-20%')
    setDescription('')
    setPrimaryImage('/assets/exact/prod_iphone_full.png')
    setGalleryImages(['/assets/exact/prod_iphone_full.png'])
    setManualImageUrl('')
    setUploadMessage('')
    setIsModalOpen(true)
  }

  const openEditModal = (p: Product) => {
    setEditingProduct(p)
    setName(p.name)
    setPrice(String(p.price))
    setOriginalPrice(p.originalPrice ? String(p.originalPrice) : '')
    setStock(String(p.stock))
    setCategory(p.category)
    setBrand(p.brand || '')
    setBadge(p.badge || '')
    setDescription(p.description)
    setPrimaryImage(p.image || '')
    setGalleryImages(p.image ? [p.image] : [])
    setManualImageUrl('')
    setUploadMessage('')
    setIsModalOpen(true)
  }

  // Handle multiple product image upload
  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadMessage(`Uploading ${files.length} image(s)...`)

    try {
      const fileList = Array.from(files)
      const res = await productsApi.uploadMultipleProductImages(fileList)

      if (res.image_urls && res.image_urls.length > 0) {
        setGalleryImages((prev) => [...prev, ...res.image_urls])
        if (!primaryImage || primaryImage.startsWith('/assets/exact/prod_iphone')) {
          setPrimaryImage(res.image_urls[0])
        }
        setUploadMessage(`Successfully uploaded ${res.count} image(s)!`)
      }
    } catch (err: any) {
      setUploadMessage(err.response?.data?.detail || 'Failed to upload images.')
    } finally {
      setIsUploading(false)
    }
  }

  const addManualImage = () => {
    if (!manualImageUrl.trim()) return
    const url = manualImageUrl.trim()
    if (!galleryImages.includes(url)) {
      setGalleryImages((prev) => [...prev, url])
      if (!primaryImage) setPrimaryImage(url)
    }
    setManualImageUrl('')
  }

  const removeGalleryImage = (index: number) => {
    const target = galleryImages[index]
    const updated = galleryImages.filter((_, i) => i !== index)
    setGalleryImages(updated)
    if (primaryImage === target) {
      setPrimaryImage(updated[0] || '')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const chosenImage = primaryImage || galleryImages[0] || '/assets/exact/prod_iphone_full.png'

    const validation = validateWithZod(productFormSchema, {
      name,
      price,
      stock,
      category,
      description,
      image: chosenImage,
    })

    if (!validation.success) {
      showToast(validation.errorMessage, 'error')
      return
    }

    try {
      if (editingProduct) {
        await updateProduct({
          id: editingProduct.id,
          name,
          price: parseFloat(price) || 0,
          originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
          stock: parseInt(stock, 10) || 0,
          category,
          brand,
          badge,
          description: description.trim() || `${name} specifications and details.`,
          image: chosenImage,
        })
      } else {
        await addProduct({
          name,
          price: parseFloat(price) || 0,
          originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
          stock: parseInt(stock, 10) || 0,
          category,
          brand,
          badge,
          description: description.trim() || `${name} specifications and details.`,
          image: chosenImage,
          storeName: 'CloudCart Direct',
        })
      }
      setIsModalOpen(false)
    } catch {
      // StoreContext handles error toast notification
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Master Product Catalog & Inventory Governance
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Platform-wide product registry, multi-image gallery uploads, stock tracking, and pricing
          </p>
        </div>

        <Button
          onClick={openAddModal}
          className="bg-[#EF233C] hover:bg-[#D90429] text-white text-xs px-3.5 py-1.5 h-auto rounded-lg font-bold"
          leftIcon={<Plus size={14} />}
        >
          + Add Master Product
        </Button>
      </div>

      {/* Inventory Health Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          onClick={() => setStockFilter('ALL')}
          className={`p-4 border cursor-pointer transition-all ${
            stockFilter === 'ALL'
              ? 'border-[#EF233C] ring-1 ring-[#EF233C]'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Catalog SKUs
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
              <Package size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalItems}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Active master registry</div>
        </Card>

        <Card
          onClick={() => setStockFilter('HEALTHY')}
          className={`p-4 border cursor-pointer transition-all ${
            stockFilter === 'HEALTHY'
              ? 'border-emerald-500 ring-1 ring-emerald-500'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Healthy Stock (&gt;15)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {healthyStock}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-0.5">Optimal inventory</div>
        </Card>

        <Card
          onClick={() => setStockFilter('LOW')}
          className={`p-4 border cursor-pointer transition-all ${
            stockFilter === 'LOW'
              ? 'border-amber-500 ring-1 ring-amber-500'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Low Stock Alert (≤15)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {lowStock}
          </div>
          <div className="text-[11px] text-amber-600 font-bold mt-0.5">Restock recommended</div>
        </Card>

        <Card
          onClick={() => setStockFilter('OUT')}
          className={`p-4 border cursor-pointer transition-all ${
            stockFilter === 'OUT'
              ? 'border-red-500 ring-1 ring-red-500'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Out of Stock (0)
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-red-600 mt-2">
            {outOfStock}
          </div>
          <div className="text-[11px] text-red-600 font-bold mt-0.5">Requires immediate restock</div>
        </Card>
      </div>

      {/* Main Catalog Table Card */}
      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Catalog Items ({filteredProducts.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Available across all regional customer storefronts
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium capitalize"
            >
              <option value="ALL">All Departments</option>
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
                placeholder="Search name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#EF233C] w-56"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 uppercase text-[10px] font-bold text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-5">PRODUCT</th>
                <th className="py-3 px-4">DEPARTMENT</th>
                <th className="py-3 px-4">PRICE</th>
                <th className="py-3 px-4">STOCK LEVEL</th>
                <th className="py-3 px-4">QUICK RESTOCK</th>
                <th className="py-3 px-4">MERCHANT</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((p) => {
                const s = p.stock || 0
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-100 dark:border-slate-800"
                        />
                        <div className="min-w-0 max-w-xs">
                          <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            SKU: {p.slug.slice(0, 18)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400 capitalize">
                      {p.category}
                    </td>

                    <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                      {formatCurrency(p.price)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                          s <= 0
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/40'
                            : s <= 15
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                        }`}
                      >
                        {s} units
                      </span>
                    </td>

                    {/* Quick Restock in table */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStock(p.id, s + 10)}
                          className="text-[10px] h-6 px-1.5 border-slate-300 dark:border-slate-700"
                          title="Add 10 units"
                        >
                          +10
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStock(p.id, s + 25)}
                          className="text-[10px] h-6 px-1.5 border-emerald-500 text-emerald-600"
                          title="Add 25 units"
                        >
                          +25
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStock(p.id, s + 50)}
                          className="text-[10px] h-6 px-1.5 border-blue-500 text-blue-600"
                          title="Add 50 units"
                        >
                          +50
                        </Button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {p.storeName || 'CloudCart Direct'}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={p.isPaused ? 'warning' : 'success'}>
                        {p.isPaused ? 'Paused' : 'Active'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => toggleProductPause(p.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                          title={p.isPaused ? 'Activate SKU' : 'Pause SKU'}
                        >
                          {p.isPaused ? <Play size={13} /> : <Pause size={13} />}
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                          title="Edit Product"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setProductToDelete(p)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-200 transition-colors"
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
      </Card>

      {/* Product Add / Edit Modal with Multiple Image Upload */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit Master Product: ${editingProduct.name}` : 'Add New Master Product'}
        subtitle="Manage product specifications, pricing, inventory stock, and multiple product images."
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <Label required>Product Title</Label>
            <Input
              type="text"
              required
              placeholder="e.g. iPhone 16 Pro 256GB Titanium"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label required>Selling Price (₹)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <Label>Original Price (₹)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 99999"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
              />
            </div>
            <div>
              <Label required>Stock Units</Label>
              <Input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
            <div>
              <Label>Discount Badge</Label>
              <Input
                type="text"
                placeholder="e.g. -20%"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label required>Department</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#EF233C]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Brand / Manufacturer</Label>
              <Input
                type="text"
                placeholder="e.g. Apple, Sony, Samsung"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
          </div>

          {/* Multiple Product Images Section */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-900 dark:text-white font-bold">
                  Multiple Product Image Gallery
                </Label>
                <p className="text-[11px] text-slate-400">
                  Select and upload multiple product images. Click any image to make it the Primary Image.
                </p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EF233C] hover:bg-[#D90429] text-white font-bold text-xs shadow-xs">
                <Upload size={12} />
                {isUploading ? 'Uploading...' : 'Upload Images'}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleMultipleImageUpload}
                  disabled={isUploading}
                />
              </label>
            </div>

            {uploadMessage && (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {uploadMessage}
              </p>
            )}

            {/* Gallery Thumbnails */}
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2">
                {galleryImages.map((img, idx) => {
                  const isPrimary = primaryImage === img
                  return (
                    <div
                      key={idx}
                      onClick={() => setPrimaryImage(img)}
                      className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer aspect-square bg-white dark:bg-slate-800 flex items-center justify-center p-1 transition-all ${
                        isPrimary
                          ? 'border-[#EF233C] ring-2 ring-red-200 dark:ring-red-950'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <img src={img} alt={`Gallery ${idx}`} className="max-h-full max-w-full object-contain" />
                      {isPrimary && (
                        <div className="absolute top-1 left-1 bg-[#EF233C] text-white p-0.5 rounded text-[8px] font-bold flex items-center gap-0.5 shadow-xs">
                          <Star size={9} fill="white" /> Primary
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeGalleryImage(idx)
                        }}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Manual Image URL Adder */}
            <div className="flex items-center gap-2 pt-1">
              <Input
                type="text"
                placeholder="Or paste an image URL directly..."
                value={manualImageUrl}
                onChange={(e) => setManualImageUrl(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addManualImage}
                disabled={!manualImageUrl.trim()}
                className="shrink-0"
              >
                Add URL
              </Button>
            </div>
          </div>

          <div>
            <Label>Product Description</Label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed technical specifications, features, and warranty details..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#EF233C]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-[#EF233C] hover:bg-[#D90429] text-white font-bold">
              {editingProduct ? 'Save Changes' : 'Create Master Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <Modal
          isOpen={Boolean(productToDelete)}
          onClose={() => setProductToDelete(null)}
          title={`Delete Product: ${productToDelete.name}`}
          subtitle="Are you sure you want to permanently delete this product from the master catalog?"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
              <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold text-red-900 dark:text-red-200 mb-1">
                  Catalog Removal Warning
                </p>
                <p className="text-red-800 dark:text-red-300">
                  Deleting product <strong>{productToDelete.name}</strong> will remove it from all storefront categories, customer wishlists, and search results.
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
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Product Permanently
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AdminProductsPage
