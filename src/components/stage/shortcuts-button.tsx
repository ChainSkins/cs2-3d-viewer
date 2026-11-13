import { Keyboard } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import { DialogHeading } from '@/components/common/dialog-heading'
import { Kbd } from '@/components/common/kbd'
import { ICON_BUTTON } from '@/components/common/top-bar-links'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { isTyping } from '@/hooks/common/use-shortcuts'
import { cn } from '@/lib/utils'

const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'

const GROUPS: { title: string; rows: { keys: string[][]; label: string }[] }[] = [
  {
    title: 'General',
    rows: [
      { keys: [[MOD, 'K'], ['/']], label: 'Open the picker' },
      { keys: [['H']], label: 'Hide or show the interface' },
      { keys: [['?']], label: 'This list' },
      { keys: [['Esc']], label: 'Close a dialog' },
    ],
  },
  {
    title: 'Weapons',
    rows: [
      { keys: [['E']], label: 'Edit mode: move the stickers and the charm' },
      { keys: [['V']], label: 'First person on or off' },
    ],
  },
  {
    title: 'First person',
    rows: [
      { keys: [['F']], label: 'Inspect the weapon' },
      { keys: [['G']], label: 'Look at the gloves' },
      { keys: [['Space']], label: 'Fire (hold for automatic weapons)' },
    ],
  },
  {
    title: 'Camera',
    rows: [
      { keys: [['Drag']], label: 'Rotate' },
      { keys: [['Scroll']], label: 'Zoom' },
      { keys: [['Right-drag']], label: 'Move' },
    ],
  },
]

export function ShortcutsButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey || isTyping(e)) return
      if (!open && document.querySelector('[role=dialog]')) return
      e.preventDefault()
      setOpen((on) => !on)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button type="button" aria-label="Keyboard shortcuts (?)" title="Keyboard shortcuts (?)" onClick={() => setOpen(true)} className={cn(ICON_BUTTON, className)}>
        <Keyboard className="size-4.5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="flex max-h-[min(640px,90vh)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-120">
          <DialogHeading icon={Keyboard} title="Keyboard shortcuts" description="What the keys do in the viewer." onClose={() => setOpen(false)} />
          <div className="flex flex-col gap-5 overflow-y-auto p-5">
            {GROUPS.map((group) => (
              <section key={group.title} className="flex flex-col">
                <h3 className="pb-1 text-[12px] font-medium text-muted-foreground">{group.title}</h3>
                {group.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 border-b border-border/60 py-2 text-[13px] last:border-0">
                    <span>{row.label}</span>
                    <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                      {row.keys.map((combo, i) => (
                        <Fragment key={i}>
                          {i > 0 && <span className="text-[11px]">or</span>}
                          <span className="flex items-center gap-0.5">
                            {combo.map((k) => <Kbd key={k} className="h-5 min-w-5 px-1.5 text-[11px]">{k}</Kbd>)}
                          </span>
                        </Fragment>
                      ))}
                    </span>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
