import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { SkinPicker } from '@/components/picker/skin-picker'
import { Sidebar } from '@/components/sidebar/sidebar'
import { Button } from '@/components/ui/button'
import { Stage } from '@/components/stage/stage'
import { ViewerStats } from '@/components/stage/viewer-stats'
import { useDb } from '@/context/db-context'
import { useAttachmentEditing } from '@/hooks/viewer/use-attachment-editing'
import { useCatalog } from '@/hooks/data/use-catalog'
import { useInspectActions } from '@/hooks/viewer/use-inspect-actions'
import { useInspectLink } from '@/hooks/picker/use-inspect-link'
import { useLighting } from '@/hooks/viewer/use-viewer-settings'
import { useLoadoutSync } from '@/hooks/viewer/use-loadout-sync'
import { useLocalStorage } from '@/hooks/common/use-local-storage'
import { useKeyShortcut } from '@/hooks/common/use-shortcuts'
import { useOpenPickerShortcut } from '@/hooks/common/use-shortcuts'
import { IS_MOBILE_DEVICE } from '@/lib/device'
import { watermarkScreenshot } from '@/lib/watermark'
import { useMapLighting } from '@/hooks/viewer/use-viewer-settings'
import { useRenderQuality } from '@/hooks/viewer/use-viewer-settings'
import { usePicker } from '@/hooks/picker/use-picker'
import { useShare } from '@/hooks/viewer/use-share'
import { useViewmodel } from '@/hooks/viewer/use-viewer-settings'
import { useSkinLoader } from '@/hooks/viewer/use-skin-loader'
import { useViewer } from '@/hooks/viewer/use-viewer'
import { useViewerState } from '@/hooks/viewer/use-viewer-state'
import { useViewerSync } from '@/hooks/viewer/use-viewer-sync'
import type { ViewOptions } from '@/lib/viewer-state'
import { headingFor, petThumb } from '@/lib/heading'
import { skinDisplayName } from '@/lib/picker'
import { selectionPath, skinKey, type Selection } from '@/lib/selection'

interface ViewerPageProps {
  selection: Selection
}

