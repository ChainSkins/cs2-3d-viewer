import { X, type LucideIcon } from 'lucide-react'
import { FieldRow } from '@/components/common/field-row'
import { Button } from '@/components/ui/button'

interface PickerFieldProps {
  label?: string
  value: string | null
  placeholder?: string
  icon?: LucideIcon
  clearLabel: string
  onChoose: () => void
  onClear: () => void
}

export function PickerField({ label, value, placeholder = 'Choose…', icon: Icon, clearLabel, onChoose, onClear }: PickerFieldProps) {
  const row = (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      <Button variant="outline" size="sm" className="min-w-0 flex-1 justify-start truncate" onClick={onChoose}>
        {Icon && <Icon />} {value ?? placeholder}
      </Button>
      {value && <Button variant="outline" size="icon-sm" aria-label={clearLabel} onClick={onClear}><X /></Button>}
    </div>
  )
  return label ? <FieldRow label={label}>{row}</FieldRow> : row
}
