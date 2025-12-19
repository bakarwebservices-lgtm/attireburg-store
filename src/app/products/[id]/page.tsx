'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/components/ClientLayout'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { translations } from '@/lib/translations'
import { formatPriceWithVAT } from '@/lib/vat'
import OutOfStockActions from '@/components/backorder/OutOfStockActions'
import BackorderModal from '@/components/backorder/BackorderModal'
import { useRestockDate } from '@/hooks/useRestockDate'

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

export default function ProductDetail() {
  const params = useParams()
  const { lang } = useLanguage()
  const { addItem } = useCart()
  const { user } = useAuth()
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
  
  // Get restock date for current product/variant
  const { restockDate } = useRestockDate(
    product?.id || '',
    selectedVariant?.id
  )

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id])

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
        
        // Initialize selections
        if (data.sizes?.length > 0) setSelectedSize(data.sizes[0])
        if (data.colors?.length > 0) setSelectedColor(data.colors[0])
        
        // Initialize variant selection if product has variants
        if (data.hasVariants && data.variants?.length > 0) {
          // Set first available variant as default
          const firstVariant = data.variants.find((v: ProductVariant) => v.isActive && v.stock > 0)
          if (firstVariant) {
            setSelectedVariant(firstVariant)
            setSelectedAttributes(firstVariant.attributes)
            // Update size/color based on variant attributes
            if (firstVariant.attributes.Größe || firstVariant.attributes.Size) {
              setSelectedSize(firstVariant.attributes.Größe || firstVariant.attributes.Size)
            }
            if (firstVariant.attributes.Farbe || firstVariant.attributes.Color) {
              setSelectedColor(firstVariant.attributes.Farbe || firstVariant.attributes.Color)
            }
          }
        }
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
    const newAttributes = { ...selectedAttributes, [attributeName]: value }
    setSelectedAttributes(newAttributes)
    
    // Update legacy state for backward compatibility
    if (attributeName === 'Größe' || attributeName === 'Size') {
      setSelectedSize(value)
    }
    if (attributeName === 'Farbe' || attributeName === 'Color') {
      setSelectedColor(value)
    }
    
    // Find matching variant
    const variant = findVariantByAttributes(newAttributes)
    setSelectedVariant(variant || null)
    
    // Update selected image if variant has specific images
    if (variant?.images && variant.images.length > 0) {
      setSelectedImage(0) // Reset to first image of variant
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
    if (selectedVariant) return selectedVariant.stock
    return product?.stock || 0
  }

  // Get current images (variant images or product images)
  const getCurrentImages = () => {
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
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
        alert('Bitte wählen Sie eine Variante aus')
        return
      }
    } else {
      // Legacy size/color validation
      if (product.sizes && product.sizes.length > 0 && !selectedSize) {
        alert(t.productDetail.selectSize)
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

      alert(t.productDetail.addedToCart)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Fehler beim Hinzufügen zum Warenkorb')
    }
  }

  const handleBackorderClick = () => {
    setShowBackorderModal(true)
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-primary-600">{t.productDetail.breadcrumb.home}</Link></li>
            <li>/</li>
            <li><Link href="/products" className="hover:text-primary-600">{t.productDetail.breadcrumb.products}</Link></li>
            <li>/</li>
            <li className="text-gray-900">{lang === 'de' ? product.name : product.nameEn}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm">
              {getCurrentImages().length > 0 ? (
                <img
                  src={getCurrentImages()[selectedImage]}
                  alt={lang === 'de' ? product.name : product.nameEn}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  {t.common.noImage}
                </div>
              )}
            </div>
            
            {/* Image Thumbnails */}
            {getCurrentImages().length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {getCurrentImages().map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded overflow-hidden border-2 ${
                      selectedImage === index ? 'border-primary-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${lang === 'de' ? product.name : product.nameEn} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
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
                  <span className="text-3xl font-bold text-primary-700">
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
                      {getCurrentStock() > 10 ? 'Auf Lager' : `Nur noch ${getCurrentStock()} verfügbar`}
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

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.productDetail.description}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'de' ? product.description : product.descriptionEn}
              </p>
            </div>

            {/* Variant Selection */}
            {product.hasVariants && product.variants ? (
              <div className="space-y-4">
                {/* Dynamic Attribute Selection */}
                {Object.keys(product.variants.reduce((acc, variant) => ({ ...acc, ...variant.attributes }), {})).map(attributeName => (
                  <div key={attributeName}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {attributeName === 'Farbe' ? 'Farbe' : 
                       attributeName === 'Color' ? 'Color' :
                       attributeName === 'Größe' ? 'Größe' :
                       attributeName === 'Size' ? 'Size' : attributeName}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {getAvailableAttributeValues(attributeName).map((value) => {
                        const isSelected = selectedAttributes[attributeName] === value
                        const testAttributes = { ...selectedAttributes, [attributeName]: value }
                        const testVariant = findVariantByAttributes(testAttributes)
                        const isAvailable = testVariant && testVariant.isActive && testVariant.stock > 0
                        
                        return (
                          <button
                            key={value}
                            onClick={() => handleAttributeChange(attributeName, value)}
                            disabled={!isAvailable}
                            className={`px-4 py-2 border rounded-lg capitalize transition-colors relative ${
                              isSelected
                                ? 'border-primary-600 bg-primary-50 text-primary-600'
                                : isAvailable
                                ? 'border-gray-300 hover:border-gray-400'
                                : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title={!isAvailable ? 'Nicht verfügbar' : `${testVariant?.stock || 0} verfügbar`}
                          >
                            {value}
                            {!isAvailable && (
                              <span className="ml-1 text-xs">✕</span>
                            )}
                            {isAvailable && testVariant && testVariant.stock <= 3 && testVariant.stock > 0 && (
                              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {testVariant.stock}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                
                {/* Selected Variant Info */}
                {selectedVariant && (
                  <div className={`border rounded-lg p-3 ${
                    selectedVariant.stock > 0 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          selectedVariant.stock > 0 ? 'text-blue-900' : 'text-red-900'
                        }`}>
                          Ausgewählte Variante: {Object.entries(selectedVariant.attributes).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className={`text-xs ${
                            selectedVariant.stock > 0 ? 'text-blue-700' : 'text-red-700'
                          }`}>
                            SKU: {selectedVariant.sku}
                          </p>
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${
                              selectedVariant.stock > 0 ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className={`text-xs font-medium ${
                              selectedVariant.stock > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {selectedVariant.stock > 0 
                                ? `${selectedVariant.stock} verfügbar`
                                : 'Nicht verfügbar'
                              }
                            </span>
                          </div>
                        </div>
                        {selectedVariant.stock === 0 && restockDate && (
                          <p className="text-xs text-gray-600 mt-1">
                            Voraussichtlich wieder verfügbar: {new Intl.DateTimeFormat('de-DE', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }).format(restockDate)}
                          </p>
                        )}
                      </div>
                    </div>
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
                <span className="text-sm text-gray-600 ml-4">
                  {getCurrentStock()} {t.productDetail.inStock}
                </span>
              </div>
            </div>

            {/* Add to Cart or Out of Stock Actions */}
            <div className="space-y-4">
              {getCurrentStock() > 0 ? (
                <>
                  <button
                    onClick={handleAddToCart}
                    disabled={product.hasVariants && !selectedVariant}
                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
                  >
                    {product.hasVariants && !selectedVariant
                      ? 'Bitte Variante auswählen'
                      : `${formatPrice((getCurrentSalePrice() || getCurrentPrice()) * quantity)} - ${t.productDetail.addToCart}`
                    }
                  </button>
                  
                  {user && (
                    <button className="w-full border border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold py-3 px-6 rounded-lg transition-colors">
                      {t.productDetail.addToWishlist}
                    </button>
                  )}
                </>
              ) : (
                <OutOfStockActions
                  productId={product.id}
                  variantId={selectedVariant?.id}
                  productName={product.name}
                  productNameEn={product.nameEn}
                  currentPrice={getCurrentSalePrice() || getCurrentPrice()}
                  currency={product.currency || 'EUR'}
                  expectedRestockDate={restockDate || undefined}
                  onBackorderClick={handleBackorderClick}
                />
              )}
            </div>

            {/* Stock Status */}
            <div className="text-sm">
              {product.stock > 0 ? (
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
              currency: product.currency || 'EUR',
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