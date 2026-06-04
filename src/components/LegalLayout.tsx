'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/ClientLayout'

interface Props {
  children: React.ReactNode
  updatedDate?: string
  pageId: string // 'imprint' | 'privacy' | 'terms'
}

export default function LegalLayout({ children, updatedDate, pageId }: Props) {
  const { lang } = useLanguage()
  const [dbContent, setDbContent] = useState<string | null>(null)
  const [loadingDb, setLoadingDb] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/legal?id=${pageId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.contentDe || data?.contentEn) {
          setDbContent(lang === 'de' ? data.contentDe : data.contentEn)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDb(false))
  }, [pageId, lang])

  const links = [
    { href: '/imprint', labelDe: 'Impressum', labelEn: 'Imprint' },
    { href: '/privacy', labelDe: 'Datenschutz', labelEn: 'Privacy' },
    { href: '/terms', labelDe: 'AGB', labelEn: 'Terms' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

        {/* Breadcrumb / page nav */}
        <nav className="flex gap-4 mb-8 text-sm border-b border-gray-200 pb-4">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="text-gray-500 hover:text-gray-900 transition-colors font-medium"
            >
              {lang === 'de' ? l.labelDe : l.labelEn}
            </Link>
          ))}
        </nav>

        {/* Content — DB overrides hardcoded if present */}
        <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 legal-content">
          {loadingDb ? (
            // Show hardcoded content while loading DB (no flash)
            children
          ) : dbContent ? (
            // DB content takes over — render as plain text with paragraphs
            <div>
              {dbContent.split('\n\n').map((para, i) => (
                <p key={i} style={{ marginBottom: '1rem', color: '#374151', lineHeight: '1.75' }}>
                  {para.split('\n').map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < para.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          ) : (
            // No DB content — use hardcoded
            children
          )}
        </div>

        {/* Last updated */}
        {updatedDate && (
          <p className="text-center text-xs text-gray-400 mt-6">
            {lang === 'de' ? `Stand: ${updatedDate}` : `Last updated: ${updatedDate}`}
          </p>
        )}

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            ← {lang === 'de' ? 'Zurück zur Startseite' : 'Back to home'}
          </Link>
        </div>
      </div>
    </div>
  )
}
