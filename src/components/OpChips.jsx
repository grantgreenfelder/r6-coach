import PortraitChip from './PortraitChip'

export default function OpChips({ label, opsString }) {
  if (!opsString) return null
  const ops = opsString.split(/[,/]/).map(s => s.trim()).filter(Boolean)
  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-500 text-[10px]">{label}</span>
      {ops.map(name => <PortraitChip key={name} name={name} />)}
    </div>
  )
}
