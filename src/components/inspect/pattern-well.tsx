export function PatternWell({ value }: { value: number }) {
  return <div className="inset-well grid h-14.5 min-w-24 place-items-center rounded-xl px-4 font-mono text-[20px] font-medium tabular-nums">#{value}</div>
}
