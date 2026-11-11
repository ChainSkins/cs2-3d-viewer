import type { ReactNode } from 'react'

interface ApiSectionProps {
  id: string
  title: string
  intro?: ReactNode
  children: ReactNode
}


export function ApiSection({ id, title, intro, children }: ApiSectionProps) {
  return (
    <section id={id} className="scroll-mt-28 pt-7">
      <h2 className="group text-[22.5px] font-semibold leading-tight tracking-normal">
        {title}
        <a href={`#${id}`} aria-label={`Link to ${title}`} className="ml-2 text-muted-foreground no-underline opacity-0 transition group-hover:opacity-100">#</a>
      </h2>
      {intro && <p className="mt-3.75">{intro}</p>}
      <div className="mt-3.75">{children}</div>
    </section>
  )
}
