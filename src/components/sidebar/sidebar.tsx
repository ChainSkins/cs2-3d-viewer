import { ChevronDown, LayoutGrid, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { BrandMark } from '@/components/common/brand-mark'
import { RepoLink, ThemeToggle } from '@/components/common/top-bar-links'
import { IS_MOBILE_DEVICE } from '@/lib/device'
import { ShortcutsButton } from '@/components/stage/shortcuts-button'
import { ItemImage } from '@/components/common/item-image'
import { AttachmentsSection } from '@/components/sidebar/attachments-section'
import { AgentPatchesSection } from '@/components/sidebar/agent-patches-section'
import { CharmPatternSection } from '@/components/sidebar/charm-pattern-section'
import { SlabSection } from '@/components/sidebar/slab-section'
import { CurrentPick } from '@/components/sidebar/current-pick'
import { FloatSection } from '@/components/sidebar/float-section'
import { SidebarSkeleton } from '@/components/sidebar/sidebar-skeleton'
import { PetSection } from '@/components/sidebar/pet-section'
import { PatternSection } from '@/components/sidebar/pattern-section'
import { StickerCardSection, StickerWearSection } from '@/components/sidebar/sticker-wear-section'
import { FirstPersonSection } from '@/components/sidebar/first-person-section'
import { LoadoutSection } from '@/components/sidebar/loadout-section'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { AttachmentIndex } from '@/lib/data/attachments'
import type { PatchIndex } from '@/lib/data/patches'
import type { PetIndex } from '@/lib/data/pets'
import type { Item } from '@/lib/data/items'
import type { Heading } from '@/lib/heading'
import { isSlabCharm, markupFor } from '@/lib/markup'
import type { PickerTarget } from '@/lib/picker'
import type { Selection } from '@/lib/selection'
import { fadeForItem } from '@/lib/fade'
import { clampFloat } from '@/lib/wear'
import { DEFAULT_FLOAT } from '@/lib/config'
import type { ViewerStateApi } from '@/lib/viewer-state'
import type { Viewmodel } from '@/lib/viewer/skin-viewer'

interface SidebarProps {
  viewmodel: Viewmodel
  onViewmodel: (changes: Partial<Viewmodel>) => void
  collapsed: boolean
  onToggleCollapsed: () => void
  selection: Selection
  heading: Heading
  item: Item | null
  attachments: AttachmentIndex | null
  patches: PatchIndex | null
  pets: PetIndex | null
  state: ViewerStateApi
  glovesName: string | null
  glovesImage?: string
  agentName: string | null
  agentImage?: string
  loadoutWeapon: Item | null
  loadoutWeaponName: string | null
  loadoutWeaponImage?: string
  onLoadoutFirstPerson: (() => void) | null
  activeSticker: number
  onActiveSticker: (index: number) => void
  /** Edit mode (dragging the stickers and the charm on the weapon): on or off, undefined where it doesn't apply. */
  editing?: boolean
  onToggleEditing: () => void
  onOpenPicker: (target: PickerTarget) => void
  loading: boolean
  sheetOpen: boolean
  onCloseSheet: () => void
}

export function Sidebar({ viewmodel, onViewmodel, collapsed, onToggleCollapsed, selection, heading, item, attachments, patches, pets, state, glovesName, glovesImage, agentName, agentImage, loadoutWeapon, loadoutWeaponName, loadoutWeaponImage, onLoadoutFirstPerson, activeSticker, onActiveSticker, editing, onToggleEditing, onOpenPicker, loading, sheetOpen, onCloseSheet }: SidebarProps) {
  const isSkin = selection.kind === 'skin'
  const [wantedTab, setTab] = useState<'finish' | 'stickers' | 'view'>('finish')
  const hasView = isSkin && !!item && item.style !== 'glove' && state.firstPerson
  const tab = wantedTab === 'view' && !hasView ? 'finish' : wantedTab
  const only = (t: typeof tab) => cn('contents', isSkin && tab !== t && 'max-lg:hidden')
  const charmId = selection.kind === 'charm' ? selection.id : state.charm.id
  const charmIsSlab = isSlabCharm(charmId ? attachments?.charm.get(charmId) : undefined)

  return (
    <aside
      className={cn(
        'glass-panel order-2 flex min-h-0 flex-col rounded-t-3xl transition-[width] duration-300 ease-out lg:order-1 lg:shrink-0 lg:rounded-none lg:border-y-0 lg:border-l-0 lg:shadow-none',
        collapsed ? 'lg:w-[68px]' : 'lg:w-[340px]',
        sheetOpen ? 'sheet-in max-lg:fixed max-lg:inset-0 max-lg:z-40 max-lg:rounded-none max-lg:border-0' : 'max-lg:hidden',
      )}
    >
      <div className={cn('flex items-center gap-2 border-b border-border px-3.5 py-2', collapsed && 'lg:flex-col lg:px-2.5 lg:py-2.5')}>
        <BrandMark compact={collapsed} className={cn('flex-1', collapsed && 'lg:flex-none')} />
        {!IS_MOBILE_DEVICE && <ShortcutsButton className={cn('size-8', collapsed && 'lg:hidden')} />}
        <ThemeToggle className={cn('size-8', collapsed && 'lg:hidden')} />
        <RepoLink className={cn('size-8', collapsed && 'lg:hidden')} />
        <Button variant="ghost" size="icon-sm" className="hidden lg:inline-flex" aria-label={collapsed ? 'Expand panel' : 'Collapse panel'} onClick={onToggleCollapsed}>
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
        <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Close the panel" onClick={onCloseSheet}>
          <ChevronDown />
        </Button>
      </div>

      {collapsed && (
        <div className="hidden flex-col items-center gap-2.5 py-3 lg:flex">
          <button type="button" aria-label="Change the item" title={`${heading.title} · change`} onClick={() => onOpenPicker({ kind: 'selection' })} className="group relative overflow-hidden rounded-lg border border-border bg-shade/20 outline-none transition-colors hover:border-ink/25 focus-visible:border-foreground/70">
            <ItemImage src={heading.icon} color={heading.color} fallback={LayoutGrid} className="size-11 rounded-none p-1" imageClassName="transition-transform duration-200 group-hover:scale-108" />
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: heading.color }} />
          </button>
        </div>
      )}

      <div data-loading={loading} aria-busy={loading} className={cn('group/panel panel-flat sheet-cards flex min-h-0 flex-1 flex-col overflow-y-auto', collapsed && 'lg:hidden')}>
        <CurrentPick over={heading.over} title={heading.title} color={heading.color} icon={heading.icon} onClick={() => onOpenPicker({ kind: 'selection' })} />
        <div className="contents">

        {isSkin && item && (
          <div role="tablist" className="mx-4 my-3 flex gap-0.5 rounded-lg bg-shade/25 p-0.5 lg:hidden">
            {([['finish', 'Finish'], ['stickers', 'Stickers'], ['view', 'View']] as const).filter(([id]) => id !== 'view' || hasView).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={cn('flex-1 rounded-md py-1.5 text-[12.5px] font-medium transition-colors', tab === id ? 'bg-ink/12 text-foreground' : 'text-muted-foreground')}>
                {label}
              </button>
            ))}
          </div>
        )}

        {isSkin && !item && <SidebarSkeleton />}

        {isSkin && item && (
          <>
            <div className={cn(only('finish'), tab === 'finish' && 'max-lg:flex max-lg:flex-col')}>
              <FloatSection item={item} float={clampFloat(item, state.float ?? DEFAULT_FLOAT)} onChange={state.setFloat} />
              <PatternSection seed={state.seed} onChange={state.setSeed} fade={fadeForItem(item, state.seed)} />
            </div>
            <div className={only('stickers')}>
            <AttachmentsSection
              markup={markupFor(item)}
              attachments={attachments}
              stickers={state.stickers}
              activeSticker={activeSticker}
              charm={state.charm}
              onActiveSticker={onActiveSticker}
              editing={editing}
              onToggleEditing={onToggleEditing}
              onStickers={state.setStickers}
              onCharm={state.setCharm}
              onOpenPicker={onOpenPicker}
            />
            </div>
          </>
        )}

        {selection.kind === 'pet' && (
          <PetSection pet={pets?.pet.get(selection.id)} pets={pets} variant={state.petVariant} clip={state.petClip} onVariant={state.setPetVariant} onClip={state.setPetClip} hat={state.petHat} onHat={state.setPetHat} agentName={agentName} agentImage={agentImage} onChooseAgent={() => onOpenPicker({ kind: 'agent' })} onDefaultAgent={() => state.setAgent(null)} />
        )}

        {selection.kind === 'sticker' && (
          <>
            <StickerWearSection wear={state.stickerWear} onChange={state.setStickerWear} />
            <StickerCardSection card={state.stickerCard} onCard={state.setStickerCard} />
          </>
        )}

        {selection.kind === 'charm' && charmIsSlab && (
          <SlabSection
            sticker={state.charm.sticker ? attachments?.sticker.get(state.charm.sticker) : undefined}
            stickerId={state.charm.sticker}
            onChooseSticker={() => onOpenPicker({ kind: 'sticker', target: 'slab' })}
            onClearSticker={() => state.setCharm({ sticker: null })}
          />
        )}

        {selection.kind === 'charm' && !charmIsSlab && (
          <CharmPatternSection charm={charmId ? attachments?.charm.get(charmId) : undefined} seed={state.charm.seed} onSeed={(seed) => state.setCharm({ seed })} />
        )}

        {isSkin && item && item.style !== 'glove' && state.firstPerson && (
          <div className={only('view')}>
          <FirstPersonSection
            agentName={agentName}
            agentImage={agentImage}
            glovesName={glovesName}
            glovesImage={glovesImage}
            viewmodel={viewmodel}
            onViewmodel={onViewmodel}
            onChooseAgent={() => onOpenPicker({ kind: 'agent' })}
            onDefaultAgent={() => state.setAgent(null)}
            onChooseGloves={() => onOpenPicker({ kind: 'gloves' })}
            onBareArms={() => state.setGloves(null)}
          />
          </div>
        )}

        {selection.kind === 'agent' && (
          <LoadoutSection
            weapon={loadoutWeapon}
            weaponName={loadoutWeaponName}
            weaponImage={loadoutWeaponImage}
            weaponSeed={state.loadout.weaponSeed}
            weaponFloat={loadoutWeapon ? clampFloat(loadoutWeapon, state.loadout.weaponFloat ?? DEFAULT_FLOAT) : DEFAULT_FLOAT}
            glovesName={glovesName}
            glovesImage={glovesImage}
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

        {selection.kind === 'agent' && (
          <AgentPatchesSection worn={state.agentPatches} patches={patches} onChoose={(slot) => onOpenPicker({ kind: 'patch', slot })} onChange={state.setAgentPatch} />
        )}

        </div>
      </div>
    </aside>
  )
}
