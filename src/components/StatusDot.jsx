const statusMap = {
  'developed': { color: 'bg-green-500', label: 'Developed' },
  'partial': { color: 'bg-yellow-500', label: 'Partial' },
  'not-developed': { color: 'bg-gray-600', label: 'Not Developed' },
}

export default function StatusDot({ status, showLabel = false }) {
  const { color, label } = statusMap[status] || statusMap['not-developed']
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
      {showLabel && <span className="text-xs text-gray-400">{label}</span>}
    </span>
  )
}
