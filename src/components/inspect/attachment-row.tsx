import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ItemImage } from '@/components/common/item-image'
import { cn } from '@/lib/utils'

interface AttachmentRowProps {
  name: string
  image?: string
  color: string
  icon: LucideIcon
  detail?: string
  known: boolean
  aside?: ReactNode
}

export function AttachmentRow({ name, image, color, icon, detail, known, aside }: AttachmentRowProps) {
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border border-border bg-shade/15 p-1.5 pr-3', !known && 'opacity-60')}>
      <ItemImage src={image} color={color} fallback={icon} className="size-10" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{name}</div>
        {detail && <div className="text-[10.5px] text-muted-foreground">{detail}</div>}
      </div>
      {aside}
    </div>
  )
}
