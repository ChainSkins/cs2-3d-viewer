import { Sticker } from 'lucide-react'
import { Section } from '@/components/common/section'
import { WornRow } from '@/components/sidebar/worn-row'
import { useDb } from '@/context/db-context'
import type { StickerEntry } from '@/lib/data/attachments'

interface SlabSectionProps {
  sticker: StickerEntry | undefined
  stickerId: string | null
  onChooseSticker: () => void
  onClearSticker: () => void
}

export function SlabSection({ sticker, stickerId, onChooseSticker, onClearSticker }: SlabSectionProps) {
  const db = useDb()
  return (
    <Section title="Sticker slab" collapsible={{ id: 'sticker-slab' }} aside={<span className="section-value">{stickerId ? 'Sealed' : 'Empty'}</span>}>
      <div className="flex flex-col gap-3">
        <WornRow
          kind="Sealed sticker"
          name={stickerId ? sticker?.name ?? stickerId : null}
          placeholder="No sticker"
          image={sticker ? db.sticker(sticker.index).image : undefined}
          icon={Sticker}
          clearLabel="Remove the sticker"
          onChoose={onChooseSticker}
          onClear={onClearSticker}
        />
      </div>
    </Section>
  )
}
