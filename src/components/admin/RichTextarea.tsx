'use client'
import { useRef } from 'react'

interface RichTextareaProps {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  className?: string
}

export default function RichTextarea({ value, onChange, rows = 5, placeholder, className = '' }: RichTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const wrap = (before: string, after: string) => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end)
    const newValue = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(newValue)
    // Restore cursor after state update
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const tools = [
    { label: 'B', title: 'Bold', action: () => wrap('**', '**'), className: 'font-bold' },
    { label: 'I', title: 'Italic', action: () => wrap('_', '_'), className: 'italic' },
    { label: 'U', title: 'Underline', action: () => wrap('<u>', '</u>'), className: 'underline' },
    { label: '• List', title: 'Bullet list', action: () => wrap('\n- ', ''), className: '' },
    { label: '1. List', title: 'Numbered list', action: () => wrap('\n1. ', ''), className: '' },
  ]

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-600 focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        {tools.map(tool => (
          <button
            key={tool.title}
            type="button"
            title={tool.title}
            onMouseDown={e => { e.preventDefault(); tool.action() }}
            className={`px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 rounded transition-colors ${tool.className}`}
          >
            {tool.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">Markdown</span>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`w-full px-3 py-2 focus:outline-none resize-y ${className}`}
      />
    </div>
  )
}
