'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/components/ClientLayout'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { translations } from '@/lib/translations'
import { formatPriceWithVAT } from '@/lib/vat'
import OutOfStockActions from '@/components/backorder/OutOfStockActions'
import BackorderModal from '@/components/backorder/BackorderModal'
import { useRestockDate } from '@/hooks/useRestockDate'
import { getSession } from '@/lib/session'

interface ProductVariant {
  id: string
  sku: string
  price?: number
  salePrice?: number
  stock: number
  images: string[]
  attributes: Record<string, string>
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
  images: string[]
  category: string
  sizes: string[]
  colors: string[]
  stock: number
  avgRating: number
  reviewCount: number
  onSale: boolean
  hasVariants?: boolean
  variants?: ProductVariant[]
  reviews: Review[]
}

interface Review {
  id: string
  rating: number
  title?: string
  comment?: string
  createdAt: string
  user: {
    name: string
    firstName?: string
  }
}

const renderFormattedDescription = (text: string) => {
  if (!text) return null

  const parseInlineStyles = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <strong key={index} className="font-bold text-gray-900">{part.slice(1, -1)}</strong>
      }
      return part
    })
  }

  const normalizedText = text.replace(/\r\n/g, '\n')
  const lines = normalizedText.split('\n')
  const blocks: React.ReactNode[] = []
  let currentList: React.ReactNode[] = []

  const pushCurrentList = (key: string | number) => {
    if (currentList.length > 0) {
      blocks.push(
        <ul key={`list-${key}`} className="list-disc pl-5 mb-4 space-y-1 text-gray-700">
          {currentList}
        </ul>
      )
      currentList = []
    }
  }

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      const content = trimmedLine.substring(2)
      currentList.push(
        <li key={`li-${index}`} className="text-gray-700">
          {parseInlineStyles(content)}
        </li>
      )
    } else {
      pushCurrentList(index)

      if (trimmedLine === '') {
        return
      }

      blocks.push(
        <p key={`p-${index}`} className="text-gray-700 leading-relaxed mb-4">
          {parseInlineStyles(line)}
        </p>
      )
    }
  })

  pushCurrentList('end')

  return <div className="space-y-1">{blocks}</div>
}

