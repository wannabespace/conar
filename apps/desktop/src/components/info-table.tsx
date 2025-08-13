import type { ReactNode } from 'react'

export function InfoTable({ data }: { data: { name: string, value: ReactNode }[] }) {
  return (
    <div className="flex flex-col gap-1">
      {data.filter(({ value }) => value !== null && value !== undefined).map(({ name, value }) => (
        <div key={name} className="flex items-center gap-2">
          <span className="font-semibold text-muted-foreground/80 min-w-[60px]">{name}</span>
          <span className="text-foreground font-mono px-1.5 py-0.5 rounded bg-accent/40">{value}</span>
        </div>
      ))}
    </div>
  )
}
