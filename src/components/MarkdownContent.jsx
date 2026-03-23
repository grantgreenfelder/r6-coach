import { marked } from 'marked'
import { useMemo } from 'react'

marked.setOptions({ breaks: true, gfm: true })

export default function MarkdownContent({ content, className = '' }) {
  const html = useMemo(() => {
    if (!content) return ''
    return marked.parse(content)
  }, [content])

  return (
    <div
      className={`md-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
