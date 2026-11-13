import { History, Search, X } from 'lucide-react'
import { Kbd } from '@/components/common/kbd'
import { cn } from '@/lib/utils'

interface PickerToolbarProps {
  query: string
  placeholder: string
  onQuery: (query: string) => void
  onEnterGrid?: () => void
  onSubmit?: () => void
  history?: boolean
  onHistory?: (on: boolean) => void
  onClose: () => void
}

export function PickerToolbar({ query, placeholder, onQuery, onEnterGrid, onSubmit, history, onHistory, onClose }: PickerToolbarProps) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border pl-5 pr-3">
      <Search className="pointer-events-none size-[18px] shrink-0 text-muted-foreground" />
      <input
        autoFocus
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSubmit) { e.preventDefault(); onSubmit() }
          else if (e.key === 'ArrowDown' && onEnterGrid) { e.preventDefault(); onEnterGrid() }
        }}
        placeholder={placeholder}
        spellCheck={false}
        aria-label="Search"
        className="h-full min-w-0 flex-1 bg-transparent px-2 text-[15px] outline-none placeholder:text-muted-foreground/70"
      />
      {query && (
        <button type="button" onClick={() => onQuery('')} className="shrink-0 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition hover:bg-ink/8 hover:text-foreground">
          Clear
        </button>
      )}
      {history !== undefined && (
        <button
          type="button"
          aria-pressed={history}
          title="Inspect links you loaded"
          onClick={() => onHistory?.(!history)}
          className={cn('flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition', history ? 'bg-ink/12 text-foreground' : 'text-muted-foreground hover:bg-ink/6 hover:text-foreground')}
        >
          <History className="size-4" /> <span className="hidden sm:inline">History</span>
        </button>
      )}
      <button type="button" aria-label="Close" onClick={onClose} className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-muted-foreground transition hover:bg-ink/6 hover:text-foreground">
        <Kbd className="hidden sm:inline-flex">Esc</Kbd>
        <X className="size-4 sm:hidden" />
      </button>
    </div>
  )
}
