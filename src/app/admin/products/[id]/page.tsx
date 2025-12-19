'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import DashboardLayout from '@/components/DashboardLayout'
import ImageUpload from '@/components/admin/ImageUpload'

interface ProductVariant {
  id?: string
  sku: string
  price?: number
  salePrice?: number
  stock: number
  images: string[]
  attributes: Record<string, string> // e.g., {"color": "red", "size": "L"}
  isActive: boolean
}

interface Product {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  price: number
  salePrice?: number
  sku: string
  stock: number
  category: string
  sizes: string[]
  colors: string[]
  tags: string[]
  images: string[]
  featured: boolean
  onSale: boolean
  isActive: boolean
  weight?: number
  metaTitle?: string
  metaDescription?: string
  manageStock?: boolean
  lowStockThreshold?: number
  hasVariants?: boolean
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  attributes?: Array<{
    name: string
    values: string[]
    visible: boolean
    variation: boolean
  }>
  variants?: ProductVariant[]
}

export default function EditProduct() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const t = translations[lang]
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<Product>>({})
  const [activeTab, setActiveTab] = useState('general')
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [generatingVariants, setGeneratingVariants] = useState(false)

  useEffect(() => {
    if (!user || !user.isAdmin) {
      router.push('/admin')
      return
    }
    
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [user, router, params.id])

  const fetchProduct = async (id: string) => {
    try {
      setLoading(true)
      console.log('Fetching product with ID:', id)
      
      const response = await fetch(`/api/products/${id}`)
      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Product API response:', data)
      
      // Validate that we received product data
      if (!data || !data.id) {
        throw new Error('Invalid product data received')
      }
      
      // The API returns the product directly, not wrapped in a product property
      setProduct(data)
      
      // Initialize form data with default values for new fields
      setFormData({
        ...data,
        attributes: data.attributes || [],
        manageStock: data.manageStock !== undefined ? data.manageStock : true,
        lowStockThreshold: data.lowStockThreshold || 5,
        dimensions: data.dimensions || {},
        hasVariants: data.hasVariants || false
      })
      
      // Initialize variants - make sure to handle the variants properly
      console.log('Setting variants:', data.variants)
      setVariants(data.variants || [])
      
    } catch (error) {
      console.error('Failed to fetch product:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      alert(`Fehler beim Laden des Produkts: ${errorMessage}`)
      router.push('/admin/products')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Generate all possible variants from attributes marked for variation
  const generateVariants = () => {
    console.log('Generate variants clicked!')
    console.log('Current formData.attributes:', formData.attributes)
    
    if (!formData.attributes || formData.attributes.length === 0) {
      alert('Keine Eigenschaften definiert. Bitte gehen Sie zum Tab "Eigenschaften" und fügen Sie Eigenschaften hinzu.')
      return
    }

    setGeneratingVariants(true)
    
    // Get attributes marked for variation
    const variationAttributes = formData.attributes.filter(attr => attr.variation && attr.values.length > 0)
    console.log('Variation attributes found:', variationAttributes)
    
    if (variationAttributes.length === 0) {
      alert('Keine Eigenschaften für Varianten markiert. Bitte gehen Sie zum Tab "Eigenschaften", fügen Sie Eigenschaften hinzu und markieren Sie sie mit "Für Varianten verwenden".')
      setGeneratingVariants(false)
      return
    }

    console.log('Generating variants from attributes:', variationAttributes)

    // Generate all combinations
    const combinations = generateCombinations(variationAttributes)
    console.log('Generated combinations:', combinations)
    
    // Create variants from combinations
    const newVariants: ProductVariant[] = combinations.map((combo, index) => {
      const attributeString = Object.entries(combo)
        .map(([key, value]) => `${key}-${value}`)
        .join('_')
      
      return {
        sku: `${formData.sku || 'PROD'}-${attributeString}`,
        price: formData.price,
        salePrice: formData.salePrice,
        stock: 0,
        images: [],
        attributes: combo,
        isActive: true
      }
    })

    console.log('Generated variants:', newVariants)
    setVariants(newVariants)
    setFormData(prev => ({ ...prev, hasVariants: true }))
    setGeneratingVariants(false)
    alert(`${newVariants.length} Varianten erfolgreich generiert! Jede Variante hat individuelle Lagerbestände und kann eigene Bilder haben.`)
  }

  // Helper function to generate all combinations of attributes
  const generateCombinations = (attributes: Array<{name: string, values: string[]}>) => {
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

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ))
  }

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index))
  }



  const handleSave = async () => {
    if (!product) return
    
    setSaving(true)
    try {
      // Validate required fields
      if (!formData.name?.trim()) {
        alert('Produktname ist erforderlich')
        return
      }
      if (!formData.sku?.trim()) {
        alert('SKU ist erforderlich')
        return
      }
      if (!formData.price || formData.price <= 0) {
        alert('Preis muss größer als 0 sein')
        return
      }

      // Prepare the data to send
      const updateData = {
        ...formData,
        variants: formData.hasVariants ? variants : []
      }
      
      console.log('Sending update data:', updateData)
      
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        let errorMessage = 'Fehler beim Speichern'
        try {
          const error = await response.json()
          errorMessage = error.message || error.error || errorMessage
        } catch (jsonError) {
          // If JSON parsing fails, use response status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      alert(result.message || 'Produkt erfolgreich aktualisiert!')
      router.push('/admin/products')
    } catch (error) {
      console.error('Error saving product:', error)
      alert(`Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setSaving(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  if (!user || !user.isAdmin) {
    return null
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-pulse space-y-4 w-full max-w-2xl">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Produkt nicht gefunden
          </h2>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Zurück zu Produkten
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Produkt bearbeiten
            </h1>
            <p className="text-gray-600 mt-1">
              {product.name}
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
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Speichern...' : 'Änderungen speichern'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'general', label: 'Allgemein', icon: '📝' },
                { id: 'images', label: 'Bilder', icon: '🖼️' },
                { id: 'inventory', label: 'Lager', icon: '📦' },
                { id: 'attributes', label: 'Eigenschaften', icon: '🏷️' },
                { id: 'variants', label: 'Varianten', icon: '🔄' },
                { id: 'seo', label: 'SEO', icon: '🔍' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Grundinformationen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Produktname (Deutsch) *
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Produktname (Englisch)
                      </label>
                      <input
                        type="text"
                        value={formData.nameEn || ''}
                        onChange={(e) => handleInputChange('nameEn', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Beschreibung</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Beschreibung (Deutsch)
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Beschreibung (Englisch)
                      </label>
                      <textarea
                        value={formData.descriptionEn || ''}
                        onChange={(e) => handleInputChange('descriptionEn', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Preise</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Regulärer Preis (€) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price || ''}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
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
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="text-sm text-gray-600">
                        {formData.salePrice ? (
                          <div>
                            <div className="font-semibold text-red-600">
                              {formatPrice(formData.salePrice)}
                            </div>
                            <div className="line-through">
                              {formatPrice(formData.price || 0)}
                            </div>
                          </div>
                        ) : (
                          <div className="font-semibold">
                            {formatPrice(formData.price || 0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category and Tags */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategorisierung</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kategorie
                      </label>
                      <select
                        value={formData.category || ''}
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
                        value={formData.tags?.join(', ') || ''}
                        onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        placeholder="winter, warm, premium"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive || false}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-gray-700">Aktiv</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.featured || false}
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
              <div className="space-y-6">
                <ImageUpload
                  images={formData.images || []}
                  onImagesChange={(newImages) => handleInputChange('images', newImages)}
                  maxImages={10}
                  title="Produktbilder"
                  description="Hauptbilder für das Produkt. Das erste Bild wird als Hauptbild verwendet."
                />
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Lagerverwaltung</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={formData.sku || ''}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lagerbestand
                    </label>
                    <input
                      type="number"
                      value={formData.stock || ''}
                      onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gewicht (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.weight || ''}
                      onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Attributes Tab */}
            {activeTab === 'attributes' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Produkteigenschaften</h3>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={generateVariants}
                      disabled={generatingVariants || !formData.attributes?.some(attr => attr.variation)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingVariants ? 'Generiere...' : 'Varianten generieren'}
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      onClick={() => {
                        const newAttributes = [...(formData.attributes || []), {
                          name: '',
                          values: [],
                          visible: true,
                          variation: false
                        }]
                        handleInputChange('attributes', newAttributes)
                      }}
                    >
                      Eigenschaft hinzufügen
                    </button>
                  </div>
                </div>
                
                {formData.attributes && formData.attributes.length > 0 ? (
                  <div className="space-y-4">
                    {formData.attributes.map((attr, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Eigenschaftsname
                            </label>
                            <input
                              type="text"
                              value={attr.name}
                              onChange={(e) => {
                                const newAttributes = [...(formData.attributes || [])]
                                newAttributes[index] = { ...attr, name: e.target.value }
                                handleInputChange('attributes', newAttributes)
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                              placeholder="z.B. Farbe, Größe"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Werte (kommagetrennt)
                            </label>
                            <input
                              type="text"
                              value={attr.values.join(', ')}
                              onChange={(e) => {
                                const newAttributes = [...(formData.attributes || [])]
                                newAttributes[index] = { 
                                  ...attr, 
                                  values: e.target.value.split(',').map(v => v.trim()).filter(v => v)
                                }
                                handleInputChange('attributes', newAttributes)
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                              placeholder="z.B. Rot, Blau, Grün"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={attr.visible}
                                onChange={(e) => {
                                  const newAttributes = [...(formData.attributes || [])]
                                  newAttributes[index] = { ...attr, visible: e.target.checked }
                                  handleInputChange('attributes', newAttributes)
                                }}
                                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                              />
                              <span className="ml-2 text-sm text-gray-700">Sichtbar</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={attr.variation}
                                onChange={(e) => {
                                  const newAttributes = [...(formData.attributes || [])]
                                  newAttributes[index] = { ...attr, variation: e.target.checked }
                                  handleInputChange('attributes', newAttributes)
                                }}
                                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                              />
                              <span className="ml-2 text-sm text-gray-700">Für Varianten verwenden</span>
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newAttributes = formData.attributes?.filter((_, i) => i !== index) || []
                              handleInputChange('attributes', newAttributes)
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Entfernen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">Keine Eigenschaften definiert</p>
                  </div>
                )}
              </div>
            )}

            {/* Variants Tab */}
            {activeTab === 'variants' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Produktvarianten</h3>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.hasVariants || false}
                        onChange={(e) => handleInputChange('hasVariants', e.target.checked)}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-gray-700">Varianten verwenden</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateVariants}
                      disabled={generatingVariants || !formData.attributes?.some(attr => attr.variation)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingVariants ? 'Generiere...' : 'Alle Varianten generieren'}
                    </button>
                  </div>
                </div>

                {!formData.hasVariants ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-gray-500">
                      <p className="mb-2">Varianten sind deaktiviert</p>
                      <p className="text-sm">Aktivieren Sie Varianten, um verschiedene Kombinationen von Eigenschaften zu erstellen.</p>
                    </div>
                  </div>
                ) : variants.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-gray-500">
                      <p className="mb-2">Keine Varianten vorhanden</p>
                      <p className="text-sm">Erstellen Sie zuerst Eigenschaften und markieren Sie sie für Varianten, dann generieren Sie alle Kombinationen.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Variants Summary */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900">
                            {variants.length} Variante{variants.length !== 1 ? 'n' : ''} gefunden
                          </h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Gesamtlagerbestand: {variants.reduce((sum, v) => sum + v.stock, 0)} Stück
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const stock = prompt('Lagerbestand für alle Varianten setzen:')
                              if (stock !== null) {
                                const stockNum = parseInt(stock) || 0
                                setVariants(prev => prev.map(v => ({ ...v, stock: stockNum })))
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Alle Lagerbestände setzen
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const price = prompt('Preis für alle Varianten setzen (€):')
                              if (price !== null) {
                                const priceNum = parseFloat(price) || 0
                                setVariants(prev => prev.map(v => ({ ...v, price: priceNum })))
                              }
                            }}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Alle Preise setzen
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {variants.map((variant, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <h4 className="font-medium text-gray-900">
                              Variante {index + 1}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {Object.entries(variant.attributes).map(([key, value]) => (
                                <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Entfernen
                          </button>
                        </div>

                        {/* Variant Details */}
                        <div className="space-y-4">
                          {/* SKU and Pricing */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                SKU *
                              </label>
                              <input
                                type="text"
                                value={variant.sku}
                                onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                                placeholder="Eindeutige SKU für diese Variante"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Preis (€)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={variant.price || ''}
                                onChange={(e) => updateVariant(index, 'price', e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                                placeholder={`Standard: ${formatPrice(formData.price || 0)}`}
                              />
                              <p className="text-xs text-gray-500 mt-1">Leer = Standardpreis verwenden</p>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Angebotspreis (€)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={variant.salePrice || ''}
                                onChange={(e) => updateVariant(index, 'salePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                                placeholder="Optional"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                🏪 Lagerbestand *
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={variant.stock}
                                onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent ${
                                  variant.stock <= 5 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Anzahl verfügbar"
                              />
                              {variant.stock <= 5 && (
                                <p className="text-xs text-red-600 mt-1">
                                  ⚠️ Niedriger Lagerbestand
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Inventory Summary */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                Variante: {Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                              </span>
                              <div className="flex items-center space-x-4">
                                <span className={`font-medium ${variant.stock > 10 ? 'text-green-600' : variant.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {variant.stock > 10 ? '✅ Gut verfügbar' : variant.stock > 0 ? '⚠️ Wenig verfügbar' : '❌ Nicht verfügbar'}
                                </span>
                                <span className="text-gray-500">
                                  Preis: {variant.price ? formatPrice(variant.price) : formatPrice(formData.price || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Variant Images */}
                        <div className="mt-4">
                          <ImageUpload
                            images={variant.images}
                            onImagesChange={(newImages) => updateVariant(index, 'images', newImages)}
                            maxImages={5}
                            title={`Bilder für Variante ${index + 1}`}
                            description={`Spezifische Bilder für ${Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}`}
                          />
                        </div>

                        <div className="mt-4 flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={variant.isActive}
                              onChange={(e) => updateVariant(index, 'isActive', e.target.checked)}
                              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                            />
                            <span className="ml-2 text-sm text-gray-700">Variante aktiv</span>
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
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Suchmaschinenoptimierung</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta-Titel
                    </label>
                    <input
                      type="text"
                      value={formData.metaTitle || ''}
                      onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      placeholder="SEO-optimierter Titel für Suchmaschinen"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Empfohlen: 50-60 Zeichen
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta-Beschreibung
                    </label>
                    <textarea
                      value={formData.metaDescription || ''}
                      onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      placeholder="Kurze Beschreibung für Suchergebnisse"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Empfohlen: 150-160 Zeichen
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}