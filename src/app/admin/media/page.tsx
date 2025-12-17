'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/ClientLayout'
import { translations } from '@/lib/translations'
import DashboardLayout from '@/components/DashboardLayout'

interface MediaFile {
  id: string
  name: string
  originalName: string
  url: string
  type: 'image' | 'document' | 'video'
  mimeType: string
  size: number
  dimensions?: {
    width: number
    height: number
  }
  uploadedAt: string
  uploadedBy: string
  alt?: string
  caption?: string
  folder?: string
}

interface MediaFolder {
  id: string
  name: string
  parentId?: string
  createdAt: string
  fileCount: number
}

export default function MediaLibrary() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const t = translations[lang]
  
  const [files, setFiles] = useState<MediaFile[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'image' | 'document' | 'video'>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user || !user.isAdmin) {
      router.push('/admin')
      return
    }
    
    loadMediaLibrary()
  }, [user, router, currentFolder])

  const loadMediaLibrary = () => {
    // Simulate loading media files
    setTimeout(() => {
      setFolders([
        {
          id: '1',
          name: 'Produktbilder',
          createdAt: '2024-01-15T10:00:00Z',
          fileCount: 25
        },
        {
          id: '2',
          name: 'Kategoriebilder',
          createdAt: '2024-01-10T14:30:00Z',
          fileCount: 8
        },
        {
          id: '3',
          name: 'Banner',
          createdAt: '2024-01-05T09:15:00Z',
          fileCount: 12
        },
        {
          id: '4',
          name: 'Dokumente',
          createdAt: '2024-01-01T16:45:00Z',
          fileCount: 5
        }
      ])

      setFiles([
        {
          id: '1',
          name: 'premium-pullover-main.jpg',
          originalName: 'Premium Pullover Hauptbild.jpg',
          url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop',
          type: 'image',
          mimeType: 'image/jpeg',
          size: 245760,
          dimensions: { width: 800, height: 800 },
          uploadedAt: '2024-01-20T10:30:00Z',
          uploadedBy: 'Admin User',
          alt: 'Premium Wollpullover Hauptbild',
          folder: currentFolder || undefined
        },
        {
          id: '2',
          name: 'winter-jacket-detail.jpg',
          originalName: 'Winterjacke Detail.jpg',
          url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=800&fit=crop',
          type: 'image',
          mimeType: 'image/jpeg',
          size: 312450,
          dimensions: { width: 800, height: 800 },
          uploadedAt: '2024-01-19T15:20:00Z',
          uploadedBy: 'Admin User',
          alt: 'Winterjacke Detailansicht',
          folder: currentFolder || undefined
        },
        {
          id: '3',
          name: 'hoodie-lifestyle.jpg',
          originalName: 'Hoodie Lifestyle.jpg',
          url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop',
          type: 'image',
          mimeType: 'image/jpeg',
          size: 189320,
          dimensions: { width: 800, height: 800 },
          uploadedAt: '2024-01-18T11:45:00Z',
          uploadedBy: 'Admin User',
          alt: 'Hoodie Lifestyle Aufnahme',
          folder: currentFolder || undefined
        },
        {
          id: '4',
          name: 'size-guide.pdf',
          originalName: 'Größentabelle.pdf',
          url: '/documents/size-guide.pdf',
          type: 'document',
          mimeType: 'application/pdf',
          size: 156780,
          uploadedAt: '2024-01-17T09:30:00Z',
          uploadedBy: 'Admin User',
          folder: currentFolder || undefined
        },
        {
          id: '5',
          name: 'product-video.mp4',
          originalName: 'Produktvideo.mp4',
          url: '/videos/product-showcase.mp4',
          type: 'video',
          mimeType: 'video/mp4',
          size: 15678900,
          uploadedAt: '2024-01-16T14:15:00Z',
          uploadedBy: 'Admin User',
          folder: currentFolder || undefined
        }
      ])
      
      setLoading(false)
    }, 1000)
  }

  const handleFileUpload = async (uploadedFiles: FileList) => {
    setUploading(true)
    
    // Simulate file upload
    const newFiles: MediaFile[] = []
    
    Array.from(uploadedFiles).forEach((file, index) => {
      const fileId = `upload-${Date.now()}-${index}`
      const url = URL.createObjectURL(file)
      
      newFiles.push({
        id: fileId,
        name: file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '-'),
        originalName: file.name,
        url,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 'document',
        mimeType: file.type,
        size: file.size,
        dimensions: file.type.startsWith('image/') ? { width: 800, height: 600 } : undefined,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.name || 'Admin User',
        folder: currentFolder || undefined
      })
    })
    
    setTimeout(() => {
      setFiles(prev => [...newFiles, ...prev])
      setUploading(false)
      setShowUploadModal(false)
    }, 2000)
  }

  const createFolder = () => {
    if (!newFolderName.trim()) return
    
    const newFolder: MediaFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      parentId: currentFolder || undefined,
      createdAt: new Date().toISOString(),
      fileCount: 0
    }
    
    setFolders(prev => [...prev, newFolder])
    setNewFolderName('')
    setShowFolderModal(false)
  }

  const deleteSelectedFiles = () => {
    if (confirm(`${selectedFiles.length} Datei(en) löschen?`)) {
      setFiles(prev => prev.filter(file => !selectedFiles.includes(file.id)))
      setSelectedFiles([])
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string, mimeType: string) => {
    if (type === 'image') return '🖼️'
    if (type === 'video') return '🎥'
    if (mimeType === 'application/pdf') return '📄'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    return '📁'
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || file.type === filterType
    const matchesFolder = currentFolder ? file.folder === currentFolder : !file.folder
    
    return matchesSearch && matchesType && matchesFolder
  })

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
              Mediathek
            </h1>
            <p className="text-gray-600 mt-1">
              Verwalten Sie Ihre Bilder, Videos und Dokumente
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFolderModal(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Neuer Ordner
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Dateien hochladen
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Dateien suchen..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="all">Alle Dateien</option>
                <option value="image">Bilder</option>
                <option value="video">Videos</option>
                <option value="document">Dokumente</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              {/* Selected Actions */}
              {selectedFiles.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedFiles.length} ausgewählt
                  </span>
                  <button
                    onClick={deleteSelectedFiles}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Löschen
                  </button>
                </div>
              )}

              {/* View Mode */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-600'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-600'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        {currentFolder && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={() => setCurrentFolder(null)}
              className="hover:text-primary-600"
            >
              Mediathek
            </button>
            <span>/</span>
            <span className="text-gray-900">
              {folders.find(f => f.id === currentFolder)?.name}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Lade Mediathek...</p>
            </div>
          ) : (
            <>
              {/* Folders */}
              {!currentFolder && folders.length > 0 && (
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Ordner</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setCurrentFolder(folder.id)}
                        className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <div className="text-3xl mb-2">📁</div>
                        <span className="text-sm font-medium text-gray-900 text-center">
                          {folder.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {folder.fileCount} Dateien
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              <div className="p-6">
                {filteredFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📁</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Keine Dateien gefunden
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm ? 'Versuchen Sie einen anderen Suchbegriff' : 'Laden Sie Ihre ersten Dateien hoch'}
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Dateien hochladen
                      </button>
                    )}
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`relative group border-2 rounded-lg overflow-hidden cursor-pointer transition-colors ${
                          selectedFiles.includes(file.id)
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedFiles(prev =>
                            prev.includes(file.id)
                              ? prev.filter(id => id !== file.id)
                              : [...prev, file.id]
                          )
                        }}
                      >
                        <div className="aspect-square bg-gray-100 flex items-center justify-center">
                          {file.type === 'image' ? (
                            <img
                              src={file.url}
                              alt={file.alt || file.originalName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-4xl">
                              {getFileIcon(file.type, file.mimeType)}
                            </div>
                          )}
                        </div>
                        
                        <div className="p-2">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>

                        {/* Selection Checkbox */}
                        <div className="absolute top-2 left-2">
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file.id)}
                            onChange={() => {}}
                            className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center space-x-4 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedFiles.includes(file.id)
                            ? 'bg-primary-50 border border-primary-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setSelectedFiles(prev =>
                            prev.includes(file.id)
                              ? prev.filter(id => id !== file.id)
                              : [...prev, file.id]
                          )
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => {}}
                          className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500"
                        />
                        
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          {file.type === 'image' ? (
                            <img
                              src={file.url}
                              alt={file.alt || file.originalName}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <span className="text-xl">
                              {getFileIcon(file.type, file.mimeType)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        
                        {file.dimensions && (
                          <div className="text-xs text-gray-500">
                            {file.dimensions.width} × {file.dimensions.height}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Dateien hochladen
              </h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />
                
                <div className="text-4xl mb-4">📁</div>
                <p className="text-gray-600 mb-4">
                  Dateien hier ablegen oder klicken zum Auswählen
                </p>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {uploading ? 'Lade hoch...' : 'Dateien auswählen'}
                </button>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Folder Modal */}
        {showFolderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Neuen Ordner erstellen
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordnername
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  placeholder="z.B. Produktbilder"
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowFolderModal(false)
                    setNewFolderName('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={createFolder}
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  Erstellen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}