import { ArrowRight, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/common/brand-mark'
import { Kbd } from '@/components/common/kbd'
import { RepoLink, ThemeToggle } from '@/components/common/top-bar-links'
import { Button } from '@/components/ui/button'
import { DEFAULT_SKIN } from '@/lib/config'
import { MOD_KEY } from '@/lib/keys'
import { selectionPath } from '@/lib/selection'
import { cn } from '@/lib/utils'

const LINK = 'inline-flex h-9 items-center rounded-full px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-ink/4 hover:text-foreground'

export function HomeHeader({ onSearch }: { onSearch: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <header className={cn('fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300', scrolled ? 'border-border bg-background/80 backdrop-blur-xl' : 'border-transparent')}>
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-3 sm:px-6">
        <BrandMark className="mr-4" />
        <nav aria-label="Sections" className="hidden items-center md:flex">
          <a href="#features" className={LINK}>Features</a>
          <a href="#maps" className={LINK}>Maps</a>
          <a href="#skins" className={LINK}>Skins</a>
          <Link to="/api" className={LINK}>Embed API</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <RepoLink className="max-sm:hidden" />
          <ThemeToggle />
          <Button variant="outline" size="lg" className="text-[13px]" onClick={onSearch} aria-label="Search an item or paste an inspect link">
            <Search /> <span className="hidden sm:inline">Search</span> <Kbd className="hidden sm:inline-flex">{MOD_KEY} K</Kbd>
          </Button>
          <Button size="lg" className="text-[13px]" render={<Link to={selectionPath({ kind: 'skin', ...DEFAULT_SKIN })} />}>
            <span className="sm:hidden">Viewer</span><span className="hidden sm:inline">Open the viewer</span> <ArrowRight className="hidden sm:block" />
          </Button>
        </div>
      </div>
    </header>
  )
}
