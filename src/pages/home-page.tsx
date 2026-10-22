import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiTeaser } from '@/components/home/api-teaser'
import { FeatureGrid } from '@/components/home/feature-grid'
import { FeaturedSkins } from '@/components/home/featured-skins'
import { HomeFooter } from '@/components/home/home-footer'
import { HomeHero } from '@/components/home/home-hero'
import { MapGallery } from '@/components/home/map-gallery'
import { HomeSidebar } from '@/components/home/home-sidebar'
import { InspectDialog } from '@/components/inspect/inspect-dialog'
import { SkinPicker } from '@/components/picker/skin-picker'
import { useCatalog } from '@/hooks/use-catalog'
import { useInspectHistory } from '@/hooks/use-inspect-history'
import { useInspectLink } from '@/hooks/use-inspect-link'
import { useOpenPickerShortcut } from '@/hooks/use-open-picker-shortcut'
import type { InspectItem } from '@/lib/data/inspect'
import { selectionPath, type Selection } from '@/lib/selection'

function BlockTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[20px] font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-[13px] text-muted-foreground">{sub}</p>
    </div>
  )
}


export function HomePage() {
  const navigate = useNavigate()
  const { catalog, attachments, agents } = useCatalog()
  const history = useInspectHistory()
  const [picker, setPicker] = useState(false)
  const [inspect, setInspect] = useState(false)
  const loadInspect = useInspectLink(catalog, attachments, agents, '', useCallback(() => {}, []))
  useOpenPickerShortcut(!picker && !inspect, useCallback(() => setPicker(true), []))

  const loadRecent = (item: InspectItem, link: string) => {
    if (!loadInspect(item)) history.add(link)
  }

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh lg:flex-row lg:gap-3 lg:p-3">
      <HomeSidebar
        history={history.entries}
        catalog={catalog}
        attachments={attachments}
        agents={agents}
        onSearch={() => setPicker(true)}
        onInspect={() => setInspect(true)}
        onLoadRecent={loadRecent}
      />
      <main className="order-1 flex-1 border-white/10 lg:min-h-0 lg:overflow-y-auto lg:order-2 lg:rounded-3xl lg:border lg:shadow-[inset_0_1px_0_oklch(1_0_0/8%),0_30px_80px_-30px_oklch(0_0_0/90%)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-14 px-5 py-10 lg:px-10 lg:py-14">
          <HomeHero onInspect={() => setInspect(true)} />
          <section>
            <BlockTitle title="What it does" sub="Each card opens an example in the viewer." />
            <FeatureGrid />
          </section>
          <section>
            <BlockTitle title="The game’s maps" sub="Pick an inspect map and see a skin lit as in the game." />
            <MapGallery />
          </section>
          <section>
            <BlockTitle title="Featured skins" sub="A few well-known ones — or press / to search any item." />
            <FeaturedSkins catalog={catalog} />
          </section>
          <section>
            <BlockTitle title="For developers" sub="The same viewer, in your own page." />
            <ApiTeaser />
          </section>
          <HomeFooter />
        </div>
      </main>

      <SkinPicker
        open={picker}
        catalog={catalog}
        attachments={attachments}
        agents={agents}
        current={null}
        onPick={(selection: Selection) => navigate(selectionPath(selection))}
        onLoadInspect={loadInspect}
        onClose={() => setPicker(false)}
      />
      <InspectDialog open={inspect} catalog={catalog} attachments={attachments} agents={agents} onLoad={loadInspect} onClose={() => setInspect(false)} />
    </div>
  )
}