export default function ProductDetail() {
  const params = useParams()
  const { lang } = useLanguage()
  const { addItem } = useCart()
  const { user } = useAuth()
  const toast = useToast()
  const t = translations[lang]
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [showReviews, setShowReviews] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
  const [showBackorderModal, setShowBackorderModal] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [showSizeChart, setShowSizeChart] = useState(false)
  
  // Get restock date for current product/variant
  const { restockDate } = useRestockDate(
    product?.id || '',
    selectedVariant?.id
  )

  // Get all variant attributes and check if the combination is fully selected
  const allAttributeNames = Object.keys(
    product?.variants?.reduce((acc, variant) => ({ ...acc, ...variant.attributes }), {}) || {}
  )
  const isFullCombinationSelected = !product?.hasVariants || (
    product.hasVariants && allAttributeNames.every(name => selectedAttributes[name] !== undefined)
  )
  const isSelectedCombinationInStock = product?.hasVariants
    ? (selectedVariant && selectedVariant.stock > 0 && product.stock > 0)
    : (product && product.stock > 0)
  const showOutOfStock = isFullCombinationSelected && !isSelectedCombinationInStock
  const showAddToCart = !showOutOfStock

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id])

  // Check if product is in wishlist
  useEffect(() => {
    if (user && product) {
      checkWishlistStatus()
    }
  }, [user, product])

  const checkWishlistStatus = async () => {
    if (!user || !product) return
    
    try {
      const session = getSession()
      if (!session?.token) return

      const response = await fetch('/api/wishlist', {
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        const isInList = data.wishlist.some((item: any) => item.productId === product.id)
        setIsInWishlist(isInList)
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error)
    }
  }

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
        
        // Initialize selections - do NOT auto-select a variant or color
        // User should choose color explicitly
        if (data.sizes?.length > 0) setSelectedSize(data.sizes[0])
        // Don't auto-select color or variant - show main product images by default
        // User must explicitly choose a color to see color-specific images
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  // Find variant based on selected attributes
  const findVariantByAttributes = (attributes: Record<string, string>) => {
    if (!product?.variants) return null
    
    return product.variants.find(variant => {
      return Object.entries(attributes).every(([key, value]) => 
        variant.attributes[key] === value
      )
    })
  }

  // Handle attribute selection (size, color, etc.)
  const handleAttributeChange = (attributeName: string, value: string) => {
    const isColorAttr = attributeName.toLowerCase() === 'farbe' || attributeName.toLowerCase() === 'color' || attributeName.toLowerCase() === 'colour'
    
    // Toggle: if same color is clicked again, deselect it and show main images
    if (isColorAttr && selectedAttributes[attributeName] === value) {
      const newAttributes = { ...selectedAttributes }
      delete newAttributes[attributeName]
      setSelectedAttributes(newAttributes)
      setSelectedColor('')
      setSelectedVariant(null)
      setSelectedImage(0)
      return
    }

    const newAttributes = { ...selectedAttributes, [attributeName]: value }
    setSelectedAttributes(newAttributes)
    
    // Update legacy state for backward compatibility
    if (attributeName === 'Größe' || attributeName === 'Size') {
      setSelectedSize(value)
    }
    if (isColorAttr) {
      setSelectedColor(value)
    }
    
    // Find matching variant
    const variant = findVariantByAttributes(newAttributes)
    
    // Only update images if a color was just selected
    // Selecting fit or size alone should NOT change the displayed images
    if (isColorAttr) {
      setSelectedVariant(variant || null)
      setSelectedImage(0)
    } else {
      // For non-color attributes (fit, size), update variant for stock/price info
      // but only if a color is already selected - don't change images
      if (selectedColor) {
        setSelectedVariant(variant || null)
      }
      // If no color selected yet, don't set a variant (keep showing main images)
    }
  }

  // Get current price (variant price or base price)
  const getCurrentPrice = () => {
    if (selectedVariant?.price) return selectedVariant.price
    return product?.price || 0
  }

  // Get current sale price
  const getCurrentSalePrice = () => {
    if (selectedVariant?.salePrice) return selectedVariant.salePrice
    return product?.salePrice
  }

  // Get current stock
  const getCurrentStock = () => {
    if (selectedVariant) {
      return Math.min(selectedVariant.stock, product?.stock || 0)
    }
    return product?.stock || 0
  }

  // Get current images (variant images or product images)
  // Only show variant images if a color has been explicitly selected
  const getCurrentImages = () => {
    if (selectedColor && selectedVariant?.images && selectedVariant.images.length > 0) {
      return selectedVariant.images
    }
    return product?.images || []
  }

  // Get available attribute values
  const getAvailableAttributeValues = (attributeName: string) => {
    if (!product?.variants) return []
    
    const values = new Set<string>()
    product.variants
      .filter(v => v.isActive)
      .forEach(variant => {
        if (variant.attributes[attributeName]) {
          values.add(variant.attributes[attributeName])
        }
      })
    
    return Array.from(values)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const handleAddToCart = async () => {
    if (!product) return
    
    // Check if product has variants and one is selected
    if (product.hasVariants) {
      if (!selectedVariant) {
        toast.warning('Bitte wählen Sie eine Variante aus')
        return
      }
    } else {
      // Legacy size/color validation
      if (product.sizes && product.sizes.length > 0 && !selectedSize) {
        toast.warning(t.productDetail.selectSize)
        return
      }
    }

    const currentImages = getCurrentImages()
    
    try {
      await addItem({
        productId: product.id,
        variantId: selectedVariant?.id,
        name: product.name,
        nameEn: product.nameEn,
        price: getCurrentPrice(),
        salePrice: getCurrentSalePrice(),
        image: currentImages.length > 0 ? currentImages[selectedImage] : '',
        size: selectedSize,
        color: selectedColor,
        quantity,
        stock: getCurrentStock(),
        attributes: selectedVariant ? selectedVariant.attributes : undefined
      })

      toast.success(t.productDetail.addedToCart)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Hinzufügen zum Warenkorb')
    }
  }

  const handleBackorderClick = () => {
    setShowBackorderModal(true)
  }

  const handleWishlistToggle = async () => {
    if (!user) {
      toast.warning('Bitte melden Sie sich an, um Produkte zur Wunschliste hinzuzufügen')
      return
    }

    if (!product) return

    const session = getSession()
    if (!session?.token) {
      toast.warning('Bitte melden Sie sich erneut an')
      return
    }

    setWishlistLoading(true)
    
    try {
      if (isInWishlist) {
        // Remove from wishlist
        const response = await fetch(`/api/wishlist?productId=${product.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.token}`
          }
        })
        
        if (response.ok) {
          setIsInWishlist(false)
          toast.success('Produkt von der Wunschliste entfernt')
        } else {
          throw new Error('Failed to remove from wishlist')
        }
      } else {
        // Add to wishlist
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`
          },
          body: JSON.stringify({
            productId: product.id
          })
        })
        
        if (response.ok) {
          setIsInWishlist(true)
          toast.success('Produkt zur Wunschliste hinzugefügt')
        } else {
          const data = await response.json()
          throw new Error(data.error || 'Failed to add to wishlist')
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
      toast.error(error instanceof Error ? error.message : 'Fehler beim Bearbeiten der Wunschliste')
    } finally {
      setWishlistLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="aspect-square bg-gray-200 rounded-lg"></div>
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.productDetail.notFound}</h1>
          <Link href="/products" className="text-primary-600 hover:text-primary-700">
            {t.productDetail.backToProducts}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-4 sm:mb-8">
          <ol className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 flex-wrap">
            <li><Link href="/" className="hover:text-gray-900">{t.productDetail.breadcrumb.home}</Link></li>
            <li>/</li>
            <li><Link href="/products" className="hover:text-gray-900">{t.productDetail.breadcrumb.products}</Link></li>
            <li>/</li>
            <li className="text-gray-900 truncate max-w-[150px] sm:max-w-none">{lang === 'de' ? product.name : product.nameEn}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main image with arrow navigation */}
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-sm group">
              {getCurrentImages().length > 0 ? (
                <Image
                  src={getCurrentImages()[selectedImage]}
                  alt={lang === 'de' ? product.name : product.nameEn}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  {t.common.noImage}
                </div>
              )}
              {/* Arrow navigation - only show if multiple images */}
              {getCurrentImages().length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(i => (i - 1 + getCurrentImages().length) % getCurrentImages().length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedImage(i => (i + 1) % getCurrentImages().length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {getCurrentImages().map((_, i) => (
                      <button key={i} onClick={() => setSelectedImage(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === selectedImage ? 'bg-gray-900' : 'bg-gray-400'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Thumbnails - current color images */}
            {getCurrentImages().length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {getCurrentImages().map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square rounded overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Image src={image} alt={`${index + 1}`} fill sizes="150px" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {lang === 'de' ? product.name : product.nameEn}
              </h1>
              <p className="text-gray-600 capitalize">{product.category}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.avgRating) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {product.avgRating.toFixed(1)} ({product.reviewCount} {t.productDetail.reviews})
                </span>
              </div>
              <button
                onClick={() => setShowReviews(!showReviews)}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                {t.productDetail.showReviews}
              </button>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                {getCurrentSalePrice() ? (
                  <>
                    <span className="text-3xl font-bold text-red-600">
                      {formatPriceWithVAT(getCurrentSalePrice()!, lang).price}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(getCurrentPrice())}
                    </span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-semibold">
                      {t.productDetail.sale}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPriceWithVAT(getCurrentPrice(), lang).price}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {formatPriceWithVAT(getCurrentSalePrice() || getCurrentPrice(), lang).vatInfo}
              </p>
              
              {/* Stock Status */}
              <div className="flex items-center space-x-2">
                {getCurrentStock() > 0 ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600 font-medium">
                      {lang === 'de' ? 'Auf Lager' : 'In stock'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-600 font-medium">Nicht verfügbar</span>
                  </div>
                )}
              </div>
            </div>

            {/* Variant Selection */}
            {product.hasVariants && product.variants ? (
              <div className="space-y-4">
                {/* Dynamic Attribute Selection */}
                {Object.keys(product.variants.reduce((acc, variant) => ({ ...acc, ...variant.attributes }), {})).map(attributeName => (
                  <div key={attributeName}>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        {attributeName === 'Farbe' || attributeName === 'color' ? (lang === 'de' ? 'Farbe' : 'Color') :
                         attributeName === 'Größe' || attributeName === 'size' ? (lang === 'de' ? 'Größe' : 'Size') :
                         attributeName === 'fit' || attributeName === 'Passform' ? (lang === 'de' ? 'Passform' : 'Fit') :
                         attributeName}
                      </h3>
                      {/* Size chart button for fit/size attributes */}
                      {(attributeName === 'fit' || attributeName === 'Passform' || attributeName === 'Größe' || attributeName === 'size') && (
                        <button
                          onClick={() => setShowSizeChart(true)}
                          className="flex items-center gap-1 text-xs font-medium text-brand-800 hover:text-brand-600 border border-brand-800 hover:border-brand-600 px-2 py-1 rounded transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h18M3 18h18" />
                          </svg>
                          {lang === 'de' ? 'Größentabelle' : 'Size Chart'}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getAvailableAttributeValues(attributeName).map((value) => {
                        const isSelected = selectedAttributes[attributeName] === value
                        
                        return (
                          <button
                            key={value}
                            onClick={() => handleAttributeChange(attributeName, value)}
                            className={`px-4 py-2 border text-sm font-medium transition-colors ${
                              isSelected
                                ? 'border-gray-900 bg-gray-900 text-white'
                                : 'border-gray-300 text-gray-700 hover:border-gray-900'
                            }`}
                          >
                            {value}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                
                {/* Selected Variant Stock Status */}
                {selectedVariant && (
                  <div className="flex items-center gap-2">
                    {(() => {
                      const displayStock = Math.min(selectedVariant.stock, product?.stock || 0)
                      return (
                        <>
                          <div className={`w-2 h-2 rounded-full ${displayStock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={`text-sm font-medium ${displayStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {displayStock > 0
                              ? lang === 'de' ? 'Auf Lager' : 'In stock'
                              : lang === 'de' ? 'Nicht verfügbar' : 'Out of stock'
                            }
                          </span>
                          {displayStock === 0 && restockDate && (
                            <span className="text-xs text-gray-500">
                              · {lang === 'de' ? 'Wieder verfügbar' : 'Back'}: {new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : 'en-GB', { month: 'long', day: 'numeric' }).format(restockDate)}
                            </span>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            ) : (
              /* Legacy Size/Color Selection for products without variants */
              <div className="space-y-4">
                {/* Size Selection */}
                {product.sizes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.productDetail.size}</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2 border rounded-lg ${
                            selectedSize === size
                              ? 'border-primary-600 bg-primary-50 text-primary-600'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {product.colors.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.productDetail.color}</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-4 py-2 border rounded-lg capitalize ${
                            selectedColor === color
                              ? 'border-primary-600 bg-primary-50 text-primary-600'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.productDetail.quantity}</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(getCurrentStock(), quantity + 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  disabled={getCurrentStock() === 0}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart or Out of Stock Actions */}
            <div className="space-y-4">
              {showAddToCart ? (
                <>
                  <button
                    onClick={handleAddToCart}
                    disabled={product.hasVariants && !selectedVariant}
                    className="w-full bg-brand-800 hover:bg-brand-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
                  >
                    {product.hasVariants && !selectedVariant
                      ? 'Bitte Variante auswählen'
                      : `${formatPrice((getCurrentSalePrice() || getCurrentPrice()) * quantity)} - ${t.productDetail.addToCart}`
                    }
                  </button>
                  
                  {user && (
                    <button 
                      onClick={handleWishlistToggle}
                      disabled={wishlistLoading}
                      className={`w-full border font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                        isInWishlist
                          ? 'border-red-600 text-red-600 hover:bg-red-50'
                          : 'border-primary-600 text-primary-600 hover:bg-primary-50'
                      } ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <svg className="w-5 h-5" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>
                        {wishlistLoading 
                          ? 'Wird bearbeitet...' 
                          : isInWishlist 
                            ? 'Von Wunschliste entfernen' 
                            : t.productDetail.addToWishlist
                        }
                      </span>
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="text-red-600 font-semibold text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                    {lang === 'de' ? 'Diese Kombination ist zurzeit nicht vorrätig.' : 'This combination is currently out of stock.'}
                  </div>
                  <OutOfStockActions
                    productId={product.id}
                    variantId={selectedVariant?.id}
                    productName={product.name}
                    productNameEn={product.nameEn}
                    currentPrice={getCurrentSalePrice() || getCurrentPrice()}
                    currency={'EUR'}
                    expectedRestockDate={restockDate || undefined}
                    onBackorderClick={handleBackorderClick}
                  />
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div className="text-sm">
              {getCurrentStock() > 0 ? (
                <span className="text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t.productDetail.stockStatus.inStock}
                </span>
              ) : (
                <span className="text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {t.productDetail.stockStatus.outOfStock}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description — full width below images and selection */}
        <div className="mt-10 bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">{t.productDetail.description}</h3>
          <div className="text-gray-700 max-w-3xl">
            {renderFormattedDescription(lang === 'de' ? product.description : product.descriptionEn)}
          </div>
        </div>

        {/* Reviews Section */}
        {showReviews && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.productDetail.reviews}</h2>
            {product.reviews.length > 0 ? (
              <div className="space-y-6">
                {product.reviews.map((review) => (
                  <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="font-semibold text-gray-900">
                          {review.user.firstName || review.user.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    {review.title && (
                      <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                    )}
                    {review.comment && (
                      <p className="text-gray-700">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">{t.productDetail.noReviews}</p>
            )}
          </div>
        )}

        {/* Size Chart Modal */}
        {showSizeChart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowSizeChart(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowSizeChart(false)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-6">
                {lang === 'de' ? 'Größentabelle' : 'Size Chart'}
              </h3>
              <div className="space-y-6">
                {/* Slim Fit */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Slim Fit</h4>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-3 py-2 text-left font-medium">{lang === 'de' ? 'Größe' : 'Size'}</th>
                        <th className="border border-gray-200 px-3 py-2 text-center font-medium">{lang === 'de' ? 'Brust (cm)' : 'Chest (cm)'}</th>
                        <th className="border border-gray-200 px-3 py-2 text-center font-medium">{lang === 'de' ? 'Taille (cm)' : 'Waist (cm)'}</th>
                        <th className="border border-gray-200 px-3 py-2 text-center font-medium">{lang === 'de' ? 'Länge (cm)' : 'Length (cm)'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { size: 'S',   chest: '88–92',   waist: '74–78',   length: '68' },
                        { size: 'M',   chest: '92–96',   waist: '78–82',   length: '70' },
                        { size: 'L',   chest: '96–100',  waist: '82–86',   length: '72' },
                        { size: 'XL',  chest: '100–104', waist: '86–90',   length: '74' },
                        { size: '2XL', chest: '104–110', waist: '90–96',   length: '76' },
                      ].map(row => (
                        <tr key={row.size} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-3 py-2 font-medium">{row.size}</td>
                          <td className="border border-gray-200 px-3 py-2 text-center">{row.chest}</td>
                          <td className="border border-gray-200 px-3 py-2 text-center">{row.waist}</td>
                          <td className="border border-gray-200 px-3 py-2 text-center">{row.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Loose Fit */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Loose Fit</h4>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-3 py-2 text-left font-medium">{lang === 'de' ? 'Größe' : 'Size'}</th>
                        <th className="border border-gray-200 px-3 py-2 text-center font-medium">{lang === 'de' ? 'Brust (cm)' : 'Chest (cm)'}</th>
                        <th className="border border-gray-200 px-3 py-2 text-center font-medium">{lang === 'de' ? 'Taille (cm)' : 'Waist (cm)'}</th>
                        <th className="border border-gray-200 px-3 py-2 text-center font-medium">{lang === 'de' ? 'Länge (cm)' : 'Length (cm)'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { size: 'S',   chest: '96–100',  waist: '88–92',   length: '70' },
                        { size: 'M',   chest: '100–104', waist: '92–96',   length: '72' },
                        { size: 'L',   chest: '104–110', waist: '96–102',  length: '74' },
                        { size: 'XL',  chest: '110–116', waist: '102–108', length: '76' },
                        { size: '2XL', chest: '116–122', waist: '108–114', length: '78' },
                      ].map(row => (
                        <tr key={row.size} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-3 py-2 font-medium">{row.size}</td>
                          <td className="border border-gray-200 px-3 py-2 text-center">{row.chest}</td>
                          <td className="border border-gray-200 px-3 py-2 text-center">{row.waist}</td>
                          <td className="border border-gray-200 px-3 py-2 text-center">{row.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  {lang === 'de' ? 'Alle Maße in Zentimetern. Bei Unsicherheit empfehlen wir die größere Größe.' : 'All measurements in centimeters. When in doubt, we recommend the larger size.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Backorder Modal */}
        {product && (
          <BackorderModal
            isOpen={showBackorderModal}
            onClose={() => setShowBackorderModal(false)}
            product={{
              id: product.id,
              name: product.name,
              nameEn: product.nameEn,
              price: getCurrentPrice(),
              salePrice: getCurrentSalePrice(),
              currency: 'EUR',
              image: getCurrentImages().length > 0 ? getCurrentImages()[selectedImage] : undefined
            }}
            variant={selectedVariant ? {
              id: selectedVariant.id,
              sku: selectedVariant.sku,
              attributes: selectedVariant.attributes
            } : undefined}
            selectedSize={selectedSize}
            selectedColor={selectedColor}
            quantity={quantity}
            expectedFulfillmentDate={restockDate || undefined}
          />
        )}
      </div>
    </div>
  )
}