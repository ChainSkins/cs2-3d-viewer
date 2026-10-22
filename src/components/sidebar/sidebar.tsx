import { LayoutGrid, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { BrandMark } from '@/components/common/brand-mark'
import { AttachmentsSection } from '@/components/sidebar/attachments-section'
import { CharmPatternSection } from '@/components/sidebar/charm-pattern-section'
import { CurrentPick } from '@/components/sidebar/current-pick'
import { FloatSection } from '@/components/sidebar/float-section'
import { SidebarSkeleton } from '@/components/sidebar/sidebar-skeleton'
import { PatternSection } from '@/components/sidebar/pattern-section'
import { StickerWearSection } from '@/components/sidebar/sticker-wear-section'
import { FirstPersonSection } from '@/components/sidebar/first-person-section'
import { LightingSection } from '@/components/sidebar/lighting-section'
import { LoadoutSection } from '@/components/sidebar/loadout-section'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AttachmentIndex } from '@/lib/data/attachments'
import type { Item } from '@/lib/data/items'
import type { Heading } from '@/lib/heading'
import { isSlabCharm, markupFor } from '@/lib/markup'
import type { PickerTarget } from '@/lib/picker'
import type { Selection } from '@/lib/selection'
import { clampFloat } from '@/lib/wear'
import { DEFAULT_FLOAT } from '@/lib/config'
import type { ViewerStateApi } from '@/hooks/use-viewer-state'
import type { Lighting, Viewmodel } from '@/lib/viewer/skin-viewer'

interface SidebarProps {
  lighting: Lighting
  lightingPreset: string | null
  onLighting: (changes: Partial<Lighting>) => void
  viewmodel: Viewmodel
  onViewmodel: (changes: Partial<Viewmodel>) => void
  collapsed: boolean
  onToggleCollapsed: () => void
  selection: Selection
  heading: Heading
  item: Item | null
  attachments: AttachmentIndex | null
  state: ViewerStateApi
  glovesName: string | null
  agentName: string | null
  /** On an agent's page: the loadout weapon it holds (loaded) and its name; opening it in first person. */
  loadoutWeapon: Item | null
  loadoutWeaponName: string | null
  onLoadoutFirstPerson: (() => void) | null
  activeSticker: number
  onActiveSticker: (index: number) => void
  onOpenPicker: (target: PickerTarget) => void
  onOpenInspect: () => void
  loading: boolean
}

