'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import DashboardLayout from '@/components/DashboardLayout'
import ImageUpload from '@/components/admin/ImageUpload'

interface ProductVariation {
  id: string
  attributes: { [key: string]: string } // e.g., { size: 'M', color: 'Blue' }
  sku: string
  price: number
  salePrice?: number
  stock: number
  images?: string[] // Variant-specific images
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
}

interface ProductAttribute {
  name: string
  values: string[]
  variation: boolean // Used for variations
  visible: boolean // Visible on product page
}

interface SEOData {
  metaTitle: string
  metaDescription: string
  focusKeyword: string
  slug: string
}

interface ProductFormData {
  // Basic Information
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  shortDescription: string
  shortDescriptionEn: string
  
  // Pricing
  price: number
  salePrice?: number
  costPrice?: number // For profit calculations
  
  // Inventory
  sku: string
  manageStock: boolean
  stock: number
  lowStockThreshold: number
  backordersAllowed: boolean
  
  // Shipping
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  shippingClass: string
  
  // Organization
  category: string
  tags: string[]
  
  // Media
  images: string[]
  gallery: string[]
  
  // Attributes & Variations
  attributes: ProductAttribute[]
  variations: ProductVariation[]
  
  // SEO
  seo: SEOData
  
  // Status & Visibility
  status: 'draft' | 'published' | 'private'
  featured: boolean
  catalogVisibility: 'visible' | 'catalog' | 'search' | 'hidden'
  
  // Advanced
  purchaseNote: string
  menuOrder: number
  enableReviews: boolean
  
  // Dates
  dateOnSaleFrom?: string
  dateOnSaleTo?: string
}

