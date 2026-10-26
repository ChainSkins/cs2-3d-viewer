import { useEffect, useState } from 'react'
import { ASSET_BASE } from '@/lib/config'
import { loadAgents, type AgentIndex } from '@/lib/data/agents'
import { loadAttachments, type AttachmentIndex } from '@/lib/data/attachments'
import { loadPins, type PinIndex } from '@/lib/data/pins'
import { loadIndex, type CatalogIndex } from '@/lib/data/catalog'

export interface CatalogState {
  catalog: CatalogIndex | null
  attachments: AttachmentIndex | null
  agents: AgentIndex | null
  pins: PinIndex | null
  error: string
}

/** Loads the skin catalog, the sticker / charm index, the agents and the pins once. */
export function useCatalog(): CatalogState {
  const [catalog, setCatalog] = useState<CatalogIndex | null>(null)
  const [attachments, setAttachments] = useState<AttachmentIndex | null>(null)
  const [agents, setAgents] = useState<AgentIndex | null>(null)
  const [pins, setPins] = useState<PinIndex | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadIndex(ASSET_BASE).then(setCatalog).catch((e: Error) => setError('Catalog: ' + e.message))
    loadAttachments(ASSET_BASE).then(setAttachments).catch((e: Error) => setError('Stickers / charms: ' + e.message))
    loadAgents(ASSET_BASE).then(setAgents).catch((e: Error) => setError('Agents: ' + e.message))
    loadPins(ASSET_BASE).then(setPins).catch((e: Error) => setError('Pins: ' + e.message))
  }, [])

  return { catalog, attachments, agents, pins, error }
}
