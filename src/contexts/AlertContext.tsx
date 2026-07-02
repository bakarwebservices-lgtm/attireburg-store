'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  isAlert?: boolean
}

interface AlertContextType {
  alert: (message: string, title?: string) => void
  confirm: (options: ConfirmOptions) => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)

  const alertUser = useCallback((message: string, title = 'Attireburg') => {
    setOptions({
      title,
      message,
      confirmText: 'OK',
      isAlert: true
    })
    setModalOpen(true)
  }, [])

  const confirmUser = useCallback((opts: ConfirmOptions) => {
    setOptions({
      title: opts.title || 'Bestätigung erforderlich',
      message: opts.message,
      confirmText: opts.confirmText || 'Ja',
      cancelText: opts.cancelText || 'Abbrechen',
      onConfirm: opts.onConfirm,
      onCancel: opts.onCancel,
      isAlert: false
    })
    setModalOpen(true)
  }, [])

  // Intercept native window.alert globally on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.alert = (message: string) => {
        alertUser(String(message))
      }
    }
  }, [alertUser])

  const handleConfirm = () => {
    setModalOpen(false)
    if (options?.onConfirm) options.onConfirm()
  }

  const handleCancel = () => {
    setModalOpen(false)
    if (options?.onCancel) options.onCancel()
  }

  return (
    <AlertContext.Provider value={{ alert: alertUser, confirm: confirmUser }}>
      {children}
      
      {/* Premium Themed Modal Backdrop */}
      {modalOpen && options && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-gray-900">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 flex flex-col gap-4 animate-scale-up">
            {/* Title / Header */}
            {options.title && (
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                {options.title}
              </h3>
            )}
            
            {/* Message Body */}
            <p className="text-sm text-gray-600 leading-relaxed">
              {options.message}
            </p>
            
            {/* Controls */}
            <div className="flex gap-3 mt-2 justify-end">
              {!options.isAlert && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
                >
                  {options.cancelText}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-xl transition-all shadow-md shadow-primary-500/10"
              >
                {options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider')
  }
  return context
}
