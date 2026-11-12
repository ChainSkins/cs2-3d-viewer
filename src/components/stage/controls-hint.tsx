import { Mouse, X } from 'lucide-react'
import { useEffect, type RefObject } from 'react'
import { Kbd } from '@/components/common/kbd'
import { useLocalStorage } from '@/hooks/common/use-local-storage'
import { IS_MOBILE_DEVICE } from '@/lib/device'

interface ControlsHintProps {
  viewportRef: RefObject<HTMLDivElement | null>
  show: boolean
}

export function ControlsHint({ viewportRef, show }: ControlsHintProps) {
  const [seen, setSeen] = useLocalStorage('controls-hint-seen', false)
  const visible = show && !seen

  useEffect(() => {
    const el = viewportRef.current
    if (!visible || !el) return
    const done = () => setSeen(true)
    el.addEventListener('pointerdown', done, { once: true })
    el.addEventListener('wheel', done, { once: true, passive: true })
    return () => {
      el.removeEventListener('pointerdown', done)
      el.removeEventListener('wheel', done)
    }
  }, [visible, viewportRef, setSeen])

  if (!visible) return null
  const steps = IS_MOBILE_DEVICE
    ? ['Drag to rotate', 'Pinch to zoom', 'Two fingers to move']
    : ['Drag to rotate', 'Scroll to zoom', 'Right-drag to move']

  return (
    <div className="glass pointer-events-auto flex max-w-full items-center gap-2.5 rounded-full py-1.5 pl-3.5 pr-1.5 text-[12px] text-foreground/85">
      <Mouse className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0">{steps.join(' · ')}</span>
      {!IS_MOBILE_DEVICE && <span className="flex shrink-0 items-center gap-1 text-muted-foreground"><Kbd>?</Kbd> shortcuts</span>}
      <button type="button" aria-label="Dismiss" onClick={() => setSeen(true)} className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-ink/8 hover:text-foreground">
        <X className="size-3.5" />
      </button>
    </div>
  )
}
