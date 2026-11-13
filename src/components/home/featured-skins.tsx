import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PickerCard } from '@/components/picker/picker-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDb } from '@/context/db-context'
import type { AgentIndex } from '@/lib/data/agents'
import type { AttachmentIndex } from '@/lib/data/attachments'
import type { CatalogIndex } from '@/lib/data/catalog'
import type { PinIndex } from '@/lib/data/pins'
import type { Db } from '@/lib/db'
import { FEATURED_ITEMS, type FeaturedItem } from '@/lib/home'
import { variantName } from '@/lib/picker'
import { rarityColor } from '@/lib/rarity'
import { parseSkinKey, selectionPath } from '@/lib/selection'
import { stickersToParam } from '@/lib/url-state'

interface FeaturedCard {
  key: string
  path: string
  card: { title: string; subtitle: string; color: string; icon?: string; extras?: string[] }
}

function featuredCard(entry: FeaturedItem, catalog: CatalogIndex, attachments: AttachmentIndex | null, pins: PinIndex | null, agents: AgentIndex | null, db: Db): FeaturedCard | null {
  if (entry.kind === 'sticker') {
    const s = attachments?.sticker.get(entry.id)
    if (!s) return null
    return { key: entry.id, path: selectionPath({ kind: 'sticker', id: s.id }), card: { title: s.name, subtitle: 'Sticker', color: rarityColor(db.sticker(s.index).rarity, s.rarity, '#b0c3d9'), icon: db.sticker(s.index).image } }
  }
  if (entry.kind === 'charm') {
    const c = attachments?.charm.get(entry.id)
    if (!c) return null
    return { key: entry.id, path: selectionPath({ kind: 'charm', id: c.id }), card: { title: c.name, subtitle: 'Charm', color: rarityColor(db.charm(c.index).rarity, c.rarity, '#8847ff'), icon: db.charm(c.index).image } }
  }
  if (entry.kind === 'agent') {
    const a = agents?.agent.get(entry.id)
    if (!a) return null
    const [name, faction] = a.name.split(' | ')
    return { key: entry.id, path: selectionPath({ kind: 'agent', id: a.id }), card: { title: name, subtitle: faction ?? 'Agent', color: rarityColor(db.agent(a.index).rarity, a.rarity, '#b0c3d9'), icon: db.agent(a.index).image } }
  }
  if (entry.kind === 'pin') {
    const p = pins?.pin.get(entry.id)
    if (!p) return null
    return { key: entry.id, path: selectionPath({ kind: 'pin', id: p.id }), card: { title: p.name.replace(/ Pin$/, ''), subtitle: 'Pin', color: rarityColor(db.pin(p.index).rarity, null, '#b0c3d9'), icon: db.pin(p.index).image } }
  }

  const parts = parseSkinKey(entry.key)
  const skin = parts && catalog.skins.find((s) => s.item === parts.item && s.kit === parts.kit)
  const item = skin && catalog.items[skin.item]
  if (!skin || !item) return null
  const dressed = !!entry.stickers?.length || !!entry.charm
  const params = new URLSearchParams()
  if (entry.stickers?.length) params.set('st', stickersToParam(entry.stickers.map((id, slot) => ({ id, slot, wear: 0, offset: [0, 0], rotation: 0, scale: 1 }))))
  if (entry.charm) params.set('charm', entry.charm)
  const query = params.toString()
  // The dressed weapon shows what it carries: its stickers' and charm's own pictures over the card.
  const extras = dressed && attachments
    ? [...(entry.stickers ?? []).map((id) => attachments.sticker.get(id)), ...(entry.charm ? [attachments.charm.get(entry.charm)] : [])]
        .map((x) => (x ? (x.id === entry.charm ? db.charm(x.index).image : db.sticker(x.index).image) : undefined))
        .filter((src): src is string => !!src)
    : undefined
  return {
    key: entry.key + (dressed ? '+' : ''),
    path: selectionPath({ kind: 'skin', item: skin.item, kit: skin.kit }) + (query ? `?${query}` : ''),
    card: {
      title: variantName(skin),
      subtitle: dressed ? `${item.displayName} · stickers and charm` : item.displayName,
      color: rarityColor(db.skin(item.defindex, skin.paintIndex).rarity, skin.rarity, '#71717a'),
      icon: db.skin(item.defindex, skin.paintIndex).image,
      extras,
    },
  }
}

interface FeaturedSkinsProps {
  catalog: CatalogIndex | null
  attachments: AttachmentIndex | null
  pins: PinIndex | null
  agents: AgentIndex | null
}

export function FeaturedSkins({ catalog, attachments, pins, agents }: FeaturedSkinsProps) {
  const db = useDb()
  const navigate = useNavigate()
  const cards = useMemo(
    () => (catalog ? FEATURED_ITEMS.map((entry) => featuredCard(entry, catalog, attachments, pins, agents, db)).filter((c): c is FeaturedCard => !!c) : []),
    [catalog, attachments, pins, agents, db],
  )

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-3">
      {!catalog && FEATURED_ITEMS.map((_, i) => <Skeleton key={i} className="h-47.5 rounded-2xl" />)}
      {cards.map(({ key, path, card }) => (
        <PickerCard key={key} card={card} current={false} onPick={() => navigate(path)} />
      ))}
    </div>
  )
}
