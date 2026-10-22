import { CheckCircle2, ClipboardPaste } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type LinkState = 'empty' | 'ok' | 'error'

interface InspectLinkInputProps {
  value: string
  state: LinkState
  /** Fewer rows once the item's card is shown under it. */
  compact: boolean
  onChange: (value: string) => void
  onPaste: () => void
  onSubmit: () => void
}

/** The inspect link box: a monospace text area with Paste / Clear, its border telling a valid link from a bad one. */
export function InspectLinkInput({ value, state, compact, onChange, onPaste, onSubmit }: InspectLinkInputProps) {
  return (
    <div
      className={cn(
        'inset-well relative shrink-0 rounded-2xl transition-colors focus-within:border-violet-400/60',
        state === 'error' && 'border-destructive/50 focus-within:border-destructive/60',
        state === 'ok' && 'border-emerald-400/40 focus-within:border-emerald-400/60',
      )}
    >
      <textarea
        autoFocus
        value={value}
        rows={compact ? 3 : 4}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() } }}
        placeholder="steam://run/730//+csgo_econ_action_preview%20…"
        className="block w-full resize-none break-all bg-transparent px-3.5 pt-3 pb-1 font-mono text-[12px] leading-relaxed outline-none placeholder:text-muted-foreground/70"
      />
      <div className="flex items-center gap-2 border-t border-white/[0.06] px-2 py-2">
        <Button variant="outline" size="sm" onClick={onPaste}><ClipboardPaste /> Paste</Button>
        {value && <Button variant="ghost" size="sm" onClick={() => onChange('')}>Clear</Button>}
        <span className="ml-auto pr-1.5 text-[11px] text-muted-foreground">
          {state === 'ok' ? <span className="flex items-center gap-1 text-emerald-300"><CheckCircle2 className="size-3.5" /> Valid link</span> : 'Enter to load'}
        </span>
      </div>
    </div>
  )
}
