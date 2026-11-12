import { useEffect, useLayoutEffect, useState, type RefObject } from 'react'
import { emit } from '@/lib/embed'
import type { SkinViewer } from '@/lib/viewer/skin-viewer'

/** The embed's own handling of the viewer: its fixed quality, pausing while off screen, and Escape passed up to the host page. */
export function useEmbedViewerSetup(viewer: SkinViewer | null, container: RefObject<HTMLElement | null>, quality: { lite: boolean; max: boolean }): void {
  const { lite, max } = quality

  useEffect(() => {
    if (viewer && lite) viewer.setQuality({ resolution: 1, antialias: false, post: true, adaptive: false })
  }, [viewer, lite])

  useEffect(() => {
    if (viewer && max) viewer.setQuality({ resolution: 'auto', antialias: true, post: true, adaptive: false })
  }, [viewer, max])

  useEffect(() => {
    const el = container.current
    if (!viewer || !el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => viewer.setPaused(!entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [viewer, container])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') emit({ type: 'cs3d:key', key: 'Escape' }) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/** While the item reloads, the last frame stays on screen (`frozen`) and fades out (`thawing`) once the new one is ready. */
export function useEmbedFreeze(viewer: SkinViewer | null, status: string, reloadKeys: readonly unknown[]): { frozen: HTMLCanvasElement | null; thawing: boolean } {
  const [frozen, setFrozen] = useState<HTMLCanvasElement | null>(null)
  const [thawing, setThawing] = useState(false)

  useLayoutEffect(() => {
    if (!viewer || status !== 'ready') return
    setFrozen(viewer.snapshotCanvas())
    setThawing(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, reloadKeys)

  useEffect(() => {
    if (!frozen || status !== 'ready') return
    setThawing(true)
    const timer = setTimeout(() => { setFrozen(null); setThawing(false) }, 400)
    return () => clearTimeout(timer)
  }, [frozen, status])

  return { frozen, thawing }
}
