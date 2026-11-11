import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HOME_FEATURES } from '@/lib/home'

export function FeatureGrid() {
  return (
    <div className="grid gap-5.5 sm:grid-cols-2 lg:grid-cols-4">
      {HOME_FEATURES.map(({ icon: Icon, title, text, to, cta }) => (
        <Link key={title} to={to} className="group docs-card flex flex-col transition-colors hover:border-white/20 hover:bg-white/[0.07]">
          <Icon className="size-5 text-muted-foreground" />
          <span className="mt-3 text-[15px] font-semibold leading-5.25">{title}</span>
          <span className="mt-1 flex-1 text-[15px] leading-6 text-muted-foreground">{text}</span>
          <span className="mt-4 flex items-center gap-1 text-[13px] font-medium text-foreground">{cta} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
        </Link>
      ))}
    </div>
  )
}
