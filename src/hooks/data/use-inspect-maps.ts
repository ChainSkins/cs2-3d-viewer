import { useEffect, useState } from 'react'
import { ASSET_BASE } from '@/lib/config'
import { VIEWER_DATA } from '@/lib/data/catalog'
import type { InspectMap } from '@/lib/lighting'

let mapsRequest: Promise<InspectMap[]> | null = null

export function useInspectMaps(): InspectMap[] {
  const [maps, setMaps] = useState<InspectMap[]>([])
  useEffect(() => {
    mapsRequest ??= fetch(ASSET_BASE + VIEWER_DATA + 'maps.json').then((r) => r.json() as Promise<InspectMap[]>).catch(() => [])
    let live = true
    void mapsRequest.then((m) => { if (live) setMaps(m) })
    return () => { live = false }
  }, [])
  return maps
}
