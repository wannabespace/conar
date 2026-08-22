import type { ReactNode } from 'react'

export const InfoTable = ({
  data,
}: {
  data: { name: string; value: ReactNode }[]
}) => (
  <div className="flex flex-col gap-1">
    {data
      .filter(({ value }) => value !== null && value !== undefined)
      .map(({ name, value }) => (
        <div key={name} className="flex items-center gap-2">
          <span className="text-muted-foreground min-w-15 font-medium">
            {name}
          </span>
          <span className="bg-muted text-foreground rounded-sm px-1.5 py-0.5 font-mono">
            {value}
          </span>
        </div>
      ))}
  </div>
)
