import { Move } from 'lucide-react'
import { Kbd } from '@/components/common/kbd'
import { Button } from '@/components/ui/button'

interface EditButtonProps {
  editing: boolean
  onToggle: () => void
}

export function EditButton({ editing, onToggle }: EditButtonProps) {
  return (
    <Button
      variant="ghost"
      aria-pressed={editing}
      title={editing ? 'Stop editing (E)' : 'Edit: drag the stickers and the charm (E)'}
      className={editing ? 'pointer-events-auto h-9 rounded-lg bg-white/14 px-2.5 text-[13px] text-foreground' : 'pointer-events-auto h-9 rounded-lg px-2.5 text-[13px]'}
      onClick={onToggle}
    >
      <Move /> {editing ? 'Editing' : 'Edit'} <Kbd className="hidden sm:inline-flex">E</Kbd>
    </Button>
  )
}
