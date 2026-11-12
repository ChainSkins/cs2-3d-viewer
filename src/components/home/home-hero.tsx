import { useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DEFAULT_SKIN } from '@/lib/config'
import { HERO_VIDEO } from '@/lib/home'
import { selectionPath } from '@/lib/selection'


export function HomeHero({ onSearch }: { onSearch: () => void }) {
  const [failed, setFailed] = useState(false)

  return (
    <section className="overflow-hidden">
    <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:pb-24 lg:pt-44">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="hero-glow left-1/2" style={{ background: 'radial-gradient(circle, rgb(249 115 22 / 30%) 0%, rgb(249 115 22 / 0%) 70%)' }} />
        <div className="hero-glow right-0" style={{ background: 'radial-gradient(circle, rgb(147 51 234 / 30%) 0%, rgb(147 51 234 / 0%) 70%)' }} />
        <div className="hero-glow right-1/2" style={{ background: 'radial-gradient(circle, rgb(59 130 246 / 40%) 0%, rgb(59 130 246 / 0%) 70%)' }} />
      </div>
      <div className="relative max-w-2xl">
        <Link to="/api" className="group inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
          <span className="font-medium text-foreground">New</span> Embed API <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <h1 className="mt-6 text-[36px] font-medium leading-[1.1] tracking-tight lg:text-[48px]">
          Any CS2 skin, <span className="text-muted-foreground">in 3D.</span>
        </h1>
        <p className="mt-5 text-[18px] leading-[1.55] text-muted-foreground lg:text-[21px]">
          Built on the game’s own shaders: the real float and pattern, stickers and charms, gloves and agents, first person with the
          inspect animation, and the game’s inspect maps.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" className="h-10 px-4 text-[15px]" render={<Link to={selectionPath({ kind: 'skin', ...DEFAULT_SKIN })} />}>
            Open the viewer
          </Button>
          <Button size="lg" variant="outline" className="h-10 px-4 text-[15px]" onClick={onSearch}>
            <Search /> Search or paste a link
          </Button>
        </div>
      </div>

      <div className="tile relative mt-14 aspect-video overflow-hidden p-0 lg:mt-20 lg:aspect-[2.2/1]">
        <div aria-hidden className="absolute inset-0 bg-linear-to-br from-secondary to-background" />
        {!failed && (
          <video
            title="AK-47 | Fire Serpent in 3D on Mirage"
            poster={HERO_VIDEO.poster}
            autoPlay muted loop playsInline preload="metadata"
            onError={() => setFailed(true)}
            className="absolute inset-0 size-full object-cover"
          >
            <source src={HERO_VIDEO.mp4} type="video/mp4" />
            <source src={HERO_VIDEO.webm} type="video/webm" onError={() => setFailed(true)} />
          </video>
        )}
        <span className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-[11.5px] text-white/90 backdrop-blur-sm"><span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />AK-47 | Fire Serpent · Mirage</span>
      </div>
    </div>
    </section>
  )
}
