'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  nameEn: string
  price: number
  salePrice?: number
  images: string[]
  category: string
  onSale: boolean
  stock: number
}

export default function Products() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('createdAt|desc')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => { fetchProducts() }, [category, sort, search, page])

  const fetchProducts = async () => {
    setLoading(true)
    const [sortBy, sortOrder] = sort.split('|')
    const params = new URLSearchParams({
      page: page.toString(), limit: '12', sortBy, sortOrder,
      ...(category && { category }),
      ...(search && { search }),
    })
    try {
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      setProducts(data.products || [])
      setTotalPages(data.pagination?.pages || 0)
      setTotal(data.pagination?.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)

  const CATEGORIES = [
    { value: '', label: t.products.allCategories },
    { value: 'pullover', label: t.products.categories.pullover },
    { value: 'jacken', label: t.products.categories.jacken },
    { value: 'hoodies', label: t.products.categories.hoodies },
    { value: 'shirts', label: t.products.categories.shirts },
  ]

  const SORT_OPTIONS = [
    { value: 'createdAt|desc', label: t.products.newest },
    { value: 'price|asc', label: `${t.products.price}: ${t.products.ascending}` },
    { value: 'price|desc', label: `${t.products.price}: ${t.products.descending}` },
    { value: 'name|asc', label: `${t.products.name} A–Z` },
  ]

  return (
    <div className="bg-white min-h-screen">

      <div className="border-b border-gray-200 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">{t.products.title}</h1>
          {!loading && <p className="text-sm text-gray-500 mt-1">{total} {t.products.productsFound}</p>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex gap-1 overflow-x-auto pb-1 flex-1">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => { setCategory(c.value); setPage(1) }}
                className={`whitespace-nowrap px-4 py-2 text-sm font-medium border transition-colors ${
                  category === c.value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-900 hover:text-gray-900'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 shrink-0">
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder={t.products.searchPlaceholder}
              className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900 w-40"
            />
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900 bg-white"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-100 mb-3" />
                <div className="h-3.5 bg-gray-100 rounded mb-2 w-3/4" />
                <div className="h-3.5 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">{t.products.noProducts.title}</p>
            <button onClick={() => { setCategory(''); setSearch(''); setPage(1) }} className="text-sm underline text-gray-700">
              {t.products.noProducts.resetFilters}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {products.map(product => {
              const name = lang === 'de' ? product.name : (product.nameEn || product.name)
              const pct = product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : 0
              return (
                <Link key={product.id} href={`/products/${product.id}`} className="group">
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-3">
                    {product.images[0] && (
                      <Image
                        src={product.images[0]}
                        alt={name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    )}
                    {product.onSale && pct > 0 && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 tracking-wide">
                        SAVE {pct}%
                      </span>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-white/60 flex items-end justify-center pb-4">
                        <span className="text-xs font-semibold text-gray-700 bg-white px-3 py-1 border border-gray-300">
                          {t.products.outOfStock.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{product.category}</p>
                  <p className="text-sm font-medium text-gray-900 truncate mb-1">{name}</p>
                  <div className="flex items-center gap-2">
                    {product.salePrice ? (
                      <>
                        <span className="text-sm font-semibold text-red-600">{fmt(product.salePrice)}</span>
                        <span className="text-xs text-gray-400 line-through">{fmt(product.price)}</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-800">{fmt(product.price)}</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1 mt-12">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-2 border border-gray-300 text-sm disabled:opacity-40 hover:border-gray-900 transition-colors">
              {t.products.pagination.previous}
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-2 border text-sm transition-colors ${page === i + 1 ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 hover:border-gray-900'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-2 border border-gray-300 text-sm disabled:opacity-40 hover:border-gray-900 transition-colors">
              {t.products.pagination.next}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
