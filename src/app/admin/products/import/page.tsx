'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import DashboardLayout from '@/components/DashboardLayout'

interface ImportResult {
  success: number
  errors: number
  warnings: number
  details: Array<{
    row: number
    type: 'success' | 'error' | 'warning'
    message: string
    data?: any
  }>
}

export default function ProductImport() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const t = translations[lang]
  
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [previewData, setPreviewData] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setStep('preview')
    
    // Simulate CSV parsing
    const mockPreviewData = [
      {
        row: 1,
        name: 'Premium Wollpullover',
        nameEn: 'Premium Wool Sweater',
        sku: 'ATB-PULL-002',
        price: 149.99,
        category: 'pullover',
        stock: 25,
        status: 'published'
      },
      {
        row: 2,
        name: 'Winterjacke Pro',
        nameEn: 'Winter Jacket Pro',
        sku: 'ATB-JACK-002',
        price: 299.99,
        category: 'jacken',
        stock: 12,
        status: 'published'
      },
      {
        row: 3,
        name: 'Hoodie Comfort',
        nameEn: 'Comfort Hoodie',
        sku: 'ATB-HOOD-002',
        price: 99.99,
        category: 'hoodies',
        stock: 18,
        status: 'draft'
      }
    ]
    setPreviewData(mockPreviewData)
  }

  const handleImport = async () => {
    setImporting(true)
    
    // Simulate import process
    setTimeout(() => {
      const result: ImportResult = {
        success: 2,
        errors: 1,
        warnings: 0,
        details: [
          {
            row: 1,
            type: 'success',
            message: 'Produkt erfolgreich importiert',
            data: { name: 'Premium Wollpullover', sku: 'ATB-PULL-002' }
          },
          {
            row: 2,
            type: 'success',
            message: 'Produkt erfolgreich importiert',
            data: { name: 'Winterjacke Pro', sku: 'ATB-JACK-002' }
          },
          {
            row: 3,
            type: 'error',
            message: 'SKU bereits vorhanden',
            data: { name: 'Hoodie Comfort', sku: 'ATB-HOOD-002' }
          }
        ]
      }
      
      setImportResult(result)
      setStep('result')
      setImporting(false)
    }, 3000)
  }

  const downloadTemplate = () => {
    const csvContent = `name,nameEn,sku,price,salePrice,category,stock,status,featured,description,descriptionEn
Premium Wollpullover,Premium Wool Sweater,ATB-PULL-001,129.99,,pullover,15,published,true,"Hochwertiger Wollpullover","High-quality wool sweater"
Winterjacke Alpine,Alpine Winter Jacket,ATB-JACK-001,249.99,199.99,jacken,8,published,false,"Warme Winterjacke","Warm winter jacket"`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product-import-template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportProducts = () => {
    // Simulate product export
    const csvContent = `name,nameEn,sku,price,salePrice,category,stock,status,featured,description,descriptionEn
Premium Wollpullover Classic,Premium Wool Sweater Classic,ATB-PULL-001,129.99,,pullover,15,published,true,"Klassischer Wollpullover aus hochwertigen Materialien","Classic wool sweater made from high-quality materials"
Winterjacke Alpine Pro,Alpine Pro Winter Jacket,ATB-JACK-001,249.99,199.99,jacken,8,published,false,"Professionelle Winterjacke für extreme Bedingungen","Professional winter jacket for extreme conditions"`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

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
              Produkte Import/Export
            </h1>
            <p className="text-gray-600 mt-1">
              Produkte in großen Mengen importieren oder exportieren
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportProducts}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Produkte exportieren
            </button>
            <button
              onClick={() => router.push('/admin/products')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Zurück zu Produkten
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step === 'upload' ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'upload' ? 'bg-primary-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">Datei hochladen</span>
            </div>
            <div className="flex-1 h-px bg-gray-200 mx-4"></div>
            <div className={`flex items-center ${step === 'preview' ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'preview' ? 'bg-primary-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Vorschau</span>
            </div>
            <div className="flex-1 h-px bg-gray-200 mx-4"></div>
            <div className={`flex items-center ${step === 'result' ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'result' ? 'bg-primary-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium">Ergebnis</span>
            </div>
          </div>
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-6">
            {/* Template Download */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                CSV-Vorlage herunterladen
              </h3>
              <p className="text-blue-800 mb-4">
                Laden Sie unsere CSV-Vorlage herunter, um sicherzustellen, dass Ihre Daten im richtigen Format vorliegen.
              </p>
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Vorlage herunterladen
              </button>
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                CSV-Datei hochladen
              </h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  CSV-Datei hier ablegen
                </h4>
                <p className="text-gray-600 mb-4">
                  oder klicken Sie hier, um eine Datei auszuwählen
                </p>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Datei auswählen
                </button>
              </div>

              {/* Format Requirements */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Formatanforderungen:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• CSV-Format mit Komma als Trennzeichen</li>
                  <li>• UTF-8 Kodierung</li>
                  <li>• Erste Zeile muss Spaltenüberschriften enthalten</li>
                  <li>• Pflichtfelder: name, sku, price, category</li>
                  <li>• Maximale Dateigröße: 10MB</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Datenvorschau
                </h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setStep('upload')}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Zurück
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {importing ? 'Importiere...' : 'Import starten'}
                  </button>
                </div>
              </div>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800">
                  <strong>{previewData.length} Produkte</strong> gefunden. Überprüfen Sie die Daten vor dem Import.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zeile</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preis</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lager</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((item) => (
                      <tr key={item.row}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.row}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">€{item.price}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{item.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.stock}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Result Step */}
        {step === 'result' && importResult && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Import-Ergebnis
              </h3>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">Erfolgreich</p>
                      <p className="text-2xl font-bold text-green-900">{importResult.success}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-900">Fehler</p>
                      <p className="text-2xl font-bold text-red-900">{importResult.errors}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-900">Warnungen</p>
                      <p className="text-2xl font-bold text-yellow-900">{importResult.warnings}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Details:</h4>
                {importResult.details.map((detail, index) => (
                  <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
                    detail.type === 'success' ? 'bg-green-50' :
                    detail.type === 'error' ? 'bg-red-50' : 'bg-yellow-50'
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                      detail.type === 'success' ? 'bg-green-100' :
                      detail.type === 'error' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      {detail.type === 'success' && (
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {detail.type === 'error' && (
                        <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {detail.type === 'warning' && (
                        <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        detail.type === 'success' ? 'text-green-900' :
                        detail.type === 'error' ? 'text-red-900' : 'text-yellow-900'
                      }`}>
                        Zeile {detail.row}: {detail.message}
                      </p>
                      {detail.data && (
                        <p className={`text-xs mt-1 ${
                          detail.type === 'success' ? 'text-green-700' :
                          detail.type === 'error' ? 'text-red-700' : 'text-yellow-700'
                        }`}>
                          {detail.data.name} ({detail.data.sku})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setStep('upload')
                    setFile(null)
                    setImportResult(null)
                    setPreviewData([])
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Neuen Import starten
                </button>
                <button
                  onClick={() => router.push('/admin/products')}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Zu Produkten
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}