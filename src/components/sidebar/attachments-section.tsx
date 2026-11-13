import { useEffect, useState } from 'react'
import { Section } from '@/components/common/section'
import { AttachmentSlots } from '@/components/sidebar/attachment-slots'
import { CharmEditor } from '@/components/sidebar/charm-editor'
import { StickerEditor } from '@/components/sidebar/sticker-editor'
import { useDb } from '@/context/db-context'
import { Kbd } from '@/components/common/kbd'
import { cn } from '@/lib/utils'
import { Move } from 'lucide-react'
import { STICKER_MAX } from '@/lib/config'
import type { AttachmentIndex } from '@/lib/data/attachments'
import { isSlabCharm, type ItemMarkup } from '@/lib/markup'
import type { PickerTarget } from '@/lib/picker'
import type { CharmState } from '@/lib/viewer-state'
import type { StickerOptions } from '@/lib/viewer/skin-viewer'

interface AttachmentsSectionProps {
  markup: ItemMarkup | undefined
  attachments: AttachmentIndex | null
  stickers: StickerOptions[]
  activeSticker: number
  charm: CharmState
  onActiveSticker: (index: number) => void
  editing?: boolean
  onToggleEditing: () => void
  onStickers: (list: StickerOptions[]) => void
  onCharm: (changes: Partial<CharmState>) => void
  onOpenPicker: (target: PickerTarget) => void
}

export function AttachmentsSection({ markup, attachments, stickers, activeSticker, charm, onActiveSticker, editing, onToggleEditing, onStickers, onCharm, onOpenPicker }: AttachmentsSectionProps) {
  const db = useDb()
  const stickerDef = (id: string | null) => (id ? attachments?.sticker.get(id) : undefined)
  const stickerName = (id: string | null) => (id ? stickerDef(id)?.name ?? id : '')
  const charmDef = charm.id ? attachments?.charm.get(charm.id) : undefined
  const charmName = charmDef?.name ?? charm.id ?? ''
  const active = Math.min(activeSticker, stickers.length - 1)
  const [wanted, setWanted] = useState<'sticker' | 'charm'>('sticker')
  // (picking a sticker on the weapon itself, in Edit, brings its controls back)
  useEffect(() => { setWanted('sticker') }, [activeSticker])
  const kind = wanted === 'charm' ? (charm.id ? 'charm' : stickers.length ? 'sticker' : null) : stickers.length ? 'sticker' : charm.id ? 'charm' : null
  const current = stickers[active]
  const summary = `${stickers.length}/${STICKER_MAX} ${markup?.charm ? (charm.id ? '· charm' : '· no charm') : 'stickers'}`

  return (
    <Section title="Attachments" collapsible={{ id: 'attachments' }} aside={markup && <span className="section-value">{summary}</span>}>
      {markup ? (
        <div className="flex flex-col gap-3.5">
          {editing !== undefined && <EditHint editing={editing} onToggle={onToggleEditing} />}
          <AttachmentSlots
            stickers={stickers.map((s) => ({ name: stickerName(s.id), icon: stickerDef(s.id) ? db.sticker(stickerDef(s.id)!.index).image : undefined, slot: s.slot + 1 }))}
            max={STICKER_MAX}
            charm={charm.id ? { name: charmName, icon: charmDef ? db.charm(charmDef.index).image : undefined } : null}
            hasCharmPoint={markup.charm}
            focus={kind === 'sticker' ? { kind, index: active } : kind === 'charm' ? { kind } : null}
            onSticker={(index) => { onActiveSticker(index); setWanted('sticker') }}
            onAddSticker={() => { setWanted('sticker'); onOpenPicker({ kind: 'sticker', target: 'add' }) }}
            onCharm={() => { setWanted('charm'); if (!charm.id) onOpenPicker({ kind: 'charm' }) }}
          />
          {kind === 'sticker' && current && (
            <StickerEditor
              sticker={current}
              name={stickerName(current.id)}
              slotCount={Math.max(1, markup.stickerSlots.length)}
              onChange={(patch) => onStickers(stickers.map((s, k) => (k === active ? { ...s, ...patch } : s)))}
              onRemove={() => onStickers(stickers.filter((_, k) => k !== active))}
              onReplace={() => onOpenPicker({ kind: 'sticker', target: active })}
            />
          )}
          {kind === 'charm' && (
            <CharmEditor
              charm={charm}
              isSlab={isSlabCharm(charmDef)}
              charmDef={charmDef}
              charmName={charmName}
              stickerName={stickerName(charm.sticker)}
              onChange={onCharm}
              onChoose={() => onOpenPicker({ kind: 'charm' })}
              onChooseSticker={() => onOpenPicker({ kind: 'sticker', target: 'slab' })}
            />
          )}
        </div>
      ) : (
        <div className="text-[12px] text-muted-foreground">No sticker slots or charm point on this item.</div>
      )}
    </Section>
  )
}

function EditHint({ editing, onToggle }: { editing: boolean; onToggle: () => void }) {
  return (
    <div className={cn('flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[12px] transition-colors', editing ? 'border-foreground/40 bg-ink/6 text-foreground' : 'border-border text-muted-foreground')}>
      <Move className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 leading-snug">{editing ? 'Drag the stickers and the charm on the weapon' : 'Drag them into place on the weapon'}</span>
      <button
        type="button"
        aria-pressed={editing}
        onClick={onToggle}
        className={cn('flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 font-medium transition-colors', editing ? 'border-foreground/40 bg-ink/10 text-foreground' : 'border-border text-foreground hover:border-ink/20')}
      >
        {editing ? 'Done' : 'Edit'} <Kbd className="hidden sm:inline-flex">E</Kbd>
      </button>
    </div>
  )
}
