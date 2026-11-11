import { ChevronDown, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { cn } from '@/lib/utils'

interface SectionProps {
  title: string
  icon?: LucideIcon
  aside?: ReactNode
  collapsible?: { id: string; defaultOpen?: boolean }
  className?: string
  children: ReactNode
}

export function Section({ collapsible, ...props }: SectionProps) {
  return collapsible
    ? <CollapsibleSection {...props} id={collapsible.id} defaultOpen={collapsible.defaultOpen ?? true} />
    : <SectionFrame {...props} open />
}

function CollapsibleSection({ id, defaultOpen, ...props }: Omit<SectionProps, 'collapsible'> & { id: string; defaultOpen: boolean }) {
  const [open, setOpen] = useLocalStorage(`section:${id}`, defaultOpen)
  return <SectionFrame {...props} open={open} onToggle={() => setOpen(!open)} />
}

function SectionFrame({ title, icon: Icon, aside, className, children, open, onToggle }: Omit<SectionProps, 'collapsible'> & { open: boolean; onToggle?: () => void }) {
  const heading = (
    <>
      {Icon && <Icon className="size-4 text-muted-foreground" />}
      <span className="text-[13px] font-medium text-foreground">{title}</span>
    </>
  )
  return (
    <section className={cn('tile shrink-0 p-3.5 transition-opacity group-data-[loading=true]/panel:shimmer group-data-[loading=true]/panel:opacity-70', className)}>
      <div className="flex items-center gap-2">
        {onToggle ? (
          <button type="button" aria-expanded={open} onClick={onToggle} className="-m-1 flex min-h-7 flex-1 items-center gap-2 rounded-md p-1 text-left">
            {heading}
          </button>
        ) : (
          <>
            {heading}
            <span className="flex-1" />
          </>
        )}
        {aside}
        {onToggle && (
          <button type="button" tabIndex={-1} aria-hidden onClick={onToggle} className="-mr-1 grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/6 hover:text-foreground">
            <ChevronDown className={cn('size-4 transition-transform duration-200', open && 'rotate-180')} />
          </button>
        )}
      </div>
      {/* Folds by animating its row from 0 to its content's height (the content stays mounted, inert while folded). */}
      <div inert={!open} className={cn('grid transition-[grid-template-rows,opacity] duration-200 ease-out', open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
        {/* (padded out and back in so the clip doesn't cut the controls' shadows and focus rings) */}
        <div className="-mx-2 -mb-2 min-h-0 overflow-hidden px-2 pb-2">
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </section>
  )
}
