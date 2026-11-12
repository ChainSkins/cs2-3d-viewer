import { X, type LucideIcon } from 'lucide-react'
import { Kbd } from '@/components/common/kbd'
import { DialogDescription, DialogTitle } from '@/components/ui/dialog'

interface DialogHeadingProps {
  icon: LucideIcon
  title: string
  description: string
  onClose: () => void
}

export function DialogHeading({ icon: Icon, title, description, onClose }: DialogHeadingProps) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border pl-5 pr-3">
      <Icon className="size-[18px] shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 items-baseline gap-2.5">
        <DialogTitle className="shrink-0 text-[15px] font-medium tracking-tight">{title}</DialogTitle>
        <DialogDescription className="hidden truncate text-[12.5px] text-muted-foreground sm:block">{description}</DialogDescription>
      </div>
      <button type="button" aria-label="Close" onClick={onClose} className="flex h-8 shrink-0 items-center rounded-lg px-2 text-muted-foreground transition hover:bg-ink/6 hover:text-foreground">
        <Kbd className="hidden sm:inline-flex">Esc</Kbd>
        <X className="size-4 sm:hidden" />
      </button>
    </div>
  )
}
