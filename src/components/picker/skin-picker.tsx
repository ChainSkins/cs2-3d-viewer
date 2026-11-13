import { useEffect, useMemo, useRef, useState } from 'react'
import { Kbd } from '@/components/common/kbd'
import { Spinner } from '@/components/common/spinner'
import { ClipboardOffer } from '@/components/inspect/clipboard-offer'
import { CategoryNav } from '@/components/picker/category-nav'
import { HistoryList } from '@/components/picker/history-list'
import { PickerArrangeBar } from '@/components/picker/picker-arrange-bar'
import { LinkPanel } from '@/components/picker/link-panel'
import { PickerCard } from '@/components/picker/picker-card'
import { PickerToolbar } from '@/components/picker/picker-toolbar'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useDb } from '@/context/db-context'
import { useClipboardInspectLink } from '@/hooks/picker/use-clipboard-inspect-link'
import { useInfiniteList } from '@/hooks/picker/use-infinite-list'
import { useInspectHistory } from '@/hooks/picker/use-inspect-history'
import { usePickerShelf } from '@/hooks/picker/use-picker-shelf'
import { useLocalStorage } from '@/hooks/common/use-local-storage'
import { focusFirstGridItem, GRID_ITEM, moveGridFocus } from '@/lib/grid-focus'
import type { PatchIndex } from '@/lib/data/patches'
import type { PetIndex } from '@/lib/data/pets'
import type { PinIndex } from '@/lib/data/pins'
import type { AgentIndex } from '@/lib/data/agents'
import type { AttachmentIndex } from '@/lib/data/attachments'
import type { CatalogIndex } from '@/lib/data/catalog'
import type { InspectItem } from '@/lib/data/inspect'
import { inspectPreview } from '@/lib/inspect-preview'
import { looksLikeInspectLink, parseInspectQuery } from '@/lib/inspect-query'
import { arrangeGroups, CATEGORIES, categoryCounts, pickerGroups, raritiesIn, SHELVES, type PickerCard as Card, type PickerSort } from '@/lib/picker'
import type { Selection } from '@/lib/selection'

interface SkinPickerProps {
  open: boolean
  catalog: CatalogIndex | null
  attachments: AttachmentIndex | null
  current: Selection | null
  only?: 'Stickers' | 'Charms' | 'Agents' | 'Pins' | 'Patches' | 'Pets'
  agents?: AgentIndex | null
  pins?: PinIndex | null
  pets?: PetIndex | null
  patches?: PatchIndex | null
  startIn?: string
  onPick: (selection: Selection) => void
  onLoadInspect?: (item: InspectItem) => string | null
  onClose: () => void
}

const SURFACE = 'var(--surface)'

/** A card as kept on a shelf, where weapons mix: a skin names its weapon. */
const shelved = (card: Card, group: string): Card => (card.selection.kind === 'skin' && card.subtitle !== group ? { ...card, subtitle: group } : card)

const SCOPE_KIND: Record<NonNullable<SkinPickerProps['only']>, Selection['kind']> = { Stickers: 'sticker', Charms: 'charm', Agents: 'agent', Pins: 'pin', Patches: 'patch', Pets: 'pet' }

const isCurrent = (card: Card, current: Selection | null) => {
  if (!current || current.kind !== card.selection.kind) return false
  if (current.kind === 'skin' && card.selection.kind === 'skin') return current.item === card.selection.item && current.kit === card.selection.kit
  if (current.kind === 'pet' && card.selection.kind === 'pet') return current.id === card.selection.id && (current.variant ?? 0) === (card.selection.variant ?? 0)
  return current.kind !== 'skin' && card.selection.kind !== 'skin' && current.id === card.selection.id
}

