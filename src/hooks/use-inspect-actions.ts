import { useCallback } from 'react'
import { useKeyShortcut } from '@/hooks/use-key-shortcut'
import type { LoadStatus } from '@/hooks/use-skin-loader'
import type { Item } from '@/lib/data/items'
import type { Selection } from '@/lib/selection'
import type { SkinViewer } from '@/lib/viewer/skin-viewer'

export interface InspectActions {
  /** The first-person weapon has an inspect animation (F). */
  canInspect: boolean
  inspect: () => void
  /** The gloves can be looked at (G): first person with skin gloves, or a glove skin's page. */
  canInspectGloves: boolean
  inspectGloves: () => void
}

/** The stage's inspect actions (the weapon's, the gloves' look) and their keys. */
export function useInspectActions(viewer: SkinViewer | null, selection: Selection, item: Item | null, status: LoadStatus, firstPerson: boolean, agent: string | null): InspectActions {
  const ready = status === 'ready'
  const canInspect = firstPerson && ready && !!viewer?.canInspect
  const onGlovePage = selection.kind === 'skin' && item?.style === 'glove'
  const canInspectGloves = ready && ((firstPerson && !!viewer?.canInspectGloves) || onGlovePage)

  const inspect = useCallback(() => viewer?.inspect(), [viewer])
  /** First person with skin gloves looks at them; a glove skin's page shows them on the arms, looked at. */
  const inspectGloves = useCallback(() => {
    if (onGlovePage) void viewer?.lookAtGloves(agent ?? undefined)
    else viewer?.inspectGloves()
  }, [onGlovePage, viewer, agent])

  useKeyShortcut('f', canInspect, inspect)
  useKeyShortcut('g', canInspectGloves, inspectGloves)
  return { canInspect, inspect, canInspectGloves, inspectGloves }
}