export function ViewerPage({ selection }: ViewerPageProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const { catalog, attachments, agents, pins, patches, pets, error: catalogError } = useCatalog()
  const state = useViewerState()
  const { quality, setQuality } = useRenderQuality()
  const viewer = useViewer(viewportRef, quality.antialias)
  useEffect(() => { viewer?.setQuality(quality) }, [viewer, quality])
  const { mapLighting, setMapLighting } = useMapLighting()
  useEffect(() => { viewer?.setMapLighting(mapLighting) }, [viewer, mapLighting])
  const readRenderStatus = useCallback(() => (viewer ? { pixelRatio: viewer.pixelRatio, fps: viewer.fps, lights: viewer.lightSources } : null), [viewer])
  const { item, weapon: heldWeapon, status, error, retry } = useSkinLoader(viewer, selection, state)
  const [view, setView] = useState<ViewOptions>({ spin: false, palmUp: false, knifePose: 'tilted', back: false })
  const [activeSticker, setActiveSticker] = useState(0)
  const [panelCollapsed, setPanelCollapsed] = useLocalStorage('panel-collapsed', false)
  const [hideUi, setHideUi] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const selectionKey = selectionPath(selection)
  // (a new item closes the phone's panel sheet)
  const [lastSelectionKey, setLastSelectionKey] = useState(selectionKey)
  if (selectionKey !== lastSelectionKey) {
    setLastSelectionKey(selectionKey)
    setSheetOpen(false)
  }
  const togglePanel = () => setPanelCollapsed((prev) => !prev)
  const [gloveGameLight, setGloveGameLight] = useLocalStorage('glove-game-light', true)
  useEffect(() => { viewer?.setGloveGameLight(gloveGameLight) }, [viewer, gloveGameLight])

  useViewerSync(viewer, selection, item, status, state, view)

  const { lighting, setLighting, presetId } = useLighting()
  useEffect(() => { viewer?.setLighting(lighting) }, [viewer, lighting])
  const { viewmodel, setViewmodel } = useViewmodel()
  useEffect(() => { viewer?.setViewmodel(viewmodel) }, [viewer, viewmodel])

  const skin = useMemo(
    () => (selection.kind === 'skin' ? catalog?.skins.find((s) => s.item === selection.item && s.kit === selection.kit) : undefined),
    [catalog, selection],
  )
  const db = useDb()
  const named = headingFor(selection, item, skin, attachments, catalog, db, agents, pins, patches, pets)
  // (a pet shows the colour picked in the panel)
  const heading = selection.kind === 'pet' ? { ...named, icon: petThumb(selection.id, state.petVariant) } : named
  const glovesName = useMemo(() => skinDisplayName(catalog, state.gloves), [catalog, state.gloves])
  const skinImage = useCallback((key: string | null) => {
    const worn = key ? catalog?.skins.find((s) => skinKey(s) === key) : undefined
    return worn ? db.skin(catalog!.items[worn.item]?.defindex, worn.paintIndex).image : undefined
  }, [catalog, db])
  const glovesImage = useMemo(() => skinImage(state.gloves), [skinImage, state.gloves])
  const loadoutWeaponImage = useMemo(() => skinImage(state.loadout.weapon), [skinImage, state.loadout.weapon])
  const wornAgent = state.agent ? agents?.agent.get(state.agent) : undefined

  const picker = usePicker(selection, item, state, setActiveSticker)
  const [editing, setEditing] = useState(false)
  // Guns only (knives and gloves carry no stickers or charm), and not from first person.
  const canEdit = selection.kind === 'skin' && !!item && item.style !== 'glove' && !/knife|bayonet/.test(item.id.split('|')[0]) && !state.firstPerson
  useAttachmentEditing(viewer, editing && canEdit, state, setActiveSticker)
  // (the view holds still while editing: no auto-rotate either)
  useEffect(() => { if (editing && canEdit) setView((prev) => (prev.spin ? { ...prev, spin: false } : prev)) }, [editing, canEdit, view.spin])
  const noDialog = picker.picker === null
  const isWeapon = selection.kind === 'skin' && !!item && item.style !== 'glove'
  useKeyShortcut('e', noDialog && canEdit, useCallback(() => setEditing((on) => !on), [setEditing]))
  const { firstPerson, setFirstPerson } = state
  useKeyShortcut('h', noDialog, useCallback(() => setHideUi((on) => !on), []))
  useKeyShortcut('v', noDialog && isWeapon, useCallback(() => setFirstPerson(!firstPerson), [firstPerson, setFirstPerson]))
  const { open: openPicker } = picker
  const openSelectionPicker = useCallback(() => openPicker({ kind: 'selection' }), [openPicker])
  useOpenPickerShortcut(picker.picker === null, openSelectionPicker)
  const loadInspect = useInspectLink(catalog, attachments, agents, state.search, useCallback(() => setActiveSticker(0), []))
  const actions = useInspectActions(viewer, selection, item, status, state.firstPerson, state.agent)
  const loadout = useLoadoutSync(viewer, selection, item, heldWeapon, status, state, catalog)
  const getShare = useShare({ viewer, selection, state, heading, item, skin, catalog, attachments, agents, db })

  const screenshot = async () => {
    const raw = viewer?.screenshot()
    if (!raw) return
    const url = await watermarkScreenshot(raw, item?.id.replace('|', ' | '))
    const link = document.createElement('a')
    link.href = url
    link.download = item ? `${item.id.replace('|', '-')}-${state.seed}.png` : `${selection.kind}.png`
    link.click()
  }

  const isKnife = !!item && item.style !== 'glove' && /knife|bayonet/.test(item.id.split('|')[0])

  return (
    <div className="relative flex h-dvh flex-col lg:flex-row">
      {!hideUi && (
        <Button variant="outline" size="icon-lg" className="absolute left-3 top-3 z-30 lg:hidden" aria-label={sheetOpen ? 'Close the panel' : 'Open the panel'} aria-expanded={sheetOpen} onClick={() => setSheetOpen((on) => !on)}>
          {sheetOpen ? <X /> : <SlidersHorizontal />}
        </Button>
      )}
      <div className={hideUi ? 'hidden' : 'contents'}>
      <Sidebar
          viewmodel={viewmodel}
          onViewmodel={setViewmodel}
          collapsed={panelCollapsed}
          onToggleCollapsed={togglePanel}
          selection={selection}
          heading={heading}
          item={item}
          attachments={attachments}
          patches={patches}
          pets={pets}
          state={state}
          glovesName={glovesName}
          glovesImage={glovesImage}
          agentName={state.agent ? wornAgent?.name ?? state.agent : null}
          agentImage={wornAgent ? db.agent(wornAgent.index).image : undefined}
          loadoutWeapon={heldWeapon}
          loadoutWeaponName={loadout.weaponName}
          loadoutWeaponImage={loadoutWeaponImage}
          onLoadoutFirstPerson={loadout.openFirstPerson}
          activeSticker={activeSticker}
          onActiveSticker={setActiveSticker}
          editing={canEdit ? editing : undefined}
          onToggleEditing={() => setEditing((on) => !on)}
          onOpenPicker={picker.open}
          loading={status === 'loading'}
          sheetOpen={sheetOpen}
          onCloseSheet={() => setSheetOpen(false)}
      />
      </div>
      <Stage
          viewportRef={viewportRef}
          heading={heading}
          loading={status === 'loading'}
          loadError={status === 'error' ? error || 'The model could not be loaded.' : ''}
          onRetry={retry}
          error={catalogError}
          ready={status === 'ready'}
          map={IS_MOBILE_DEVICE ? null : lighting.map}
          onMap={(map) => setLighting({ map })}
          getShare={getShare}
          canEdit={canEdit}
          editing={editing}
          onToggleEditing={() => setEditing((on) => !on)}
          quality={quality}
          onQuality={setQuality}
          lighting={lighting}
          lightingPreset={presetId}
          onLighting={setLighting}
          mapLighting={mapLighting}
          onMapLighting={setMapLighting}
          readRenderStatus={readRenderStatus}
          gloveGameLight={selection.kind === 'skin' && item?.style === 'glove' && !!lighting.map && !IS_MOBILE_DEVICE ? gloveGameLight : null}
          onGloveGameLight={setGloveGameLight}
          spin={view.spin}
          isWeapon={isWeapon}
          isGlove={selection.kind === 'skin' && item?.style === 'glove'}
          firstPerson={state.firstPerson}
          palmUp={view.palmUp}
          onToggleFirstPerson={() => state.setFirstPerson(!state.firstPerson)}
          onTogglePalmUp={() => setView((prev) => ({ ...prev, palmUp: !prev.palmUp }))}
          canInspect={actions.canInspect}
          onInspect={actions.inspect}
          canInspectGloves={actions.canInspectGloves}
          onInspectGloves={actions.inspectGloves}
          attacks={actions.attacks}
          onAttack={actions.attack}
          stats={<ViewerStats selection={selection} item={item} state={state} agents={agents} />}
          onToggleSpin={() => setView((prev) => ({ ...prev, spin: !prev.spin }))}
          showingBack={view.back}
          onSide={(back) => setView((prev) => ({ ...prev, back }))}
          knifePose={isKnife ? view.knifePose : null}
          onKnifePose={(knifePose) => setView((prev) => ({ ...prev, knifePose, back: false }))}
          hideUi={hideUi}
          onToggleUi={() => setHideUi((on) => !on)}
          onScreenshot={screenshot}
      />

      <SkinPicker
        open={picker.picker !== null}
        catalog={catalog}
        attachments={attachments}
        current={picker.current}
        agents={agents}
        pins={pins}
        patches={patches}
        pets={pets}
        only={picker.only}
        startIn={picker.startIn}
        onPick={picker.pick}
        onLoadInspect={picker.picker?.kind === 'selection' ? loadInspect : undefined}
        onClose={picker.close}
      />
    </div>
  )
}
