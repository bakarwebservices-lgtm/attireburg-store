import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white px-4 text-center">
      <p className="text-7xl font-bold text-brand-800 mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Seite nicht gefunden</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        Die gesuchte Seite existiert nicht oder wurde verschoben.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/"
          className="bg-brand-800 hover:bg-brand-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors">
          Zur Startseite
        </Link>
        <Link href="/products"
          className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-8 py-3 rounded-lg transition-colors">
          Produkte ansehen
        </Link>
      </div>
    </div>
  )
}
