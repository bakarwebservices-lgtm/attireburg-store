// Media Management Utilities for Admin Portal

export interface MediaFile {
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
  tags?: string[]
}

export interface MediaFolder {
  id: string
  name: string
  parentId?: string
  createdAt: string
  fileCount: number
  path: string
}

export class MediaManager {
  private static instance: MediaManager
  private files: Map<string, MediaFile> = new Map()
  private folders: Map<string, MediaFolder> = new Map()

  static getInstance(): MediaManager {
    if (!MediaManager.instance) {
      MediaManager.instance = new MediaManager()
    }
    return MediaManager.instance
  }

  // File Operations
  async uploadFile(file: File, folderId?: string): Promise<MediaFile> {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fileName = this.sanitizeFileName(file.name)
    
    // In production, this would upload to cloud storage (AWS S3, Cloudinary, etc.)
    const url = URL.createObjectURL(file)
    
    const mediaFile: MediaFile = {
      id: fileId,
      name: fileName,
      originalName: file.name,
      url,
      type: this.getFileType(file.type),
      mimeType: file.type,
      size: file.size,
      dimensions: await this.getImageDimensions(file),
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'current-user', // Would get from auth context
      folder: folderId,
      tags: []
    }

    this.files.set(fileId, mediaFile)
    
    // Update folder file count
    if (folderId && this.folders.has(folderId)) {
      const folder = this.folders.get(folderId)!
      folder.fileCount += 1
      this.folders.set(folderId, folder)
    }

    return mediaFile
  }

  async uploadMultipleFiles(files: FileList, folderId?: string): Promise<MediaFile[]> {
    const uploadPromises = Array.from(files).map(file => this.uploadFile(file, folderId))
    return Promise.all(uploadPromises)
  }

  getFile(fileId: string): MediaFile | undefined {
    return this.files.get(fileId)
  }

  getAllFiles(folderId?: string): MediaFile[] {
    const allFiles = Array.from(this.files.values())
    if (folderId) {
      return allFiles.filter(file => file.folder === folderId)
    }
    return allFiles.filter(file => !file.folder) // Root files
  }

  searchFiles(query: string, type?: 'image' | 'document' | 'video'): MediaFile[] {
    const allFiles = Array.from(this.files.values())
    return allFiles.filter(file => {
      const matchesQuery = file.name.toLowerCase().includes(query.toLowerCase()) ||
                          file.originalName.toLowerCase().includes(query.toLowerCase()) ||
                          (file.alt && file.alt.toLowerCase().includes(query.toLowerCase())) ||
                          (file.tags && file.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
      
      const matchesType = !type || file.type === type
      
      return matchesQuery && matchesType
    })
  }

  deleteFile(fileId: string): boolean {
    const file = this.files.get(fileId)
    if (!file) return false

    // Update folder file count
    if (file.folder && this.folders.has(file.folder)) {
      const folder = this.folders.get(file.folder)!
      folder.fileCount = Math.max(0, folder.fileCount - 1)
      this.folders.set(file.folder, folder)
    }

    // In production, would also delete from cloud storage
    if (file.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url)
    }

    return this.files.delete(fileId)
  }

  deleteMultipleFiles(fileIds: string[]): number {
    let deletedCount = 0
    fileIds.forEach(fileId => {
      if (this.deleteFile(fileId)) {
        deletedCount++
      }
    })
    return deletedCount
  }

  updateFile(fileId: string, updates: Partial<MediaFile>): MediaFile | null {
    const file = this.files.get(fileId)
    if (!file) return null

    const updatedFile = { ...file, ...updates }
    this.files.set(fileId, updatedFile)
    return updatedFile
  }

