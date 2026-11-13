import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NumberFieldProps {
  value: number
  min: number
  max: number
  decimals?: number
  label: string
  className?: string
  onChange: (value: number) => void
}

export function NumberField({ value, min, max, decimals = 0, label, className, onChange }: NumberFieldProps) {
  const shown = value.toFixed(decimals)
  const [draft, setDraft] = useState(shown)
  // A new value from outside replaces what was being typed.
  const [lastShown, setLastShown] = useState(shown)
  if (shown !== lastShown) {
    setLastShown(shown)
    setDraft(shown)
  }

  const commit = () => {
    const parsed = Number(draft)
    if (!Number.isFinite(parsed)) return setDraft(value.toFixed(decimals))
    const next = Math.min(max, Math.max(min, parsed))
    onChange(next)
    setDraft(next.toFixed(decimals))
  }

  return (
    <input
      inputMode="decimal"
      aria-label={label}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
      className={cn('h-8 min-w-0 rounded-md border border-border bg-shade/25 px-2 text-right font-mono text-[13px] tabular-nums outline-none transition-colors focus-visible:border-ink/25', className)}
    />
  )
}
