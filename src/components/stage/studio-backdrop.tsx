export function StudioBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 35%, color-mix(in oklab, var(--sand-5) 70%, transparent), transparent 75%)' }} />
      <div
        className="absolute -inset-x-1/2 bottom-0 h-[58%] origin-bottom"
        style={{
          transform: 'perspective(520px) rotateX(64deg)',
          backgroundImage:
            'linear-gradient(color-mix(in oklab, var(--ink) 7%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--ink) 7%, transparent) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'linear-gradient(to top, black 5%, transparent 80%)',
        }}
      />
    </div>
  )
}
