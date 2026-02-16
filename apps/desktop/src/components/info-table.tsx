import type { ReactNode } from 'react'

export function InfoTable({ data }: { data: { name: string, value: ReactNode }[] }) {
  return (
    <div className="flex flex-col gap-1">
      {data.filter(({ value }) => value !== null && value !== undefined).map(({ name, value }) => (
        <div key={name} className="flex items-center gap-2">
          <span className="min-w-[60px] font-medium text-muted-foreground">{name}</span>
          <span className="
            rounded-sm bg-accent/40 px-1.5 py-0.5 font-mono text-foreground
          "
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}
