import { useCallback, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiTeaser } from '@/components/home/api-teaser'
import { FeatureGrid } from '@/components/home/feature-grid'
import { FeaturedSkins } from '@/components/home/featured-skins'
import { HomeFooter } from '@/components/home/home-footer'
import { HomeHeader } from '@/components/home/home-header'
import { HomeHero } from '@/components/home/home-hero'
import { MapGallery } from '@/components/home/map-gallery'
import { RecentLinks } from '@/components/inspect/recent-links'
import { SkinPicker } from '@/components/picker/skin-picker'
import { useCatalog } from '@/hooks/use-catalog'
import { useInspectHistory } from '@/hooks/use-inspect-history'
import { useInspectLink } from '@/hooks/use-inspect-link'
import { useOpenPickerShortcut } from '@/hooks/use-open-picker-shortcut'
import type { InspectItem } from '@/lib/data/inspect'
import { selectionPath, type Selection } from '@/lib/selection'

interface BandProps {
  id: string
  eyebrow: string
  title: string
  sub: string
  children: ReactNode
}

function Band({ id, eyebrow, title, sub, children }: BandProps) {
  return (
    <section id={id} className="scroll-mt-14 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-28">
        <span className="text-[13px] tracking-wide text-muted-foreground">{eyebrow}</span>
        <div className="mt-4 grid items-end gap-4 lg:grid-cols-2 lg:gap-16">
          <h2 className="max-w-lg text-[28px] font-medium leading-[1.2] tracking-tight lg:text-[42px]">{title}</h2>
          <p className="text-[18px] leading-[1.55] text-muted-foreground lg:text-[21px]">{sub}</p>
        </div>
        <div className="mt-10 lg:mt-16">{children}</div>
      </div>
    </section>
  )
}


export function HomePage() {
  const navigate = useNavigate()
  const { catalog, attachments, agents, pins, patches, pets } = useCatalog()
  const history = useInspectHistory()
  const [picker, setPicker] = useState(false)
  const loadInspect = useInspectLink(catalog, attachments, agents, '', useCallback(() => {}, []))
  useOpenPickerShortcut(!picker, useCallback(() => setPicker(true), []))
  const openPicker = () => setPicker(true)

  const loadRecent = (item: InspectItem, link: string) => {
    if (!loadInspect(item)) history.add(link)
  }

  return (
    <div className="home-page min-h-dvh">
      <HomeHeader onSearch={openPicker} />
      <main>
        <HomeHero onSearch={openPicker} />
        {history.entries.length > 0 && (
          <Band id="recent" eyebrow="Recent" title="Pick up where you left off" sub="The inspect links you pasted in the search. A click loads one again.">
            <div className="max-w-2xl">
              <RecentLinks entries={history.entries} catalog={catalog} attachments={attachments} agents={agents} onLoad={loadRecent} limit={6} />
            </div>
          </Band>
        )}
        <Band id="features" eyebrow="The viewer" title="What it does" sub="Each card opens an example in the viewer.">
          <FeatureGrid />
        </Band>
        <Band id="maps" eyebrow="Maps" title="The game’s maps" sub="Pick an inspect map and see a skin lit as in the game.">
          <MapGallery />
        </Band>
        <Band id="skins" eyebrow="Skins" title="Featured skins" sub="A few well-known ones — or press / to search any item.">
          <FeaturedSkins catalog={catalog} />
        </Band>
        <Band id="developers" eyebrow="For developers" title="The same viewer, in your own page" sub="One iframe, driven by postMessage.">
          <ApiTeaser />
        </Band>
      </main>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 pb-2 pt-12 sm:px-6">
          <HomeFooter />
        </div>
      </div>

      <SkinPicker
        open={picker}
        catalog={catalog}
        attachments={attachments}
        agents={agents}
        pins={pins}
        patches={patches}
        pets={pets}
        current={null}
        onPick={(selection: Selection) => navigate(selectionPath(selection))}
        onLoadInspect={loadInspect}
        onClose={() => setPicker(false)}
      />
    </div>
  )
}
