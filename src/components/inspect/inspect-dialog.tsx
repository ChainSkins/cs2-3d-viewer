import { Link2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Callout } from '@/components/common/callout'
import { ClipboardOffer } from '@/components/inspect/clipboard-offer'
import { InspectLinkInput, type LinkState } from '@/components/inspect/inspect-link-input'
import { ItemPreview } from '@/components/inspect/item-preview'
import { RecentLinks } from '@/components/inspect/recent-links'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useDbImages } from '@/context/db-context'
import { useClipboardInspectLink } from '@/hooks/use-clipboard-inspect-link'
import { useInspectHistory } from '@/hooks/use-inspect-history'
import type { AgentIndex } from '@/lib/data/agents'
import type { AttachmentIndex } from '@/lib/data/attachments'
import type { CatalogIndex } from '@/lib/data/catalog'
import { decodeInspectLink, type InspectItem } from '@/lib/data/inspect'
import { inspectPreview } from '@/lib/inspect-preview'

interface InspectDialogProps {
  open: boolean
  catalog: CatalogIndex | null
  attachments: AttachmentIndex | null
  agents: AgentIndex | null
  onLoad: (item: InspectItem) => string | null
  onClose: () => void
}

type Decoded = { item: InspectItem; error?: undefined } | { item?: undefined; error: string }

function decode(text: string): Decoded | null {
  if (!text.trim()) return null
  try {
    return { item: decodeInspectLink(text) }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

/**
 * Paste an inspect link: the item data it carries (no request to anyone) is decoded here, shown in full as you
 * type — weapon, finish, float, pattern, stickers, charm — and handed to `onLoad`, which returns an error message
 * when the viewer can't show it.
 */
export function InspectDialog({ open, catalog, attachments, agents, onLoad, onClose }: InspectDialogProps) {
  const [text, setText] = useState('')
  const [loadError, setLoadError] = useState('')
  const images = useDbImages()
  const history = useInspectHistory()
  const clipboardLink = useClipboardInspectLink(open)
  const decoded = useMemo(() => decode(text), [text])
  const preview = useMemo(
    () => (decoded?.item ? inspectPreview(decoded.item, catalog, attachments, images, agents) : null),
    [decoded, catalog, attachments, images, agents],
  )
  const error = loadError || decoded?.error || ''
  const state: LinkState = error ? 'error' : decoded?.item ? 'ok' : 'empty'
  const canLoad = !!decoded?.item && !preview?.problem

  const change = (value: string) => {
    setText(value)
    setLoadError('')
  }

  const paste = async () => {
    try {
      change((await navigator.clipboard.readText()).trim())
    } catch {
      setLoadError('Could not read the clipboard. Paste with Ctrl+V instead.')
    }
  }

  /** Loads a link's item; on success it goes to the top of the history and the dialog closes. */
  const load = (item: InspectItem, link: string) => {
    const failure = onLoad(item)
    if (failure) setLoadError(failure)
    else {
      history.add(link)
      setText('')
      onClose()
    }
  }

  const submit = () => {
    if (decoded?.item && canLoad) load(decoded.item, text)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent showCloseButton={false} className="flex max-h-[min(860px,92vh)] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-160">
        <div className="relative flex shrink-0 items-center gap-3.5 border-b border-white/10 px-5 py-4">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-500/15 via-fuchsia-500/5 to-transparent" />
          <div className="bevel-primary relative grid size-11 shrink-0 place-items-center rounded-2xl text-white">
            <Link2 className="size-5" />
          </div>
          <div className="relative min-w-0 flex-1">
            <DialogTitle className="text-[16px] font-semibold tracking-tight">Inspect link</DialogTitle>
            <DialogDescription className="text-[12px] text-muted-foreground">
              Everything is read from the link itself. Nothing is sent anywhere.
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon-sm" className="relative" aria-label="Close" onClick={onClose}><X /></Button>
        </div>

        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-5">
          <InspectLinkInput value={text} state={state} compact={!!preview} onChange={change} onPaste={paste} onSubmit={submit} />
          {!text && clipboardLink && !history.entries.some((e) => e.link === clipboardLink) && (
            <ClipboardOffer link={clipboardLink} catalog={catalog} attachments={attachments} agents={agents} onUse={() => change(clipboardLink)} />
          )}
          {!text && <RecentLinks entries={history.entries} catalog={catalog} attachments={attachments} agents={agents} onLoad={load} />}
          {preview && !error && <ItemPreview preview={preview} />}
          {error && <Callout tone="error">{error}</Callout>}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-white/10 bg-black/15 px-5 py-3.5">
          {preview && !catalog && <span className="mr-auto text-[11px] text-muted-foreground">Loading the catalog for names…</span>}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!canLoad} onClick={submit}>Load item</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
