import { useCallback, useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import { SEED_MAX } from '@/lib/config'
import type { AgentIndex } from '@/lib/data/agents'
import { CHARM_PATTERN_MAX, type AttachmentIndex } from '@/lib/data/attachments'
import type { CatalogIndex } from '@/lib/data/catalog'
import type { Item } from '@/lib/data/items'
import { asCommand, buildEmbedState, emit, EMBED_VERSION, replier, resolveTarget, type EmbedItemInfo, type EmbedOptions, type EmbedTarget } from '@/lib/embed'
import type { Selection } from '@/lib/selection'
import { agentPatchesFromParam, agentPatchesToParam } from '@/lib/url-state'
import type { ViewerStateApi, ViewOptions } from '@/lib/viewer-state'
import type { SkinViewer } from '@/lib/viewer/skin-viewer'
import type { Lighting, Viewmodel } from '@/lib/viewer/viewer-options'
import { watermarkScreenshot } from '@/lib/watermark'

// The embed's side of the postMessage protocol (lib/embed): options applied, the target resolved, events sent, commands heard.

interface Setters {
  setLighting: Dispatch<SetStateAction<Lighting>>
  setViewmodel: Dispatch<SetStateAction<Viewmodel>>
  setView: Dispatch<SetStateAction<ViewOptions>>
}

export function useEmbedOptions(state: ViewerStateApi, { setLighting, setViewmodel, setView }: Setters): (options: EmbedOptions) => void {
  return useCallback((o: EmbedOptions) => {
    const patch: Record<string, string | number | null> = {}
    if (o.float !== undefined) patch.float = o.float.toFixed(4)
    if (o.seed !== undefined) patch.seed = o.seed
    if (o.view !== undefined) patch.fp = o.view === 'fpv' ? 1 : null
    if (o.loadout_gloves !== undefined) patch.fpg = o.loadout_gloves || null
    if (o.loadout_agent !== undefined) patch.fpa = o.loadout_agent || null
    if (o.agent_patches !== undefined) patch.ap = agentPatchesToParam(agentPatchesFromParam(o.agent_patches)) || null
    if (o.sticker_card !== undefined) patch.card = o.sticker_card ? 1 : null
    if (o.pet_color !== undefined) patch.pv = Math.max(0, Math.round(o.pet_color)) || null
    if (o.pet_animation !== undefined) patch.pc = o.pet_animation || null
    if (Object.keys(patch).length) state.patch(patch)
    if (o.map !== undefined) setLighting((l) => ({ ...l, map: o.map && o.map !== 'studio' ? o.map : null }))
    const gloveFloat = o.loadout_gloves_float, gloveSeed = o.loadout_gloves_seed
    if (gloveFloat !== undefined || gloveSeed !== undefined) {
      setViewmodel((v) => ({ ...v, ...(gloveFloat !== undefined && { gloveFloat }), ...(gloveSeed !== undefined && { gloveSeed }) }))
    }
    if (o.viewmodel_sway !== undefined) setViewmodel((v) => ({ ...v, sway: o.viewmodel_sway! }))
    if (o.viewmodel_left_hand !== undefined) setViewmodel((v) => ({ ...v, leftHanded: o.viewmodel_left_hand! }))
    if (o.auto_rotate !== undefined) setView((v) => ({ ...v, spin: o.auto_rotate! }))
    if (o.knife_pose !== undefined) setView((v) => ({ ...v, knifePose: o.knife_pose!, back: o.side === undefined ? false : v.back }))
    if (o.side !== undefined) setView((v) => ({ ...v, back: o.side === 'back' }))
    if (o.sticker_wear !== undefined) state.setStickerWear(Math.max(0, Math.min(1, o.sticker_wear)))
    if (o.charm_pattern !== undefined) state.setCharm({ seed: Math.max(0, Math.min(CHARM_PATTERN_MAX, Math.round(o.charm_pattern))) })
    const weapon = o.loadout_weapon, weaponFloat = o.loadout_weapon_float, weaponSeed = o.loadout_weapon_seed
    if (weapon !== undefined || weaponFloat !== undefined || weaponSeed !== undefined) {
      state.updateLoadout({
        ...(weapon !== undefined && { weapon: weapon || null }),
        ...(weaponFloat !== undefined && { weaponFloat }),
        ...(weaponSeed !== undefined && { weaponSeed: Math.max(1, Math.min(SEED_MAX, Math.round(weaponSeed))) }),
      })
    }
  }, [state, setLighting, setViewmodel, setView])
}

interface TargetInputs {
  initialTarget: EmbedTarget | null
  initialStickers: string | null
  /** The options that came with the target, applied once it resolves. */
  pendingOptions: MutableRefObject<EmbedOptions>
  catalog: CatalogIndex | null
  attachments: AttachmentIndex | null
  agents: AgentIndex | null
  state: ViewerStateApi
  applyOptions: (options: EmbedOptions) => void
}

/** What the embed shows: the target (from the URL, then from cs3d:load) resolved against the catalog into a selection. */
export function useEmbedTarget({ initialTarget, initialStickers, pendingOptions, catalog, attachments, agents, state, applyOptions }: TargetInputs) {
  const [target, setTarget] = useState<EmbedTarget | null>(initialTarget)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [error, setError] = useState('')
  const firstStickers = useRef(initialStickers)

  useEffect(() => {
    if (!target || !catalog || !attachments) return
    const resolved = resolveTarget(target, catalog, attachments, agents)
    if (typeof resolved === 'string') {
      setError(resolved)
      emit({ type: 'cs3d:error', message: resolved })
      return
    }
    setError('')
    const o = pendingOptions.current
    pendingOptions.current = {}
    state.patch({
      st: firstStickers.current, charm: null, cseed: null, cx: null, cz: null, cpx: null, cpy: null, cpz: null, cst: null, swear: null, ap: null,
      ...resolved.params,
      float: (o.float ?? resolved.float)?.toFixed(4) ?? null,
      seed: o.seed ?? resolved.seed ?? null,
    })
    applyOptions({ ...o, float: undefined, seed: undefined })
    setSelection(resolved.selection)
    firstStickers.current = null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, catalog, attachments, agents])

  return { target, setTarget, selection, error }
}

/** What the embed says of the shown item (in cs3d:loaded and cs3d:state). */
export function useEmbedInfo(selection: Selection | null, item: Item | null, viewer: SkinViewer | null, state: ViewerStateApi): () => EmbedItemInfo | null {
  const stateRef = useRef(state)
  stateRef.current = state
  return useCallback((): EmbedItemInfo | null => selection && {
    kind: selection.kind,
    id: selection.kind === 'skin' ? `${selection.item}|${selection.kit}` : selection.id,
    floatMin: item?.floatMin,
    floatMax: item?.floatMax,
    canInspect: !!viewer?.canInspect,
    canInspectGloves: !!viewer?.canInspectGloves || item?.style === 'glove',
    ...(selection.kind === 'sticker' && { stickerWear: stateRef.current.stickerWear }),
    ...(selection.kind === 'charm' && { charmPattern: stateRef.current.charm.seed }),
    ...(selection.kind === 'pet' && { petColor: stateRef.current.petVariant, petAnimation: stateRef.current.petClip ?? '' }),
    ...(selection.kind === 'agent' && { agentPatches: agentPatchesToParam(stateRef.current.agentPatches) }),
  }, [selection, item, viewer])
}

/** Tells the host page as the item loads: cs3d:loading, then cs3d:loaded or cs3d:error. */
export function useEmbedStatusEvents(selection: Selection | null, status: string, loadError: string, catalogError: string, info: () => EmbedItemInfo | null): void {
  // A new selection keeps the previous one's status for a render: nothing is said until its own load starts.
  const awaitingLoad = useRef(false)
  useEffect(() => { awaitingLoad.current = true }, [selection])

  useEffect(() => {
    if (!selection) return
    if (status === 'loading') {
      awaitingLoad.current = false
      emit({ type: 'cs3d:loading' })
    } else if (awaitingLoad.current) return
    else if (status === 'ready') emit({ type: 'cs3d:loaded', item: info()! })
    else if (status === 'error') emit({ type: 'cs3d:error', message: loadError })
  }, [status, selection, loadError, info])

  useEffect(() => {
    if (catalogError) emit({ type: 'cs3d:error', message: catalogError })
  }, [catalogError])
}

interface CommandContext {
  viewer: SkinViewer | null
  state: ViewerStateApi
  lighting: Lighting
  viewmodel: Viewmodel
  view: ViewOptions
  applyOptions: (options: EmbedOptions) => void
  info: () => EmbedItemInfo | null
  shareUrl: () => string | null
  openShare: () => void
  pendingOptions: MutableRefObject<EmbedOptions>
  setTarget: (target: EmbedTarget) => void
  setView: Dispatch<SetStateAction<ViewOptions>>
}

const png = (canvas: HTMLCanvasElement) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))

