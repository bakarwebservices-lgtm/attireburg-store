'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/components/ClientLayout'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { translations } from '@/lib/translations'
import { formatPriceWithVAT } from '@/lib/vat'

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
        if (data.sizes?.length > 0) setSelectedSize(data.sizes[0])
        if (data.colors?.length > 0) setSelectedColor(data.colors[0])
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const handleAddToCart = () => {
    if (!product) return
    
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert(t.productDetail.selectSize)
      return
    }

    addItem({
      productId: product.id,
      name: product.name,
      nameEn: product.nameEn,
      price: product.price,
      salePrice: product.salePrice,
      image: product.images && product.images.length > 0 ? product.images[0] : '',
      size: selectedSize,
      color: selectedColor,
      quantity,
      stock: product.stock
    })

    alert(t.productDetail.addedToCart)
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
              {product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
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
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
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
                {product.onSale && product.salePrice ? (
                  <>
                    <span className="text-3xl font-bold text-red-600">
                      {formatPriceWithVAT(product.salePrice, lang).price}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.price)}
                    </span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-semibold">
                      {t.productDetail.sale}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-primary-700">
                    {formatPriceWithVAT(product.price, lang).price}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {formatPriceWithVAT(product.onSale && product.salePrice ? product.salePrice : product.price, lang).vatInfo}
              </p>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.productDetail.description}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'de' ? product.description : product.descriptionEn}
              </p>
            </div>

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
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
                <span className="text-sm text-gray-600 ml-4">
                  {product.stock} {t.productDetail.inStock}
                </span>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="space-y-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
              >
                {product.stock === 0 ? t.productDetail.outOfStock : `${formatPrice((product.salePrice || product.price) * quantity)} - ${t.productDetail.addToCart}`}
              </button>
              
              {user && (
                <button className="w-full border border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold py-3 px-6 rounded-lg transition-colors">
                  {t.productDetail.addToWishlist}
                </button>
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
      </div>
    </div>
  )
}