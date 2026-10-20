import type { ReactNode } from 'react'

const Divider = () => <span aria-hidden className="bg-border w-px shrink-0" />

/** A read-only picture of the table toolbar's chip; `children` is a trailing segment, such as the remove glyph. */
export const FilterChip = ({
  children,
  column,
  operator,
  value,
}: {
  children?: ReactNode
  column: string
  operator: string
  value?: string
}) => (
  <span className="ring-foreground/4 bg-chip flex h-5 shrink-0 items-stretch overflow-hidden rounded-md text-xs whitespace-nowrap shadow-2xs ring">
    <span className="flex items-center px-1.5">{column}</span>
    <Divider />
    <span className="text-muted-foreground flex items-center px-1.5">
      {operator}
    </span>
    {value !== undefined && (
      <>
        <Divider />
        <span className="flex items-center px-1.5">{value}</span>
      </>
    )}
    {children && (
      <>
        <Divider />
        <span className="text-muted-foreground flex items-center px-1">
          {children}
        </span>
      </>
    )}
  </span>
)
