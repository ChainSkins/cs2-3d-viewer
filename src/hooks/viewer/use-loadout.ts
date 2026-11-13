import { useCallback, useState } from 'react'
import { useStoredSettings } from '@/hooks/common/use-local-storage'
import type { Loadout } from '@/lib/viewer-state'

const EMPTY: Loadout = { gloves: null, agent: null, weapon: null, weaponSeed: 1, weaponFloat: null }

/** The loadout used to be stored on its own, under this key: it is moved once to where the other preferences are. */
const OLD_KEY = 'loadout-v1', KEY = 'loadout', STORED_KEY = '3dviewer:' + KEY
try {
  const old = localStorage.getItem(OLD_KEY)
  if (old !== null) {
    if (localStorage.getItem(STORED_KEY) === null) localStorage.setItem(STORED_KEY, old)
    localStorage.removeItem(OLD_KEY)
  }
} catch { /* storage unavailable: nothing to move */ }

/** @param persist false: a loadout of its own, in memory, that starts empty (the embed) */
export function useLoadout(persist = true): [Loadout, (changes: Partial<Loadout>) => void] {
  const [stored, patchStored] = useStoredSettings<Loadout>(KEY, EMPTY)
  const [memory, setMemory] = useState<Loadout>(EMPTY)
  const patchMemory = useCallback((changes: Partial<Loadout>) => setMemory((prev) => ({ ...prev, ...changes })), [])
  return persist ? [stored, patchStored] : [memory, patchMemory]
}