/** The control panel, floating over the page: the selection, then the sections that apply to it. On wide screens it folds into a slim rail. */
export function Sidebar({ lighting, lightingPreset, onLighting, viewmodel, onViewmodel, collapsed, onToggleCollapsed, selection, heading, item, attachments, state, glovesName, agentName, loadoutWeapon, loadoutWeaponName, onLoadoutFirstPerson, activeSticker, onActiveSticker, onOpenPicker, onOpenInspect, loading }: SidebarProps) {
  const isSkin = selection.kind === 'skin'
  const stickerName = (id: string | null) => (id ? attachments?.sticker.get(id)?.name ?? id : '')
  const charmId = selection.kind === 'charm' ? selection.id : state.charm.id
  const charmIsSlab = isSlabCharm(charmId ? attachments?.charm.get(charmId) : undefined)

  return (
    <aside
      className={cn(
        'glass-panel order-2 flex min-h-0 flex-col rounded-t-3xl transition-[width] duration-300 ease-out lg:order-1 lg:shrink-0 lg:rounded-3xl',
        collapsed ? 'lg:w-[68px]' : 'lg:w-[340px]',
      )}
    >
      <div className={cn('flex items-center gap-2 border-b border-white/10 px-3.5 py-2', collapsed && 'lg:flex-col lg:px-2.5 lg:py-2.5')}>
        <BrandMark compact={collapsed} className={cn('flex-1', collapsed && 'lg:flex-none')} />
        <Button variant="ghost" size="icon-sm" className="hidden lg:inline-flex" aria-label={collapsed ? 'Expand panel' : 'Collapse panel'} onClick={onToggleCollapsed}>
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>

      {collapsed && (
        <div className="hidden flex-col items-center gap-2.5 py-3 lg:flex">
          <Button variant="outline" size="icon-lg" aria-label="Change skin" title={heading.title} onClick={() => onOpenPicker({ kind: 'selection' })}>
            <LayoutGrid />
          </Button>
          <Button variant="outline" size="icon-lg" aria-label="Inspect link" onClick={onOpenInspect}><Search /></Button>
          <span className="mt-1 h-10 w-1.5 rounded-full" style={{ background: heading.color }} />
        </div>
      )}

      <div data-loading={loading} aria-busy={loading} className={cn('group/panel flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-4 py-4', collapsed && 'lg:hidden')}>
        <CurrentPick over={heading.over} title={heading.title} color={heading.color} onClick={() => onOpenPicker({ kind: 'selection' })} />
        <Button variant="outline" onClick={onOpenInspect}><Search /> Inspect link</Button>

        {isSkin && !item && <SidebarSkeleton />}

        {isSkin && item && (
          <>
            <FloatSection item={item} float={clampFloat(item, state.float ?? DEFAULT_FLOAT)} onChange={state.setFloat} />
            <PatternSection seed={state.seed} onChange={state.setSeed} />
            <AttachmentsSection
              markup={markupFor(item)}
              attachments={attachments}
              stickers={state.stickers}
              activeSticker={activeSticker}
              charm={state.charm}
              onActiveSticker={onActiveSticker}
              onStickers={state.setStickers}
              onCharm={state.setCharm}
              onOpenPicker={onOpenPicker}
            />
          </>
        )}

        {selection.kind === 'sticker' && <StickerWearSection wear={state.stickerWear} onChange={state.setStickerWear} />}

        {selection.kind === 'charm' && (
          <CharmPatternSection
            charm={charmId ? attachments?.charm.get(charmId) : undefined}
            seed={state.charm.seed}
            isSlab={charmIsSlab}
            stickerId={state.charm.sticker}
            stickerName={stickerName(state.charm.sticker)}
            onSeed={(seed) => state.setCharm({ seed })}
            onChooseSticker={() => onOpenPicker({ kind: 'sticker', target: 'slab' })}
            onClearSticker={() => state.setCharm({ sticker: null })}
          />
        )}

        {isSkin && item && item.style !== 'glove' && state.firstPerson && (
          <FirstPersonSection
            agentName={agentName}
            glovesName={glovesName}
            viewmodel={viewmodel}
            onViewmodel={onViewmodel}
            onChooseAgent={() => onOpenPicker({ kind: 'agent' })}
            onDefaultAgent={() => state.setAgent(null)}
            onChooseGloves={() => onOpenPicker({ kind: 'gloves' })}
            onBareArms={() => state.setGloves(null)}
          />
        )}

        {selection.kind === 'agent' && (
          <LoadoutSection
            weapon={loadoutWeapon}
            weaponName={loadoutWeaponName}
            weaponSeed={state.loadout.weaponSeed}
            weaponFloat={loadoutWeapon ? clampFloat(loadoutWeapon, state.loadout.weaponFloat ?? DEFAULT_FLOAT) : DEFAULT_FLOAT}
            glovesName={glovesName}
            viewmodel={viewmodel}
            onChooseWeapon={() => onOpenPicker({ kind: 'weapon' })}
            onNoWeapon={() => state.updateLoadout({ weapon: null })}
            onWeaponSeed={(weaponSeed) => state.updateLoadout({ weaponSeed })}
            onWeaponFloat={(weaponFloat) => state.updateLoadout({ weaponFloat })}
            onChooseGloves={() => onOpenPicker({ kind: 'gloves' })}
            onAgentGloves={() => state.setGloves(null)}
            onViewmodel={onViewmodel}
            onFirstPerson={onLoadoutFirstPerson}
          />
        )}

        <LightingSection lighting={lighting} presetId={lightingPreset} onChange={onLighting} />
      </div>
    </aside>
  )
}
