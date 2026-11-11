interface StatProps {
  label: string
  value: string
  color?: string
}

export function Stat({ label, value, color }: StatProps) {
  return (
    <span className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-[11.5px] text-muted-foreground">{label}</span>
      <span className="font-mono text-[12.5px] font-medium tabular-nums text-foreground" style={color ? { color } : undefined}>{value}</span>
    </span>
  )
}
