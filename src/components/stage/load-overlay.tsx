import { AlertCircle, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Spinner } from '@/components/common/spinner'
import { Button } from '@/components/ui/button'

const SHOW_AFTER = 250
const SLOW_AFTER = 10_000

export function LoadingCard({ title }: { title: string }) {
  const [phase, setPhase] = useState<'hidden' | 'shown' | 'slow'>('hidden')
  useEffect(() => {
    setPhase('hidden')
    const show = setTimeout(() => setPhase('shown'), SHOW_AFTER)
    const slow = setTimeout(() => setPhase('slow'), SLOW_AFTER)
    return () => { clearTimeout(show); clearTimeout(slow) }
  }, [title])
  if (phase === 'hidden') return null

  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div role="status" className="glass-strong flex max-w-[min(360px,calc(100%-2rem))] flex-col gap-1 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-3 text-[13px]">
          <Spinner />
          <span className="truncate">Loading {title}…</span>
        </div>
        {phase === 'slow' && <p className="pl-7 text-[12px] text-muted-foreground">Taking longer than usual. Big models can need a moment on a slow connection.</p>}
      </div>
    </div>
  )
}

function readable(message: string) {
  if (/json|404|not found/i.test(message)) return "This item isn't in the viewer's files, or the link is wrong."
  if (/fetch|network|load failed/i.test(message)) return 'A file could not be downloaded. Check your connection.'
  return message
}

export function LoadErrorCard({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center p-4">
      <div role="alert" className="glass-strong pointer-events-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl px-5 py-5 text-center">
        <span className="grid size-9 place-items-center rounded-full bg-destructive/12 text-destructive">
          <AlertCircle className="size-4.5" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-[14px] font-medium">Couldn't load {title}</p>
          <p className="wrap-break-word text-[12px] text-muted-foreground" title={message}>{readable(message)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw /> Try again
        </Button>
      </div>
    </div>
  )
}