export default function NewProduct() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const t = translations[lang]
  
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    shortDescription: '',
    shortDescriptionEn: '',
    price: 0,
    sku: `ATB-${Date.now()}`, // Generate a default SKU
    manageStock: true,
    stock: 0,
    lowStockThreshold: 5,
    backordersAllowed: false,
    shippingClass: 'standard',
    category: '',
    tags: [],
    images: [],
    gallery: [],
    attributes: [],
    variations: [],
    seo: {
      metaTitle: '',
      metaDescription: '',
      focusKeyword: '',
      slug: ''
    },
    status: 'draft',
    featured: false,
    catalogVisibility: 'visible',
    purchaseNote: '',
    menuOrder: 0,
    enableReviews: true
  })

  useEffect(() => {
    if (!user || !user.isAdmin) {
      router.push('/admin')
      return
    }
  }, [user, router])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof ProductFormData] as object || {}),
        [field]: value
      }
    }))
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (value: string) => {
    handleInputChange('name', value)
    if (!formData.seo.slug) {
      handleNestedInputChange('seo', 'slug', generateSlug(value))
    }
    if (!formData.seo.metaTitle) {
      handleNestedInputChange('seo', 'metaTitle', value)
    }
  }

  const addAttribute = () => {
    const newAttribute: ProductAttribute = {
      name: '',
      values: [],
      variation: false,
      visible: true
    }
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, newAttribute]
    }))
  }

  const updateAttribute = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }))
  }

  // Generate all possible variants from attributes marked for variation
  const generateVariants = () => {
    console.log('Generate variants clicked!')
    console.log('Current attributes:', formData.attributes)
    
    if (!formData.attributes || formData.attributes.length === 0) {
      alert('Keine Eigenschaften definiert. Bitte fügen Sie Eigenschaften hinzu.')
      return
    }

    // Get attributes marked for variation
    const variationAttributes = formData.attributes.filter(attr => attr.variation && attr.values.length > 0)
    console.log('Variation attributes found:', variationAttributes)
    
    if (variationAttributes.length === 0) {
      alert('Keine Eigenschaften für Varianten markiert. Bitte markieren Sie mindestens eine Eigenschaft mit "Für Varianten verwenden".')
      return
    }

    // Generate all combinations
    const combinations = generateCombinations(variationAttributes)
    console.log('Generated combinations:', combinations)
    
    // Create variations from combinations
    const newVariations: ProductVariation[] = combinations.map((combo, index) => {
      const attributeString = Object.entries(combo)
        .map(([key, value]) => `${key}-${value}`)
        .join('_')
      
      return {
        id: `var-${Date.now()}-${index}`,
        attributes: combo,
        sku: `${formData.sku}-${attributeString}`,
        price: formData.price,
        salePrice: formData.salePrice,
        stock: 0,
        images: [],
        weight: formData.weight
      }
    })

    console.log('Generated variations:', newVariations)
    setFormData(prev => ({ ...prev, variations: newVariations }))
    alert(`${newVariations.length} Varianten erfolgreich generiert!`)
  }

  // Helper function to generate all combinations of attributes
  const generateCombinations = (attributes: ProductAttribute[]) => {
    if (attributes.length === 0) return [{}]
    
    const [first, ...rest] = attributes
    const restCombinations = generateCombinations(rest)
    
    const combinations: Record<string, string>[] = []
    
    for (const value of first.values) {
      for (const restCombo of restCombinations) {
        combinations.push({
          [first.name]: value,
          ...restCombo
        })
      }
    }
    
    return combinations
  }

  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }))
  }

  const handleSave = async (status: 'draft' | 'published') => {
    setLoading(true)
    try {
      // Validate required fields
      console.log('Form data before validation:', formData)
      
      if (!formData.name || !formData.name.trim()) {
        alert('Produktname ist erforderlich')
        return
      }
      if (!formData.sku || !formData.sku.trim()) {
        alert('SKU ist erforderlich')
        return
      }
      if (!formData.price || formData.price <= 0) {
        alert('Preis muss größer als 0 sein')
        return
      }

      // Prepare data for API
      const productData: any = {
        name: formData.name,
        nameEn: formData.nameEn || formData.name,
        description: formData.description,
        descriptionEn: formData.descriptionEn || formData.description,
        price: formData.price,
        salePrice: formData.salePrice,
        sku: formData.sku,
        stock: formData.manageStock ? formData.stock : 0,
        category: formData.category || 'Uncategorized',
        sizes: [], // Will be populated from attributes
        colors: [], // Will be populated from attributes
        tags: formData.tags,
        images: formData.images,
        featured: formData.featured,
        onSale: !!formData.salePrice,
        weight: formData.weight,
        metaTitle: formData.seo.metaTitle,
        metaDescription: formData.seo.metaDescription,
        isActive: status === 'published',
        hasVariants: formData.variations.length > 0,
        attributes: formData.attributes
      }

      // Extract sizes and colors from attributes
      const sizeAttr = formData.attributes.find(attr => attr.name.toLowerCase() === 'größe' || attr.name.toLowerCase() === 'size')
      const colorAttr = formData.attributes.find(attr => attr.name.toLowerCase() === 'farbe' || attr.name.toLowerCase() === 'color')
      
      if (sizeAttr) productData.sizes = sizeAttr.values
      if (colorAttr) productData.colors = colorAttr.values
      
      // Add variants if they exist
      if (formData.variations.length > 0) {
        productData.variants = formData.variations.map(variation => ({
          sku: variation.sku,
          price: variation.price,
          salePrice: variation.salePrice,
          stock: variation.stock,
          images: variation.images || [],
          attributes: variation.attributes,
          isActive: true
        }))
      }

      console.log('Saving product:', productData)
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Fehler beim Speichern')
      }

      const result = await response.json()
      console.log('Product saved:', result)
      
      alert(`Produkt erfolgreich ${status === 'published' ? 'veröffentlicht' : 'als Entwurf gespeichert'}!`)
      router.push('/admin/products')
    } catch (error) {
      console.error('Error saving product:', error)
      alert(`Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'Allgemein', icon: '📝' },
    { id: 'images', label: 'Bilder', icon: '🖼️' },
    { id: 'inventory', label: 'Lager', icon: '📦' },
    { id: 'shipping', label: 'Versand', icon: '🚚' },
    { id: 'attributes', label: 'Eigenschaften', icon: '🏷️' },
    { id: 'variations', label: 'Varianten', icon: '🔄' },
    { id: 'seo', label: 'SEO', icon: '🔍' },
    { id: 'advanced', label: 'Erweitert', icon: '⚙️' }
  ]

  if (!user || !user.isAdmin) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Neues Produkt hinzufügen
            </h1>
            <p className="text-gray-600 mt-1">
              Erstellen Sie ein neues Produkt für Ihren Shop
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/admin/products')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={() => handleSave('draft')}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Als Entwurf speichern
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Speichern...' : 'Veröffentlichen'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Allgemeine Informationen</h2>
                  
                  {/* Product Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Produktname (Deutsch) *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        placeholder="z.B. Premium Wollpullover"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Produktname (Englisch)
                      </label>
                      <input
                        type="text"
                        value={formData.nameEn}
                        onChange={(e) => handleInputChange('nameEn', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        placeholder="e.g. Premium Wool Sweater"
                      />
                    </div>
                  </div>

                  {/* Short Description */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kurzbeschreibung (Deutsch)
                      </label>
                      <textarea
                        value={formData.shortDescription}
                        onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        placeholder="Kurze Produktbeschreibung..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kurzbeschreibung (Englisch)
                      </label>
                      <textarea
                        value={formData.shortDescriptionEn}
                        onChange={(e) => handleInputChange('shortDescriptionEn', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        placeholder="Short product description..."
                      />
                    </div>
                  </div>

                  {/* Full Description */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vollständige Beschreibung (Deutsch)
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        placeholder="Detaillierte Produktbeschreibung..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vollständige Beschreibung (Englisch)
                      </label>
                      <textarea
                        value={formData.descriptionEn}
                        onChange={(e) => handleInputChange('descriptionEn', e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        placeholder="Detailed product description..."
                      />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Regulärer Preis (€) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        placeholder="99.99"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Angebotspreis (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.salePrice || ''}
                        onChange={(e) => handleInputChange('salePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        placeholder="79.99"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Einkaufspreis (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.costPrice || ''}
                        onChange={(e) => handleInputChange('costPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        placeholder="50.00"
                      />
                    </div>
                  </div>

                  {/* Sale Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Angebot gültig von
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.dateOnSaleFrom || ''}
                        onChange={(e) => handleInputChange('dateOnSaleFrom', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Angebot gültig bis
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.dateOnSaleTo || ''}
                        onChange={(e) => handleInputChange('dateOnSaleTo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Category and Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kategorie
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      >
                        <option value="">Kategorie wählen</option>
                        <option value="pullover">Pullover</option>
                        <option value="jacken">Jacken</option>
                        <option value="hoodies">Hoodies</option>
                        <option value="shirts">Shirts</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags (kommagetrennt)
                      </label>
                      <input
                        type="text"
                        value={formData.tags.join(', ')}
                        onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        placeholder="winter, warm, premium"
                      />
                    </div>
                  </div>

                  {/* Status and Visibility */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      >
                        <option value="draft">Entwurf</option>
                        <option value="published">Veröffentlicht</option>
                        <option value="private">Privat</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Katalog-Sichtbarkeit
                      </label>
                      <select
                        value={formData.catalogVisibility}
                        onChange={(e) => handleInputChange('catalogVisibility', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      >
                        <option value="visible">Sichtbar</option>
                        <option value="catalog">Nur Katalog</option>
                        <option value="search">Nur Suche</option>
                        <option value="hidden">Versteckt</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-4 pt-8">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.featured}
                          onChange={(e) => handleInputChange('featured', e.target.checked)}
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm text-gray-700">Ausgewählt</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Images Tab */}
              {activeTab === 'images' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Produktbilder</h2>
                  
                  <ImageUpload
                    images={formData.images}
                    onImagesChange={(images) => handleInputChange('images', images)}
                    maxImages={10}
                    title="Hauptbilder"
                    description="Laden Sie die Hauptbilder für Ihr Produkt hoch. Das erste Bild wird als Hauptbild verwendet."
                  />

                  <div className="border-t border-gray-200 pt-6">
                    <ImageUpload
                      images={formData.gallery}
                      onImagesChange={(images) => handleInputChange('gallery', images)}
                      maxImages={20}
                      title="Galerie-Bilder"
                      description="Zusätzliche Bilder für die Produktgalerie (Detail-Aufnahmen, Lifestyle-Bilder, etc.)"
                    />
                  </div>

                  {/* Image Guidelines */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Bildrichtlinien</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                      <div>
                        <h4 className="font-medium mb-2">Technische Anforderungen:</h4>
                        <ul className="space-y-1">
                          <li>• Mindestgröße: 800x800px</li>
                          <li>• Empfohlene Größe: 1200x1200px</li>
                          <li>• Formate: JPG, PNG, WebP</li>
                          <li>• Maximale Dateigröße: 10MB</li>
                          <li>• Seitenverhältnis: 1:1 (quadratisch)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Qualitätsrichtlinien:</h4>
                        <ul className="space-y-1">
                          <li>• Neutraler/weißer Hintergrund</li>
                          <li>• Gute Beleuchtung ohne Schatten</li>
                          <li>• Produkt füllt 80% des Bildes</li>
                          <li>• Verschiedene Winkel zeigen</li>
                          <li>• Details und Texturen hervorheben</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Tab */}
              {activeTab === 'inventory' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Lagerverwaltung</h2>
                  
                  {/* SKU */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU (Artikelnummer) *
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      placeholder="z.B. ATB-PULL-001"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Eindeutige Artikelnummer für interne Verwaltung
                    </p>
                  </div>

                  {/* Stock Management */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="manageStock"
                        checked={formData.manageStock}
                        onChange={(e) => handleInputChange('manageStock', e.target.checked)}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                      />
                      <label htmlFor="manageStock" className="ml-2 text-sm font-medium text-gray-700">
                        Lagerbestand verwalten
                      </label>
                    </div>

                    {formData.manageStock && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lagerbestand *
                          </label>
                          <input
                            type="number"
                            value={formData.stock}
                            onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mindestbestand
                          </label>
                          <input
                            type="number"
                            value={formData.lowStockThreshold}
                            onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                            placeholder="5"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Warnung bei niedrigem Bestand
                          </p>
                        </div>
                        <div className="flex items-center pt-8">
                          <input
                            type="checkbox"
                            id="backordersAllowed"
                            checked={formData.backordersAllowed}
                            onChange={(e) => handleInputChange('backordersAllowed', e.target.checked)}
                            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                          />
                          <label htmlFor="backordersAllowed" className="ml-2 text-sm text-gray-700">
                            Nachbestellungen erlauben
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stock Status Indicator */}
                  {formData.manageStock && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Lagerstatus</h3>
                      <div className="flex items-center space-x-4">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          formData.stock > formData.lowStockThreshold
                            ? 'bg-green-100 text-green-800'
                            : formData.stock > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {formData.stock > formData.lowStockThreshold
                            ? 'Auf Lager'
                            : formData.stock > 0
                            ? 'Niedriger Bestand'
                            : 'Ausverkauft'
                          }
                        </div>
                        <span className="text-sm text-gray-600">
                          {formData.stock} Stück verfügbar
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Shipping Tab */}
              {activeTab === 'shipping' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Versandeinstellungen</h2>
                  
                  {/* Weight */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gewicht (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.weight || ''}
                      onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      placeholder="0.50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Gewicht für Versandkostenberechnung
                    </p>
                  </div>

                  {/* Dimensions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Abmessungen (cm)
                    </label>
                    <div className="grid grid-cols-3 gap-4 max-w-md">
                      <div>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.dimensions?.length || ''}
                          onChange={(e) => handleNestedInputChange('dimensions', 'length', e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                          placeholder="Länge"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.dimensions?.width || ''}
                          onChange={(e) => handleNestedInputChange('dimensions', 'width', e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                          placeholder="Breite"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.dimensions?.height || ''}
                          onChange={(e) => handleNestedInputChange('dimensions', 'height', e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                          placeholder="Höhe"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Länge × Breite × Höhe für Versandkostenberechnung
                    </p>
                  </div>

                  {/* Shipping Class */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Versandklasse
                    </label>
                    <select
                      value={formData.shippingClass}
                      onChange={(e) => handleInputChange('shippingClass', e.target.value)}
                      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    >
                      <option value="standard">Standard</option>
                      <option value="express">Express</option>
                      <option value="heavy">Schwer</option>
                      <option value="fragile">Zerbrechlich</option>
                      <option value="free">Kostenloser Versand</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Versandklasse für spezielle Versandregeln
                    </p>
                  </div>
                </div>
              )}

              {/* Attributes Tab */}
              {activeTab === 'attributes' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Produkteigenschaften</h2>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={generateVariants}
                        disabled={!formData.attributes?.some(attr => attr.variation)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Varianten generieren
                      </button>
                      <button
                        onClick={addAttribute}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Eigenschaft hinzufügen
                      </button>
                    </div>
                  </div>

                  {formData.attributes.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="text-4xl mb-4">🏷️</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Keine Eigenschaften definiert
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Fügen Sie Eigenschaften wie Größe, Farbe oder Material hinzu
                      </p>
                      <button
                        onClick={addAttribute}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Erste Eigenschaft hinzufügen
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.attributes.map((attribute, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-900">
                              Eigenschaft {index + 1}
                            </h3>
                            <button
                              onClick={() => removeAttribute(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name
                              </label>
                              <input
                                type="text"
                                value={attribute.name}
                                onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                                placeholder="z.B. Größe, Farbe, Material"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Werte (kommagetrennt)
                              </label>
                              <input
                                type="text"
                                value={attribute.values.join(', ')}
                                onChange={(e) => updateAttribute(index, 'values', e.target.value.split(',').map(v => v.trim()).filter(v => v))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                                placeholder="z.B. S, M, L, XL"
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={attribute.visible}
                                onChange={(e) => updateAttribute(index, 'visible', e.target.checked)}
                                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                              />
                              <span className="ml-2 text-sm text-gray-700">Sichtbar auf Produktseite</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={attribute.variation}
                                onChange={(e) => updateAttribute(index, 'variation', e.target.checked)}
                                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                              />
                              <span className="ml-2 text-sm text-gray-700">Für Varianten verwenden</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SEO Tab */}
              {activeTab === 'seo' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">SEO-Einstellungen</h2>
                  
                  {/* URL Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL-Slug
                    </label>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">attireburg.de/products/</span>
                      <input
                        type="text"
                        value={formData.seo.slug}
                        onChange={(e) => handleNestedInputChange('seo', 'slug', e.target.value)}
                        className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        placeholder="premium-wollpullover"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      URL-freundlicher Name für das Produkt
                    </p>
                  </div>

                  {/* Meta Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta-Titel
                    </label>
                    <input
                      type="text"
                      value={formData.seo.metaTitle}
                      onChange={(e) => handleNestedInputChange('seo', 'metaTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      placeholder="Premium Wollpullover - Hochwertige deutsche Kleidung"
                      maxLength={60}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Titel für Suchmaschinen (empfohlen: 50-60 Zeichen)</span>
                      <span>{formData.seo.metaTitle.length}/60</span>
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta-Beschreibung
                    </label>
                    <textarea
                      value={formData.seo.metaDescription}
                      onChange={(e) => handleNestedInputChange('seo', 'metaDescription', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      placeholder="Entdecken Sie unseren Premium Wollpullover aus hochwertigen Materialien. Zeitloses Design trifft auf deutsche Qualität."
                      maxLength={160}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Beschreibung für Suchmaschinen (empfohlen: 150-160 Zeichen)</span>
                      <span>{formData.seo.metaDescription.length}/160</span>
                    </div>
                  </div>

                  {/* Focus Keyword */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fokus-Keyword
                    </label>
                    <input
                      type="text"
                      value={formData.seo.focusKeyword}
                      onChange={(e) => handleNestedInputChange('seo', 'focusKeyword', e.target.value)}
                      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      placeholder="wollpullover premium"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Hauptkeyword für SEO-Optimierung
                    </p>
                  </div>

                  {/* SEO Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Google-Vorschau</h3>
                    <div className="bg-white rounded border p-3">
                      <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                        {formData.seo.metaTitle || formData.name || 'Produkttitel'}
                      </div>
                      <div className="text-green-700 text-sm">
                        attireburg.de/products/{formData.seo.slug || 'produkt-slug'}
                      </div>
                      <div className="text-gray-600 text-sm mt-1">
                        {formData.seo.metaDescription || formData.shortDescription || 'Produktbeschreibung wird hier angezeigt...'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Variations Tab */}
              {activeTab === 'variations' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Produktvarianten</h2>
                    <button
                      onClick={generateVariants}
                      disabled={!formData.attributes?.some(attr => attr.variation)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Varianten generieren
                    </button>
                  </div>

                  {formData.attributes.filter(attr => attr.variation).length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="text-4xl mb-4">🔄</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Keine Varianten-Eigenschaften definiert
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Definieren Sie zuerst Eigenschaften (z.B. Größe, Farbe) im Eigenschaften-Tab und markieren Sie diese als "Für Varianten verwenden"
                      </p>
                      <button
                        onClick={() => setActiveTab('attributes')}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Zu Eigenschaften wechseln
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">Verfügbare Varianten-Eigenschaften</h3>
                        <div className="flex flex-wrap gap-2">
                          {formData.attributes.filter(attr => attr.variation).map((attr, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {attr.name}: {attr.values.join(', ')}
                            </span>
                          ))}
                        </div>
                      </div>

                      {formData.variations.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-600 mb-4">
                            Noch keine Varianten erstellt
                          </p>
                          <button
                            onClick={() => {
                              // Generate variations logic would go here
                              console.log('Generate variations')
                            }}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                          >
                            Alle Varianten automatisch generieren
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {formData.variations.map((variation, index) => (
                            <div key={variation.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-gray-900">
                                  Variante {index + 1}: {Object.entries(variation.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                                </h3>
                                <button className="text-red-600 hover:text-red-700">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                                    <input
                                      type="text"
                                      value={variation.sku}
                                      onChange={(e) => {
                                        const newVariations = [...formData.variations]
                                        newVariations[index] = { ...variation, sku: e.target.value }
                                        setFormData(prev => ({ ...prev, variations: newVariations }))
                                      }}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-600"
                                      placeholder="VAR-001"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Preis (€)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={variation.price}
                                      onChange={(e) => {
                                        const newVariations = [...formData.variations]
                                        newVariations[index] = { ...variation, price: parseFloat(e.target.value) || 0 }
                                        setFormData(prev => ({ ...prev, variations: newVariations }))
                                      }}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-600"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Angebotspreis (€)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={variation.salePrice || ''}
                                      onChange={(e) => {
                                        const newVariations = [...formData.variations]
                                        newVariations[index] = { ...variation, salePrice: e.target.value ? parseFloat(e.target.value) : undefined }
                                        setFormData(prev => ({ ...prev, variations: newVariations }))
                                      }}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-600"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Lagerbestand</label>
                                    <input
                                      type="number"
                                      value={variation.stock}
                                      onChange={(e) => {
                                        const newVariations = [...formData.variations]
                                        newVariations[index] = { ...variation, stock: parseInt(e.target.value) || 0 }
                                        setFormData(prev => ({ ...prev, variations: newVariations }))
                                      }}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-600"
                                    />
                                  </div>
                                </div>
                                
                                {/* Variant Images */}
                                <div className="mt-4">
                                  <ImageUpload
                                    images={variation.images || []}
                                    onImagesChange={(newImages) => {
                                      const newVariations = [...formData.variations]
                                      newVariations[index] = { ...variation, images: newImages }
                                      setFormData(prev => ({ ...prev, variations: newVariations }))
                                    }}
                                    maxImages={5}
                                    title={`Bilder für Variante ${index + 1}`}
                                    description={`Spezifische Bilder für ${Object.entries(variation.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Erweiterte Einstellungen</h2>
                  
                  {/* Purchase Note */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kaufhinweis
                    </label>
                    <textarea
                      value={formData.purchaseNote}
                      onChange={(e) => handleInputChange('purchaseNote', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      placeholder="Hinweis für Kunden nach dem Kauf (z.B. Pflegehinweise)"
                    />
                  </div>

                  {/* Menu Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Menü-Reihenfolge
                    </label>
                    <input
                      type="number"
                      value={formData.menuOrder}
                      onChange={(e) => handleInputChange('menuOrder', parseInt(e.target.value) || 0)}
                      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Niedrigere Zahlen erscheinen zuerst
                    </p>
                  </div>

                  {/* Enable Reviews */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enableReviews"
                      checked={formData.enableReviews}
                      onChange={(e) => handleInputChange('enableReviews', e.target.checked)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <label htmlFor="enableReviews" className="ml-2 text-sm font-medium text-gray-700">
                      Bewertungen aktivieren
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}