import { X } from 'lucide-react'

interface AttachmentHeaderProps {
  name: string
  removeLabel: string
  onChange: () => void
  onRemove: () => void
}

export function AttachmentHeader({ name, removeLabel, onChange, onRemove }: AttachmentHeaderProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium" title={name}>{name}</span>
      <button type="button" onClick={onChange} className="h-7 shrink-0 rounded-md border border-border px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:border-ink/20 hover:text-foreground">Change</button>
      <button type="button" aria-label={removeLabel} title={removeLabel} onClick={onRemove} className="grid size-7 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-ink/20 hover:text-foreground">
        <X className="size-3.5" />
      </button>
    </div>
  )
}
