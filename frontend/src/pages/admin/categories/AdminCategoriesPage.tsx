import React, { useState } from 'react'
import { Layers, Plus, Edit2, Trash2, Image as ImageIcon, Upload, Check, AlertTriangle } from 'lucide-react'
import { useStore } from '../../../hooks/useStore'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Category } from '../../../types'
import { categoryFormSchema, validateWithZod } from '../../../validations'
import { categoriesApi } from '../../../api/baseApi'
import { useToast } from '../../../components/toaster/Toaster'

const PRESET_DEPARTMENT_IMAGES = [
  { name: 'Mobiles', url: '/assets/exact/cat_mobiles.png' },
  { name: 'Laptops', url: '/assets/exact/cat_laptops.png' },
  { name: 'Headphones', url: '/assets/exact/cat_headphones.png' },
  { name: 'Earbuds', url: '/assets/exact/cat_earbuds.png' },
  { name: 'Smart Watches', url: '/assets/exact/cat_smartwatches.png' },
  { name: 'Accessories', url: '/assets/exact/cat_accessories.png' },
]

export const AdminCategoriesPage: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useStore()
  const { showToast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const openAddModal = () => {
    setEditingCategory(null)
    setName('')
    setSlug('')
    setDescription('')
    setImageUrl('/assets/exact/cat_mobiles.png')
    setIsModalOpen(true)
  }

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat)
    setName(cat.name)
    setSlug(cat.slug)
    setDescription(cat.description || '')
    setImageUrl(cat.image || cat.image_url || '')
    setIsModalOpen(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const res = await categoriesApi.uploadCategoryImage(file)
      setImageUrl(res.image_url)
      showToast('Category cover image uploaded successfully!', 'success')
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to upload category image.', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formattedSlug = slug.toLowerCase().trim() || name.toLowerCase().trim().replace(/\s+/g, '-')
    const validation = validateWithZod(categoryFormSchema, {
      name,
      slug: formattedSlug,
      description,
      image: imageUrl,
      icon: imageUrl || 'Layers',
    })

    if (!validation.success) {
      showToast(validation.errorMessage, 'error')
      return
    }

    try {
      if (editingCategory) {
        await updateCategory({
          id: editingCategory.id,
          name,
          slug: formattedSlug,
          description,
          image: imageUrl,
          image_url: imageUrl,
          icon: imageUrl,
        })
      } else {
        await addCategory({
          name,
          slug: formattedSlug,
          description,
          image: imageUrl,
          image_url: imageUrl,
          icon: imageUrl,
        })
      }
      setIsModalOpen(false)
    } catch {
      // StoreContext handles errors
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Storefront Departments & Taxonomies
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize customer navigation, department categories, cover images, and catalog taxonomy
          </p>
        </div>

        <Button
          onClick={openAddModal}
          className="bg-[#EF233C] hover:bg-[#D90429] text-white text-xs px-3.5 py-1.5 h-auto rounded-lg font-bold"
          leftIcon={<Plus size={14} />}
        >
          + Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const productCount = products.filter((p) => p.category === cat.slug).length
          const coverImg = cat.image || cat.image_url

          return (
            <Card
              key={cat.id}
              className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow group"
            >
              <div className="h-32 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center p-3 border-b border-slate-100 dark:border-slate-800">
                {coverImg ? (
                  <img
                    src={coverImg}
                    alt={cat.name}
                    className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-[#EF233C] flex items-center justify-center font-bold">
                    <Layers size={24} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 rounded-md p-1 shadow-xs">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    title="Edit Department"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => setCategoryToDelete(cat)}
                    className="p-1 text-slate-500 hover:text-red-600"
                    title="Delete Department"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                    /{cat.slug}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                  {cat.description || 'Department catalog and storefront taxonomy.'}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Assigned Products</span>
                  <span className="font-bold text-[#EF233C]">
                    {productCount} items
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? `Edit Department: ${editingCategory.name}` : 'Create New Department'}
        subtitle="Manage department name, URL slug, description, and cover image."
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <Label required>Department Name</Label>
            <Input
              type="text"
              required
              placeholder="e.g. Smart Wearables"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!editingCategory) {
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                }
              }}
            />
          </div>

          <div>
            <Label required>Slug URL</Label>
            <Input
              type="text"
              required
              placeholder="e.g. smart-wearables"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              rows={2}
              placeholder="Brief department overview for customers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#EF233C]"
            />
          </div>

          {/* Department Cover Image */}
          <div>
            <Label>Department Cover Image</Label>
            <div className="flex items-center gap-3 mt-1">
              {imageUrl ? (
                <div className="w-16 h-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-1 shrink-0">
                  <img src={imageUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                  <ImageIcon size={20} />
                </div>
              )}

              <div className="flex-1 space-y-2">
                <Input
                  type="text"
                  placeholder="Cover image URL (e.g. /assets/exact/cat_mobiles.png)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px]">
                    <Upload size={12} />
                    {isUploading ? 'Uploading...' : 'Upload Image File'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                  <span className="text-[10px] text-slate-400">JPG, PNG, WebP or SVG</span>
                </div>
              </div>
            </div>

            {/* Quick preset selector */}
            <div className="mt-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Or select ElectroMart preset icon:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_DEPARTMENT_IMAGES.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setImageUrl(p.url)}
                    className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                      imageUrl === p.url
                        ? 'border-[#EF233C] bg-red-50 text-[#EF233C] dark:bg-red-950/40'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-[#EF233C] hover:bg-[#D90429] text-white">
              {editingCategory ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Category Confirmation Modal */}
      {categoryToDelete && (
        <Modal
          isOpen={Boolean(categoryToDelete)}
          onClose={() => setCategoryToDelete(null)}
          title={`Delete Department: ${categoryToDelete.name}`}
          subtitle="Are you sure you want to delete this product department?"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-200 mb-1">
                  Taxonomy Deletion Notice
                </p>
                <p className="text-amber-800 dark:text-amber-300">
                  Deleting department <strong>{categoryToDelete.name}</strong> will remove it from customer navigation. Departments with active products cannot be deleted until products are reassigned.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoryToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  await deleteCategory(categoryToDelete.id)
                  setCategoryToDelete(null)
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Department
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AdminCategoriesPage
