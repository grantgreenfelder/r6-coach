export function extractSection(content, heading) {
  if (!content) return ''
  const lines = content.split('\n')
  const re = new RegExp(`^#{1,3}\\s+${heading}`, 'i')
  const start = lines.findIndex(l => re.test(l))
  if (start === -1) return ''
  const level = (lines[start].match(/^(#+)/) || ['', '#'])[1].length
  const endRe = new RegExp(`^#{1,${level}}\\s`)
  const end = lines.findIndex((l, i) => i > start && endRe.test(l))
  return lines.slice(start + 1, end === -1 ? undefined : end).join('\n').trim()
}
