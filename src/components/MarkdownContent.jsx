import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useMemo } from 'react'

export default function MarkdownContent({ content, className = '' }) {
  const html = useMemo(() => {
    if (!content) return ''
    return DOMPurify.sanitize(marked.parse(content, { breaks: true, gfm: true }))
  }, [content])

  return (
    <div
      className={`md-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
