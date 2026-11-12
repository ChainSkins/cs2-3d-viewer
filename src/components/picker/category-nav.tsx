import { CategoryIcon } from '@/components/picker/category-icon'
import type { PickerCategory } from '@/lib/picker'
import { cn } from '@/lib/utils'

interface CategoryNavProps {
  shelves: PickerCategory[]
  categories: PickerCategory[]
  active: string | null
  counts: Record<string, number>
  onSelect: (label: string) => void
  loaded: boolean
}

export function CategoryNav({ shelves, categories, active, counts, onSelect, loaded }: CategoryNavProps) {
  return (
    <nav aria-label="Categories" className="flex shrink-0 gap-1 overflow-x-auto border-b border-border p-2 md:w-52 md:flex-col md:gap-px md:overflow-y-auto md:border-b-0 md:border-r md:p-2.5">
      {[shelves, categories].map((list, i) => (
        <div key={i} className="contents">
          <div className={cn('hidden px-2.5 pb-1.5 pt-2 text-[11.5px] font-medium text-muted-foreground md:block', i > 0 && 'md:mt-2')}>{i === 0 ? 'Yours' : 'Categories'}</div>
          {i > 0 && <span aria-hidden className="mx-1 my-1.5 w-px shrink-0 bg-border md:hidden" />}
          {list.map((c) => {
        const isActive = active === c.label
        const empty = loaded && !counts[c.label]
        return (
          <button
            key={c.label}
            type="button"
            aria-current={isActive ? 'true' : undefined}
            onClick={() => onSelect(c.label)}
            className={cn(
              'flex h-9 shrink-0 items-center gap-2.5 rounded-lg pl-2 pr-2.5 text-left text-[13.5px] transition-colors',
              isActive ? 'bg-ink/9 font-medium text-foreground' : 'text-muted-foreground hover:bg-ink/5 hover:text-foreground',
              empty && !isActive && 'opacity-40',
            )}
            title={empty ? `No ${c.label.toLowerCase()} here yet` : undefined}
          >
            <CategoryIcon category={c} active={isActive} />
            <span className="flex-1">{c.label}</span>
            <span className="hidden text-[11px] font-normal tabular-nums text-muted-foreground/80 md:inline">{counts[c.label] ?? 0}</span>
          </button>
        )
          })}
        </div>
      ))}
    </nav>
  )
}
