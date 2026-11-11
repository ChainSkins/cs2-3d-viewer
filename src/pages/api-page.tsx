import { ArrowRight, ArrowUpRight, BookOpen, Check, Code2, Copy, FlaskConical, MessagesSquare, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiSection } from '@/components/api/api-section'
import { BrandMark } from '@/components/common/brand-mark'
import { Callout } from '@/components/api/docs-callout'
import { CodeBlock } from '@/components/api/code-block'
import { DocTable } from '@/components/api/doc-table'
import { EmbedPlayground } from '@/components/api/embed-playground'
import { COMMANDS, EVENTS, LISTEN_SAMPLE, OPTION_PARAMS, TARGET_PARAMS } from '@/lib/api-docs'
import { DEFAULT_SKIN, WEB_ORIGIN } from '@/lib/config'
import { selectionPath } from '@/lib/selection'
import { cn } from '@/lib/utils'

const QUICK_START = `<iframe
  src="${WEB_ORIGIN}/embed?def=7&paint=180&float=0.05&seed=1&map=de_mirage"
  width="960" height="540" style="border:0" allow="fullscreen"></iframe>`

const HIGHLIGHTS = [
  { icon: Code2, title: 'One iframe', text: 'The URL picks the item (an inspect link, def + paint, a skin, sticker, charm or agent) and how it’s shown.' },
  { icon: MessagesSquare, title: 'Driven by postMessage', text: 'Change float, pattern, view or map, play the inspect, take a screenshot, read its state: no reload.' },
  { icon: ShieldCheck, title: 'Nothing kept', text: 'The embed leaves the visitor’s browser alone: the full viewer’s lighting, viewmodel and loadout stay untouched.' },
]

const NAV = [
  { heading: 'Getting started', items: [{ id: 'overview', title: 'Overview' }, { id: 'quick-start', title: 'Quick start' }, { id: 'playground', title: 'Playground' }] },
  { heading: 'URL parameters', items: [{ id: 'what', title: 'What to show' }, { id: 'how', title: 'How to show it' }] },
  { heading: 'Messages', items: [{ id: 'to-embed', title: 'To the embed' }, { id: 'from-embed', title: 'From the embed' }] },
  { heading: 'Reference', items: [{ id: 'notes', title: 'Good to know' }] },
]
const SECTION_IDS = NAV.flatMap((g) => g.items.map((i) => i.id))

const NOTES: [string, React.ReactNode][] = [
  ['Watermark', <>The embed carries a small chainskins.net watermark in its corner, linking to the full viewer and burnt into its screenshots. It is always there: <code>ui=0</code> doesn’t hide it.</>],
  ['Framing', <>Only <code>/embed</code> may be framed (it sends <code>frame-ancestors *</code>); the rest of the site can’t be put in an iframe.</>],
  ['Transparent', <><code>bg=transparent</code> drops the studio backdrop: your page shows through behind the item.</>],
  ['Example page', <>A plain HTML page driving an embed: <a href="/embed-example.html">/embed-example.html</a>.</>],
]


function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const update = () => {
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 180) current = id
      }
      setActive(current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [ids])
  return active
}