  // Folder Operations
  createFolder(name: string, parentId?: string): MediaFolder {
    const folderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const parentPath = parentId ? this.folders.get(parentId)?.path || '' : ''
    const path = parentPath ? `${parentPath}/${name}` : name

    const folder: MediaFolder = {
      id: folderId,
      name,
      parentId,
      createdAt: new Date().toISOString(),
      fileCount: 0,
      path
    }

    this.folders.set(folderId, folder)
    return folder
  }

  getFolder(folderId: string): MediaFolder | undefined {
    return this.folders.get(folderId)
  }

  getAllFolders(parentId?: string): MediaFolder[] {
    const allFolders = Array.from(this.folders.values())
    return allFolders.filter(folder => folder.parentId === parentId)
  }

  deleteFolder(folderId: string, deleteFiles: boolean = false): boolean {
    const folder = this.folders.get(folderId)
    if (!folder) return false

    // Handle files in folder
    const filesInFolder = this.getAllFiles(folderId)
    if (deleteFiles) {
      filesInFolder.forEach(file => this.deleteFile(file.id))
    } else {
      // Move files to parent folder or root
      filesInFolder.forEach(file => {
        this.updateFile(file.id, { folder: folder.parentId })
      })
    }

    // Delete subfolders recursively
    const subfolders = this.getAllFolders(folderId)
    subfolders.forEach(subfolder => this.deleteFolder(subfolder.id, deleteFiles))

    return this.folders.delete(folderId)
  }

  moveFile(fileId: string, targetFolderId?: string): boolean {
    const file = this.files.get(fileId)
    if (!file) return false

    // Update old folder count
    if (file.folder && this.folders.has(file.folder)) {
      const oldFolder = this.folders.get(file.folder)!
      oldFolder.fileCount = Math.max(0, oldFolder.fileCount - 1)
      this.folders.set(file.folder, oldFolder)
    }

    // Update new folder count
    if (targetFolderId && this.folders.has(targetFolderId)) {
      const newFolder = this.folders.get(targetFolderId)!
      newFolder.fileCount += 1
      this.folders.set(targetFolderId, newFolder)
    }

    // Update file
    this.updateFile(fileId, { folder: targetFolderId })
    return true
  }

  // Utility Methods
  private sanitizeFileName(fileName: string): string {
    const extension = fileName.split('.').pop()
    const nameWithoutExt = fileName.replace(`.${extension}`, '')
    const sanitized = nameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    return `${sanitized}.${extension}`
  }

  private getFileType(mimeType: string): 'image' | 'document' | 'video' {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    return 'document'
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number } | undefined> {
    if (!file.type.startsWith('image/')) return undefined

    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = () => resolve(undefined)
      img.src = URL.createObjectURL(file)
    })
  }

  // Export/Import for backup
  exportData(): { files: MediaFile[]; folders: MediaFolder[] } {
    return {
      files: Array.from(this.files.values()),
      folders: Array.from(this.folders.values())
    }
  }

  importData(data: { files: MediaFile[]; folders: MediaFolder[] }): void {
    this.files.clear()
    this.folders.clear()
    
    data.folders.forEach(folder => this.folders.set(folder.id, folder))
    data.files.forEach(file => this.files.set(file.id, file))
  }

  // Statistics
  getStats(): {
    totalFiles: number
    totalFolders: number
    totalSize: number
    filesByType: Record<string, number>
  } {
    const files = Array.from(this.files.values())
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    const filesByType = files.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalFiles: files.length,
      totalFolders: this.folders.size,
      totalSize,
      filesByType
    }
  }
}

// Utility functions for file operations
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getFileIcon = (type: string, mimeType: string): string => {
  if (type === 'image') return '🖼️'
  if (type === 'video') return '🎥'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦'
  return '📁'
}

export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/')
}

export const isVideoFile = (mimeType: string): boolean => {
  return mimeType.startsWith('video/')
}

export const isDocumentFile = (mimeType: string): boolean => {
  return !isImageFile(mimeType) && !isVideoFile(mimeType)
}

// Singleton instance
export const mediaManager = MediaManager.getInstance()