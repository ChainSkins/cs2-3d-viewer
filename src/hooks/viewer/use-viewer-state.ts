import { useCallback, useMemo } from 'react'
import { useLiveSearchParams } from '@/hooks/common/use-live-search-params'
import { useLoadout } from '@/hooks/viewer/use-loadout'
import { SEED_MAX } from '@/lib/config'
import { agentPatchesFromParam, agentPatchesToParam, numberParam, stickersFromParam, stickersToParam } from '@/lib/url-state'
import type { CharmOptions } from '@/lib/viewer/skin-viewer'
import type { CharmState, Patch, ViewerState, ViewerStateApi } from '@/lib/viewer-state'

/**
 * The viewer's state as search params, so every view is a shareable link (and the shared loadout, in storage).
 * @param persistLoadout false: the loadout lives in memory only (the embed)
 */
export function useViewerState(persistLoadout = true): ViewerStateApi {
  const [params, patch] = useLiveSearchParams()
  const [loadout, updateLoadout] = useLoadout(persistLoadout)

  const floatParam = params.get('float')
  const state = useMemo<ViewerState>(() => ({
    float: floatParam === null ? null : Number(floatParam),
    seed: Math.max(1, Math.min(SEED_MAX, Math.round(numberParam(params, 'seed', 1)) || 1)),
    firstPerson: params.get('fp') === '1',
    gloves: params.has('fpg') ? params.get('fpg') : loadout.gloves,
    agent: params.has('fpa') ? params.get('fpa') : loadout.agent,
    stickers: stickersFromParam(params.get('st')),
    charm: {
      id: params.get('charm'),
      seed: numberParam(params, 'cseed', 0),
      offset: [numberParam(params, 'cx', 0), numberParam(params, 'cz', 0)],
      position: params.has('cpx') ? [numberParam(params, 'cpx', 0), numberParam(params, 'cpy', 0), numberParam(params, 'cpz', 0)] : null,
      sticker: params.get('cst'),
    },
    stickerWear: numberParam(params, 'swear', 0),
    stickerCard: params.get('card') === '1',
    agentPatches: agentPatchesFromParam(params.get('ap')),
    petVariant: Math.max(0, Math.round(numberParam(params, 'pv', 0)) || 0),
    petHat: params.get('ph'),
    petClip: params.get('pc'),
  }), [params, floatParam, loadout.gloves, loadout.agent])

  const { id, seed: charmSeed, offset, position, sticker } = state.charm
  const [offsetX, offsetZ] = offset
  const positionKey = position?.join(',') ?? ''
  const charmOptions = useMemo<CharmOptions | null>(
    () => (id ? { id, seed: charmSeed, offset: [offsetX, offsetZ], position: positionKey ? (positionKey.split(',').map(Number) as [number, number, number]) : null, sticker } : null),
    [id, charmSeed, offsetX, offsetZ, positionKey, sticker],
  )

  const setCharm = useCallback((changes: Partial<CharmState>) => {
    const out: Patch = {}
    if ('id' in changes) out.charm = changes.id ?? null
    if ('seed' in changes) out.cseed = changes.seed || null
    if ('offset' in changes) {
      out.cx = changes.offset![0] || null
      out.cz = changes.offset![1] || null
    }
    if ('position' in changes) {
      const p = changes.position
      out.cpx = p ? +p[0].toFixed(4) : null
      out.cpy = p ? +p[1].toFixed(4) : null
      out.cpz = p ? +p[2].toFixed(4) : null
    }
    if ('sticker' in changes) out.cst = changes.sticker ?? null
    patch(out)
  }, [patch])

  return {
    ...state,
    patch,
    search: params.toString(),
    setFloat: (value) => patch({ float: value.toFixed(4) }),
    setSeed: (value) => patch({ seed: value }),
    setFirstPerson: (on) => patch({ fp: on ? 1 : null }),
    setGloves: (key) => { updateLoadout({ gloves: key }); patch({ fpg: key }) },
    setAgent: (id) => { updateLoadout({ agent: id }); patch({ fpa: id }) },
    loadout,
    updateLoadout,
    setStickers: (list) => patch({ st: list.length ? stickersToParam(list) : null }),
    setCharm,
    setStickerWear: (value) => patch({ swear: value || null }),
    setStickerCard: (on) => patch({ card: on ? 1 : null }),
    setAgentPatch: (slot, worn) => {
      const list = agentPatchesFromParam(params.get('ap'))
      list[slot] = worn
      patch({ ap: agentPatchesToParam(list) || null })
    },
    setPetVariant: (index) => patch({ pv: index || null }),
    setPetHat: (name) => patch({ ph: name }),
    setPetClip: (name) => patch({ pc: name }),
    charmOptions,
  }
}