export function ApiPage() {
  const active = useActiveSection(SECTION_IDS)
  const [copied, setCopied] = useState(false)
  const viewer = selectionPath({ kind: 'skin', ...DEFAULT_SKIN })
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(QUICK_START)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { }
  }

  return (
    <div className="docs min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-background shadow-[0_1px_0_rgb(255_255_255/0.1)]">
        <div className="flex h-12.5 items-center gap-1 px-5">
          <BrandMark className="mr-3" />
          <Link to="/" className="docs-toplink hidden sm:inline-flex">Home</Link>
          <Link to={viewer} className="docs-toplink hidden sm:inline-flex">Viewer</Link>
          <a href="https://chainskins.net" className="docs-toplink hidden sm:inline-flex">Marketplace</a>
          <Link to={viewer} className="docs-toplink ml-auto">Open the viewer <ArrowUpRight className="size-3.5" /></Link>
        </div>
        <div className="flex h-10.5 items-center gap-1 overflow-x-auto px-5">
          <a href="#overview" className="docs-tab docs-tab-active"><BookOpen className="size-3.5" /> Embed API</a>
          <a href="#playground" className="docs-tab"><FlaskConical className="size-3.5" /> Playground</a>
          <a href="/embed-example.html" className="docs-tab">Example page</a>
          <span className="ml-auto shrink-0 rounded-md px-2 py-1 text-[12px] font-medium text-muted-foreground shadow-[0_0_0_1px_rgb(255_255_255/0.1)]">v1</span>
        </div>
        <nav aria-label="Sections" className="flex h-10 items-center gap-1 overflow-x-auto border-t border-white/10 px-4 lg:hidden">
          {NAV.flatMap((g) => g.items).map((item) => (
            <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? 'true' : undefined} className={cn('shrink-0 rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors', active === item.id ? 'bg-white/10 text-white' : 'text-muted-foreground')}>{item.title}</a>
          ))}
        </nav>
      </header>

      <div className="flex">
        <nav aria-label="Sections" className="sticky top-23 hidden h-[calc(100dvh-92px)] w-72 shrink-0 overflow-y-auto px-3.75 py-7 shadow-[1px_0_0_rgb(255_255_255/0.1)] lg:block">
          {NAV.map((group) => (
            <div key={group.heading} className="mb-6">
              <h2 className="my-2 pl-2.5 text-[11px] font-[650] uppercase leading-3.75 tracking-[0.5px] text-muted-foreground">{group.heading}</h2>
              {group.items.map((item) => (
                <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? 'true' : undefined} className={cn('docs-sidelink', active === item.id && 'docs-sidelink-active')}>{item.title}</a>
              ))}
            </div>
          ))}
          <div className="mb-6">
            <h2 className="my-2 pl-2.5 text-[11px] font-[650] uppercase leading-3.75 tracking-[0.5px] text-muted-foreground">Resources</h2>
            <a href="/embed-example.html" className="docs-sidelink">Example page <ArrowUpRight className="ml-auto size-3.5 opacity-70" /></a>
            <Link to={viewer} className="docs-sidelink">The full viewer <ArrowUpRight className="ml-auto size-3.5 opacity-70" /></Link>
          </div>
        </nav>

        <div className="flex min-w-0 flex-1 justify-center">
          <article className="docs-prose min-w-0 max-w-216 flex-1 p-5 pb-24 sm:p-8">
            <header id="overview" className="scroll-mt-40 lg:scroll-mt-28 border-b border-white/10 pb-8">
              <h1 className="text-[32px] font-[650] leading-[1.29] tracking-[-0.02em]">Embed API</h1>
              <p className="mt-3 text-[18px] leading-7">Put CS2 skins in 3D on your site with one iframe.</p>
            </header>

            <p className="mt-8">
              <code>/embed</code> is the viewer alone — just the 3D view, with the game’s own shaders, stickers, charms, first person and inspect
              maps. Drop it in an iframe, pick the item in its URL, and drive it with messages.
            </p>
            <div className="mt-4 grid gap-5.5 md:grid-cols-3">
              {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="docs-card">
                  <Icon className="size-5 text-muted-foreground" />
                  <div className="mt-3 text-[15px] font-semibold leading-5.25">{title}</div>
                  <p className="mt-1 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>

            <ApiSection id="quick-start" title="Quick start" intro="Paste this where the viewer should be. It shows the AK-47 | Fire Serpent at 0.05 float on Mirage.">
              <CodeBlock label="HTML" code={QUICK_START} />
            </ApiSection>

            <ApiSection id="playground" title="Playground" intro="A real embed. The controls send the messages listed below — watch them go out (→) and the embed answer (←), and copy the iframe for the setup you build.">
              <EmbedPlayground />
            </ApiSection>

            <ApiSection id="what" title="What to show" intro="One of these in the URL. If several are given, the first in this order wins.">
              <DocTable rows={TARGET_PARAMS} nameLabel="Param" />
            </ApiSection>

            <ApiSection id="how" title="How to show it" intro={<>The <code>loadout_*</code> params are what the player wears: they apply in first person (<code>view=fpv</code>) and on an agent, not to the item shown.</>}>
              <DocTable rows={OPTION_PARAMS} nameLabel="Param" withValues />
              <Callout title="Charms and stickers">
                A weapon’s charm comes only from an inspect link. Stickers and the charm can’t be changed by message yet: load another link
                instead (<code>cs3d:load</code> with <code>{'{ inspect }'}</code>).
              </Callout>
            </ApiSection>

            <ApiSection id="to-embed" title="Messages to the embed" intro={<>Send them with <code>iframe.contentWindow.postMessage(message, '*')</code>. Any page may drive an embed it frames; replies go back to the sender only.</>}>
              <DocTable rows={COMMANDS} nameLabel="Message" />
            </ApiSection>

            <ApiSection id="from-embed" title="Messages from the embed" intro={<>They arrive as <code>message</code> events on your page’s window. Check that <code>event.source</code> is the iframe’s window, and that <code>event.origin</code> is {WEB_ORIGIN}.</>}>
              <DocTable rows={EVENTS} nameLabel="Message" />
              <CodeBlock label="JavaScript" code={LISTEN_SAMPLE} className="mt-4" />
            </ApiSection>

            <ApiSection id="notes" title="Good to know">
              <ul className="grid gap-5.5 md:grid-cols-2">
                {NOTES.map(([title, body]) => (
                  <li key={title} className="docs-card">
                    <div className="text-[15px] font-semibold leading-5.25">{title}</div>
                    <p className="mt-1 text-muted-foreground">{body}</p>
                  </li>
                ))}
              </ul>
            </ApiSection>

            <hr className="mt-12 border-white/10" />
            <div className="py-5">
              <h3 className="text-[15px] font-bold tracking-normal">What’s next</h3>
              <ul className="mt-1 flex flex-col gap-1">
                <li><a href="/embed-example.html" className="inline-flex items-center gap-1.5">A plain HTML page driving an embed <ArrowRight className="size-3.5" /></a></li>
                <li><Link to={viewer} className="inline-flex items-center gap-1.5">Open the full viewer <ArrowRight className="size-3.5" /></Link></li>
              </ul>
            </div>
          </article>

          <aside className="sticky top-23 hidden h-fit w-70 shrink-0 py-7.5 pl-10 pr-5 xl:block">
            <button type="button" onClick={copy} className="mb-4 ml-5.75 mt-2 flex h-8 items-center gap-1.5 rounded-md border border-white/10 px-3 text-[14px] font-medium text-[#c9ccd4] transition hover:bg-white/5">
              {copied ? <><Check className="size-3.5" /> Copied</> : <><Copy className="size-3.5" /> Copy iframe</>}
            </button>
            <ul className="ml-5.75 flex flex-col gap-2 text-[13px] leading-[19.5px]">
              {NAV.flatMap((g) => g.items).slice(1).map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className={cn('block border-l pl-3 transition-colors', active === item.id ? 'border-white text-white' : 'border-transparent text-muted-foreground hover:text-white')}>{item.title}</a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  )
}