/** Listens for the host page's commands and answers them; says cs3d:ready once it does. */
export function useEmbedCommands(context: CommandContext): void {
  const latest = useRef(context)
  latest.current = context

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const command = asCommand(e.data)
      if (!command) return
      const { viewer, state, lighting, viewmodel, view, applyOptions, info, shareUrl, openShare, pendingOptions, setTarget, setView } = latest.current
      const reply = replier(e)
      switch (command.type) {
        case 'cs3d:load':
          pendingOptions.current = command.options ?? {}
          setTarget({ ...command.target })
          break
        case 'cs3d:set':
          applyOptions(command.options ?? {})
          break
        case 'cs3d:setMap':
          applyOptions({ map: command.map })
          break
        case 'cs3d:inspect':
          viewer?.inspect()
          break
        case 'cs3d:inspectGloves':
          if (viewer?.canInspectGloves) viewer.inspectGloves()
          else void viewer?.lookAtGloves(state.agent ?? undefined)
          break
        case 'cs3d:resetView':
          viewer?.resetView()
          setView((v) => ({ ...v, back: false }))
          break
        case 'cs3d:screenshot': {
          const dataUrl = viewer?.screenshot()
          if (dataUrl) void watermarkScreenshot(dataUrl).then((marked) => reply({ type: 'cs3d:screenshot', id: command.id, dataUrl: marked }))
          break
        }
        case 'cs3d:screenshots': {
          if (!viewer) break
          const { front, back } = viewer.renderSides(command.longSide ?? 2400)
          void Promise.all([png(front), png(back)]).then(([frontBlob, backBlob]) => {
            if (frontBlob && backBlob) reply({ type: 'cs3d:screenshots', id: command.id, front: frontBlob, back: backBlob })
          })
          break
        }
        case 'cs3d:openShare':
          openShare()
          break
        case 'cs3d:share': {
          const url = shareUrl()
          if (url) reply({ type: 'cs3d:share', id: command.id, url })
          break
        }
        case 'cs3d:getState':
          reply({ type: 'cs3d:state', id: command.id, state: buildEmbedState({ item: info(), shareUrl: shareUrl(), state, lighting, viewmodel, view }) })
          break
      }
    }
    window.addEventListener('message', onMessage)
    emit({ type: 'cs3d:ready', version: EMBED_VERSION })
    return () => window.removeEventListener('message', onMessage)
  }, [])
}