export function SkinPicker({ open, catalog, attachments, agents = null, pins = null, patches = null, pets = null, current, only, startIn, onPick, onLoadInspect, onClose }: SkinPickerProps) {
  const initial = only ?? startIn ?? (current?.kind === 'sticker' ? 'Stickers' : current?.kind === 'charm' ? 'Charms' : current?.kind === 'agent' ? 'Agents' : current?.kind === 'pin' ? 'Pins' : current?.kind === 'patch' ? 'Patches' : current?.kind === 'pet' ? 'Pets'
    : CATEGORIES.find((c) => current?.kind === 'skin' && c.types?.includes(catalog?.items[current.item]?.type ?? ''))?.label ?? 'All')
  const [category, setCategory] = useState(initial)
  const [stickerKind, setStickerKind] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [portedOnly, setPortedOnly] = useState(true)
  const db = useDb()
  const body = useRef<HTMLDivElement>(null)
  const categories = only ? CATEGORIES.filter((c) => c.label === only) : CATEGORIES
  const searching = query.trim().length > 0
  const history = useInspectHistory()
  const shelf = usePickerShelf()
  const shelfList = category === 'Recent' ? shelf.recent : category === 'Favorites' ? shelf.favorites : null
  const inScope = (cards: Card[]) => (only ? cards.filter((c) => c.selection.kind === SCOPE_KIND[only]) : cards)
  const onShelf = !!shelfList && !searching
  const [showHistory, setShowHistory] = useState(false)
  const [sort, setSort] = useLocalStorage<PickerSort>('picker-sort', 'relevance')
  const [rarities, setRarities] = useState<number[]>([])
  const historyOn = showHistory && !!onLoadInspect && !only
  const [loadError, setLoadError] = useState('')
  const linkText = !only && onLoadInspect ? query.trim() : ''
  const linkMode = !historyOn && looksLikeInspectLink(linkText)
  const decoded = useMemo(() => (linkMode ? parseInspectQuery(linkText) : null), [linkMode, linkText])
  const preview = useMemo(() => (decoded?.item ? inspectPreview(decoded.item, catalog, attachments, db, agents) : null), [decoded, catalog, attachments, db, agents])
  const linkError = loadError || decoded?.error || ''
  const canLoadLink = !!decoded?.item && !preview?.problem
  const clipboardLink = useClipboardInspectLink(open && !!onLoadInspect && !only)
  const loadLink = () => {
    if (!decoded?.item || !canLoadLink) return
    const failure = onLoadInspect!(decoded.item)
    if (failure) setLoadError(failure)
    else {
      history.add(linkText)
      setQuery('')
      onClose()
    }
  }

  // Opening the picker (or opening it for something else) starts from its first category, with no search.
  const openedFor = open ? initial : null
  const [lastOpenedFor, setLastOpenedFor] = useState(openedFor)
  if (openedFor !== lastOpenedFor) {
    setLastOpenedFor(openedFor)
    if (openedFor !== null) {
      setCategory(openedFor)
      setQuery('')
      setShowHistory(false)
    }
  }
  useEffect(() => { body.current?.scrollTo({ top: 0 }) }, [category, query, historyOn, sort, rarities])
  const [lastQuery, setLastQuery] = useState(query)
  if (query !== lastQuery) {
    setLastQuery(query)
    setLoadError('')
  }
  // (rarity scales differ between skins, stickers and agents)
  const rarityScope = `${category}|${only}`
  const [lastRarityScope, setLastRarityScope] = useState(rarityScope)
  if (rarityScope !== lastRarityScope) {
    setLastRarityScope(rarityScope)
    setRarities([])
  }

  const baseCounts = useMemo(() => categoryCounts(catalog, attachments, portedOnly, agents, pins, patches, pets), [catalog, attachments, portedOnly, agents, pins, patches, pets])
  const counts = { ...baseCounts, Recent: inScope(shelf.recent).length, Favorites: inScope(shelf.favorites).length }
  const catalogGroups = useMemo(
    () => pickerGroups(catalog, attachments, { category, stickerKind, query, portedOnly, scope: only }, db, agents, pins, patches, pets),
    [catalog, attachments, db, agents, pins, patches, pets, category, stickerKind, query, portedOnly, only],
  )
  const found = onShelf ? [{ title: category === 'Recent' ? 'Recently opened' : 'Favorites', cards: inScope(shelfList) }].filter((g) => g.cards.length) : catalogGroups
  const available = useMemo(() => raritiesIn(found), [found])
  const groups = useMemo(() => arrangeGroups(found, sort, rarities), [found, sort, rarities])
  const scope = only ?? (searching ? 'All' : category)
  const naming = scope === 'Agents' ? 'agent' : scope === 'Stickers' || scope === 'Charms' || scope === 'Pins' || scope === 'Patches' || scope === 'Pets' ? 'other' : 'skin'
  const total = groups.reduce((n, g) => n + g.cards.length, 0)
  // Cards come in pages as you scroll (a category can hold thousands of stickers).
  const list = useInfiniteList(total, `${open}|${category}|${stickerKind}|${query}|${portedOnly}|${only}|${sort}|${rarities.join()}`, body)
  let budget = list.count
  const shown = groups.filter((g) => g.cards.length).flatMap((group) => {
    if (budget <= 0) return []
    const cards = group.cards.slice(0, budget)
    budget -= cards.length
    return [{ ...group, cards }]
  })
  const loading = onShelf ? false : only === 'Agents' ? !agents : only === 'Pins' ? !pins : only === 'Patches' ? !patches : only === 'Pets' ? !pets : only ? !attachments : !catalog
  const placeholder = only ? `Search ${only.toLowerCase()}` : onLoadInspect ? 'Search skins, charms and stickers, or paste an inspect link' : 'Search skins, charms and stickers: "die", "m4 howl"…'

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent showCloseButton={false} style={{ background: SURFACE }} className="flex h-[min(820px,92vh)] w-[min(1180px,96vw)] max-w-none flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-none">
        <DialogTitle className="sr-only">Choose a skin</DialogTitle>

        <PickerToolbar
          query={query}
          placeholder={historyOn ? 'Search your inspect history' : placeholder}
          history={onLoadInspect && !only ? historyOn : undefined}
          onHistory={(on) => { setShowHistory(on); setQuery('') }}
          onQuery={setQuery}
          onEnterGrid={() => focusFirstGridItem(body.current)}
          onSubmit={linkMode ? loadLink : undefined}
          onClose={onClose}
        />

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <CategoryNav
          shelves={SHELVES}
          categories={categories}
          active={searching || historyOn ? null : category}
          counts={counts}
          loaded={!loading}
          onSelect={(label) => { setCategory(label); setQuery(''); setShowHistory(false) }}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {historyOn ? (
            <div ref={body} className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
              <HistoryList
                entries={history.entries}
                query={query}
                catalog={catalog}
                attachments={attachments}
                agents={agents}
                onLoad={(item) => {
                  const failure = onLoadInspect!(item)
                  if (!failure) onClose()
                  return failure
                }}
                onRemove={history.remove}
                onClear={history.clear}
              />
            </div>
          ) : linkMode ? (
            <div ref={body} className="min-h-0 flex-1 overflow-y-auto">
              <LinkPanel preview={preview} error={linkError} canLoad={canLoadLink} loadingNames={!!preview && !catalog} onLoad={loadLink} />
            </div>
          ) : (
            <>
              {!searching && clipboardLink && !history.entries.some((e) => e.link === clipboardLink) && (
                <div className="px-5 pt-3">
                  <ClipboardOffer link={clipboardLink} catalog={catalog} attachments={attachments} agents={agents} onUse={() => setQuery(clipboardLink)} />
                </div>
              )}
              <PickerArrangeBar
                summary={loading ? 'Loading…' : searching && !only ? `${total} results for “${query.trim()}” in everything` : `${total} ${total === 1 ? 'item' : 'items'}`}
                sort={sort}
                available={available}
                rarities={rarities}
                naming={naming}
                stickerKind={category === 'Stickers' && !searching ? stickerKind : undefined}
                portedOnly={!only && !onShelf && category !== 'Stickers' && category !== 'Charms' ? portedOnly : undefined}
                onSort={setSort}
                onRarities={setRarities}
                onStickerKind={setStickerKind}
                onPortedOnly={setPortedOnly}
              />

              <div
                ref={body}
                className="min-h-0 flex-1 overflow-y-auto px-5 pb-6"
                onKeyDown={(e) => {
                  const from = e.target as HTMLElement
                  if (body.current && from.hasAttribute(GRID_ITEM) && moveGridFocus(body.current, from, e.key)) e.preventDefault()
                }}
              >
                {loading && <div className="py-16 text-center text-muted-foreground">Loading the catalog…</div>}
                {!loading && !total && (
                  <div className="py-16 text-center text-muted-foreground">
                    {onShelf && !rarities.length
                      ? category === 'Recent' ? 'What you open from here shows up here.' : 'Hover a card and click the star to keep it here.'
                      : rarities.length && !query ? 'Nothing of these rarities here.' : `Nothing matches “${query}”.`}
                  </div>
                )}
                {shown.map((group) => (
                  <section key={group.title}>
                    <div className="sticky top-0 z-10 -mx-5 flex items-baseline gap-2 px-5 pb-2.5 pt-4" style={{ background: SURFACE }}>
                      <span className="text-[13px] font-medium">{group.title}</span>
                      <span className="text-[11.5px] tabular-nums text-muted-foreground">{group.cards.length}</span>
                      {onShelf && category === 'Recent' && (
                        <button type="button" onClick={shelf.clearRecent} className="ml-auto text-[12px] text-muted-foreground transition-colors hover:text-foreground">Clear</button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:gap-2.5">
                      {group.cards.map((card) => (
                        <PickerCard
                          key={card.key}
                          card={card}
                          current={isCurrent(card, current)}
                          favorite={shelf.isFavorite(card.key)}
                          onFavorite={() => shelf.toggleFavorite(onShelf ? card : shelved(card, group.title))}
                          onPick={() => { shelf.addRecent(onShelf ? card : shelved(card, group.title)); onPick(card.selection); onClose() }}
                        />
                      ))}
                    </div>
                  </section>
                ))}
                {list.hasMore && (
                  <div ref={list.sentinel} className="flex items-center justify-center gap-2 py-6 text-[12px] text-muted-foreground">
                    <Spinner className="size-3.5" />
                    Loading more…
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        </div>

        <div className="hidden h-10 shrink-0 items-center gap-4 border-t border-border px-5 text-[11.5px] text-muted-foreground md:flex">
          <span className="flex items-center gap-1.5"><Kbd>↓</Kbd> to the cards</span>
          <span className="flex items-center gap-1.5"><Kbd>Arrows</Kbd> move</span>
          <span className="flex items-center gap-1.5"><Kbd>Enter</Kbd> pick</span>
          {onLoadInspect && !only && <span className="ml-auto">Paste an inspect link in the search to load it</span>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
