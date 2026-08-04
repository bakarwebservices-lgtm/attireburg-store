'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import { getSession } from '@/lib/session'
import DashboardLayout from '@/components/DashboardLayout'
import ImageUpload from '@/components/admin/ImageUpload'
import RichTextarea from '@/components/admin/RichTextarea'
import { computeCanonicalKey } from '@/lib/poolUtils'

interface ColorVariant {
  id: string
  color: string
  images: string[]
}

interface ProductFormData {
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  price: number
  salePrice?: number
  sku: string
  stock: number // default stock per variant
  stickerStock: number // physical print stickers for this design
  category: string
  tags: string[]
  images: string[] // fallback/main images
  fits: string[]
  sizes: string[]
  colors: ColorVariant[]
  featured: boolean
  weight?: number
  metaTitle: string
  metaDescription: string
  isActive: boolean
}

const DEFAULT_FITS = ['Slim Fit', 'Loose Fit']
const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', '2XL']

export default function NewProduct() {
  const { lang } = useLanguage()
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const t = translations[lang]

  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [newFit, setNewFit] = useState('')
  const [newSize, setNewSize] = useState('')
  const [newColorName, setNewColorName] = useState('')

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    price: 0,
    sku: `ATB-${Date.now()}`,
    stock: 10,
    stickerStock: 0,
    category: '',
    tags: [],
    images: [],
    fits: [...DEFAULT_FITS],
    sizes: [...DEFAULT_SIZES],
    colors: [],
    featured: false,
    metaTitle: '',
    metaDescription: '',
    isActive: false,
  })

  // Garment Pools State
  const [pools, setPools] = useState<any[]>([])
  const [variantPoolOverrides, setVariantPoolOverrides] = useState<Record<string, string | null>>({})
  const [showPoolModal, setShowPoolModal] = useState(false)
  const [targetComboKey, setTargetComboKey] = useState<string | null>(null)
  const [poolSearch, setPoolSearch] = useState('')

  useEffect(() => {
    if (isLoading) return
    if (!user || !user.isAdmin) {
      router.push('/admin')
      return
    }
    const session = getSession()
    fetch('/api/admin/pools', {
      headers: { 'Authorization': `Bearer ${session?.token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.pools) setPools(data.pools)
      })
      .catch(console.error)
  }, [user, isLoading, router])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Fits management
  const addFit = () => {
    const fit = newFit.trim()
    if (fit && !formData.fits.includes(fit)) {
      setFormData(prev => ({ ...prev, fits: [...prev.fits, fit] }))
      setNewFit('')
    }
  }

  const removeFit = (fit: string) => {
    setFormData(prev => ({ ...prev, fits: prev.fits.filter(f => f !== fit) }))
  }

  // Sizes management
  const addSize = () => {
    const size = newSize.trim()
    if (size && !formData.sizes.includes(size)) {
      setFormData(prev => ({ ...prev, sizes: [...prev.sizes, size] }))
      setNewSize('')
    }
  }

  const removeSize = (size: string) => {
    setFormData(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== size) }))
  }

  // Colors management
  const addColor = () => {
    const color = newColorName.trim()
    if (!color) return
    if (formData.colors.find(c => c.color.toLowerCase() === color.toLowerCase())) {
      alert('Diese Farbe existiert bereits.')
      return
    }
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, { id: `color-${Date.now()}`, color, images: [] }]
    }))
    setNewColorName('')
  }

  const removeColor = (id: string) => {
    setFormData(prev => ({ ...prev, colors: prev.colors.filter(c => c.id !== id) }))
  }

  const updateColorImages = (id: string, images: string[]) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map(c => c.id === id ? { ...c, images } : c)
    }))
  }

  // Preview of how many variants will be generated
  const variantCount = formData.fits.length * formData.sizes.length * formData.colors.length

  const handleSave = async (isActive: boolean) => {
    setLoading(true)
    try {
      if (!formData.name.trim()) { alert('Produktname ist erforderlich'); return }
      if (!formData.sku.trim()) { alert('SKU ist erforderlich'); return }
      if (formData.price <= 0) { alert('Preis muss größer als 0 sein'); return }
      if (formData.fits.length === 0) { alert('Mindestens eine Passform ist erforderlich'); return }
      if (formData.sizes.length === 0) { alert('Mindestens eine Größe ist erforderlich'); return }
      if (formData.colors.length === 0) { alert('Mindestens eine Farbe ist erforderlich'); return }

      // Auto-generate all variants: fit × size × color with pool auto-matching
      const variants: any[] = []
      for (const fit of formData.fits) {
        for (const size of formData.sizes) {
          for (const colorEntry of formData.colors) {
            const comboKey = `${fit}-${size}-${colorEntry.color}`

            let blankGarmentId: string | null = null
            if (variantPoolOverrides[comboKey] !== undefined) {
              blankGarmentId = variantPoolOverrides[comboKey]
            } else {
              const canonicalKey = computeCanonicalKey('tshirt', { fit, size, color: colorEntry.color })
              const match = pools.find(p => p.canonicalKey === canonicalKey)
              if (match) blankGarmentId = match.id
            }

            const matchedPool = pools.find(p => p.id === blankGarmentId)

            variants.push({
              sku: `${formData.sku}-${fit.replace(/\s+/g, '')}-${size}-${colorEntry.color.replace(/\s+/g, '')}`,
              price: formData.price,
              salePrice: formData.salePrice,
              stock: matchedPool ? matchedPool.stock : formData.stock,
              images: colorEntry.images,
              attributes: { fit, size, color: colorEntry.color },
              blankGarmentId,
              isActive: true,
            })
          }
        }
      }

      const productData = {
        name: formData.name,
        nameEn: formData.nameEn || formData.name,
        description: formData.description,
        descriptionEn: formData.descriptionEn || formData.description,
        price: formData.price,
        salePrice: formData.salePrice,
        sku: formData.sku,
        stock: formData.stock * variants.length,
        stickerStock: formData.stickerStock,
        category: formData.category || 'Uncategorized',
        sizes: formData.sizes,
        colors: formData.colors.map(c => c.color),
        tags: formData.tags,
        images: formData.images.length > 0 ? formData.images : formData.colors[0]?.images || [],
        featured: formData.featured,
        onSale: !!formData.salePrice,
        weight: formData.weight,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        isActive,
        hasVariants: true,
        attributes: [
          { name: 'Passform', values: formData.fits, variation: true, visible: true },
          { name: 'Größe', values: formData.sizes, variation: true, visible: true },
          { name: 'Farbe', values: formData.colors.map(c => c.color), variation: true, visible: true },
        ],
        variants,
      }

      const session = getSession()
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        let errorMessage = 'Fehler beim Speichern'
        try {
          const error = await response.json()
          errorMessage = error.message || error.error || errorMessage
        } catch (jsonError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      alert(`Produkt erfolgreich ${isActive ? 'veröffentlicht' : 'als Entwurf gespeichert'}! ${variants.length} Varianten erstellt.`)
      router.push('/admin/products')
    } catch (error) {
      alert(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'Allgemein', icon: '📝' },
    { id: 'variants', label: 'Varianten', icon: '🎨' },
    { id: 'images', label: 'Hauptbilder', icon: '🖼️' },
    { id: 'seo', label: 'SEO', icon: '🔍' },
  ]

  if (!user || !user.isAdmin) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Neues Produkt hinzufügen</h1>
            <p className="text-gray-600 mt-1 text-sm">Erstellen Sie ein neues Produkt für Ihren Shop</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => router.push('/admin/products')} className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
              Abbrechen
            </button>
            <button onClick={() => handleSave(false)} disabled={loading} className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm">
              Entwurf
            </button>
            <button onClick={() => handleSave(true)} disabled={loading} className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm">
              {loading ? 'Speichern...' : 'Veröffentlichen'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - horizontal tabs on mobile */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap lg:w-full ${
                      activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Variant summary */}
              <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">Varianten-Vorschau</p>
                <p className="text-xs text-gray-600">{formData.fits.length} Passformen × {formData.sizes.length} Größen × {formData.colors.length} Farben</p>
                <p className="text-lg font-bold text-primary-600 mt-1">{variantCount} Varianten</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm">

              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Allgemeine Informationen</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Produktname (Deutsch) *</label>
                      <input type="text" value={formData.name} onChange={e => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                        placeholder="z.B. Premium Wollpullover" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Produktname (Englisch)</label>
                      <input type="text" value={formData.nameEn} onChange={e => handleInputChange('nameEn', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                        placeholder="e.g. Premium Wool Sweater" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung (Deutsch)</label>
                      <RichTextarea
                        value={formData.description}
                        onChange={v => handleInputChange('description', v)}
                        rows={5}
                        placeholder="Detaillierte Produktbeschreibung..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung (Englisch)</label>
                      <RichTextarea
                        value={formData.descriptionEn}
                        onChange={v => handleInputChange('descriptionEn', v)}
                        rows={5}
                        placeholder="Detailed product description..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preis (€) *</label>
                      <input type="number" step="0.01" min="0"
                        value={formData.price || ''}
                        onChange={e => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="99.99" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Angebotspreis (€)</label>
                      <input type="number" step="0.01" min="0" value={formData.salePrice || ''} onChange={e => handleInputChange('salePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="79.99" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lagerbestand pro Variante</label>
                      <input type="number" min="0"
                        value={formData.stock || ''}
                        onChange={e => handleInputChange('stock', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="10" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stickers / Aufkleber 🏷️</label>
                      <input type="number" min="0"
                        value={formData.stickerStock || 0}
                        onChange={e => handleInputChange('stickerStock', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-primary-300 bg-primary-50/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="50" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                      <input type="text" value={formData.sku} onChange={e => handleInputChange('sku', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="ATB-PULL-001" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie</label>
                      <select value={formData.category} onChange={e => handleInputChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600">
                        <option value="">Kategorie wählen</option>
                        <option value="hoodies">Hoodies</option>
                        <option value="shirts">Shirts</option>
                        <option value="printed-tees">Printed Tees</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tags (kommagetrennt)</label>
                      <input type="text" value={formData.tags.join(', ')} onChange={e => handleInputChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="winter, warm, premium" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input type="checkbox" checked={formData.featured} onChange={e => handleInputChange('featured', e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">Ausgewähltes Produkt</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Variants Tab */}
              {activeTab === 'variants' && (
                <div className="p-6 space-y-8">
                  <h2 className="text-lg font-semibold text-gray-900">Varianten konfigurieren</h2>
                  <p className="text-sm text-gray-600">
                    Definieren Sie Passformen, Größen und Farben. Das System generiert automatisch alle Kombinationen beim Speichern.
                  </p>

                  {/* Fits */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Passformen</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.fits.map(fit => (
                        <span key={fit} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                          {fit}
                          <button onClick={() => removeFit(fit)} className="text-primary-600 hover:text-red-600 ml-1">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newFit} onChange={e => setNewFit(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addFit()}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                        placeholder="z.B. Regular Fit" />
                      <button onClick={addFit} className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
                        + Hinzufügen
                      </button>
                    </div>
                  </div>

                  {/* Sizes */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Größen</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.sizes.map(size => (
                        <span key={size} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                          {size}
                          <button onClick={() => removeSize(size)} className="text-gray-500 hover:text-red-600 ml-1">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newSize} onChange={e => setNewSize(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSize()}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                        placeholder="z.B. XXL" />
                      <button onClick={addSize} className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
                        + Hinzufügen
                      </button>
                    </div>
                  </div>

                  {/* Colors */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Farben & Bilder</h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Jede Farbe hat eigene Bilder, die angezeigt werden wenn ein Kunde diese Farbe auswählt.
                    </p>

                    {/* Add color */}
                    <div className="flex gap-2 mb-6">
                      <input type="text" value={newColorName} onChange={e => setNewColorName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addColor()}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                        placeholder="z.B. Schwarz, Weiß, Navy" />
                      <button onClick={addColor} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
                        + Farbe hinzufügen
                      </button>
                    </div>

                    {formData.colors.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500 text-sm">Noch keine Farben hinzugefügt</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {formData.colors.map(colorEntry => (
                          <div key={colorEntry.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium text-gray-900">{colorEntry.color}</h4>
                              <button onClick={() => removeColor(colorEntry.id)} className="text-red-500 hover:text-red-700 text-sm">
                                Entfernen
                              </button>
                            </div>
                            <ImageUpload
                              images={colorEntry.images}
                              onImagesChange={images => updateColorImages(colorEntry.id, images)}
                              maxImages={8}
                              title={`Bilder für ${colorEntry.color}`}
                              description="Diese Bilder werden angezeigt wenn ein Kunde diese Farbe auswählt."
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Summary & Garment Pool Assignment Preview */}
                  {variantCount > 0 && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-green-800">
                          ✓ {variantCount} Varianten werden automatisch generiert
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          {formData.fits.join(', ')} × {formData.sizes.join(', ')} × {formData.colors.map(c => c.color).join(', ')}
                        </p>
                      </div>

                      {/* Garment Pool Assignment Preview */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900">🔗 Garment Pool Zuordnungs-Vorschau ({variantCount} Varianten)</h3>
                          <span className="text-xs text-gray-500">Gleicht Varianten automatisch mit Garment Pools ab.</span>
                        </div>

                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200 bg-white">
                          {formData.fits.flatMap(fit =>
                            formData.sizes.flatMap(size =>
                              formData.colors.map(colorEntry => {
                                const comboKey = `${fit}-${size}-${colorEntry.color}`
                                let poolId = variantPoolOverrides[comboKey]
                                if (poolId === undefined) {
                                  const canonicalKey = computeCanonicalKey('tshirt', { fit, size, color: colorEntry.color })
                                  const match = pools.find(p => p.canonicalKey === canonicalKey)
                                  poolId = match ? match.id : null
                                }
                                const matchedPool = pools.find(p => p.id === poolId)

                                return (
                                  <div key={comboKey} className="p-3 flex items-center justify-between text-xs hover:bg-gray-50">
                                    <div>
                                      <span className="font-semibold text-gray-900">{fit}</span> • <span className="font-medium text-gray-800">{size}</span> • <span className="text-gray-700">{colorEntry.color}</span>
                                    </div>
                                    <div>
                                      {matchedPool ? (
                                        <div className="flex items-center gap-2">
                                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                                            🔗 {matchedPool.name} ({matchedPool.stock} Stk)
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTargetComboKey(comboKey)
                                              setShowPoolModal(true)
                                            }}
                                            className="text-blue-600 hover:underline font-bold"
                                          >
                                            Ändern
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <span className="text-gray-400">Kein Pool (Separater Bestand)</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTargetComboKey(comboKey)
                                              setShowPoolModal(true)
                                            }}
                                            className="px-2 py-1 bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-800 rounded font-medium"
                                          >
                                            🔗 Pool wählen
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Main Images Tab */}
              {activeTab === 'images' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Hauptbilder</h2>
                  <p className="text-sm text-gray-600">
                    Optionale Hauptbilder für das Produkt. Wenn leer, werden die Bilder der ersten Farbe verwendet.
                  </p>
                  <ImageUpload
                    images={formData.images}
                    onImagesChange={images => handleInputChange('images', images)}
                    maxImages={20}
                    title="Produktbilder"
                    description="Allgemeine Produktbilder (z.B. Lifestyle-Fotos, Details)"
                  />
                </div>
              )}

              {/* SEO Tab */}
              {activeTab === 'seo' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">SEO-Einstellungen</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meta-Titel</label>
                    <input type="text" value={formData.metaTitle} onChange={e => handleInputChange('metaTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      placeholder="Premium Wollpullover - Attireburg" maxLength={60} />
                    <p className="text-xs text-gray-500 mt-1">{formData.metaTitle.length}/60 Zeichen</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meta-Beschreibung</label>
                    <textarea value={formData.metaDescription} onChange={e => handleInputChange('metaDescription', e.target.value)}
                      rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      placeholder="Entdecken Sie unseren Premium Wollpullover..." maxLength={160} />
                    <p className="text-xs text-gray-500 mt-1">{formData.metaDescription.length}/160 Zeichen</p>
                  </div>
                  {/* Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Google-Vorschau</h3>
                    <div className="bg-white rounded border p-3">
                      <div className="text-blue-600 text-base">{formData.metaTitle || formData.name || 'Produkttitel'}</div>
                      <div className="text-green-700 text-xs">attireburg.de/products/...</div>
                      <div className="text-gray-600 text-sm mt-1">{formData.metaDescription || 'Produktbeschreibung...'}</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Pool Selection Modal */}
      {showPoolModal && targetComboKey && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Garment Pool Auswählen</h3>
                <p className="text-xs text-gray-500 font-medium">Kombination: {targetComboKey}</p>
              </div>
              <button onClick={() => setShowPoolModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <input
              type="text"
              placeholder="Pool suchen (z. B. T-Shirt Schwarz S)..."
              value={poolSearch}
              onChange={e => setPoolSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />

            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
              <div
                onClick={() => {
                  setVariantPoolOverrides(prev => ({ ...prev, [targetComboKey]: null }))
                  setShowPoolModal(false)
                }}
                className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between text-sm"
              >
                <span className="font-semibold text-gray-700">❌ Kein Pool (Eigener Bestand)</span>
                <span className="text-xs text-gray-500">Separater Bestand</span>
              </div>

              {pools
                .filter(p =>
                  p.name.toLowerCase().includes(poolSearch.toLowerCase()) ||
                  p.garmentType.toLowerCase().includes(poolSearch.toLowerCase()) ||
                  Object.values(p.attributes || {}).some(val => String(val).toLowerCase().includes(poolSearch.toLowerCase()))
                )
                .map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setVariantPoolOverrides(prev => ({ ...prev, [targetComboKey]: p.id }))
                      setShowPoolModal(false)
                    }}
                    className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">
                        {Object.entries(p.attributes || {}).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-bold text-xs">
                      {p.stock} Stk
                    </span>
                  </div>
                ))
              }
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPoolModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
