import type { ComponentProps, ReactNode } from 'react'

export const Chip = (props: ComponentProps<'div'>) => (
  <div
    {...props}
    className="ring-foreground/4 bg-chip flex h-5 shrink-0 items-stretch overflow-hidden rounded-md shadow-2xs ring"
  />
)

export const ChipDivider = () => (
  <span aria-hidden className="bg-border w-px shrink-0" />
)

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
  value: string | null
}) => (
  <Chip>
    <span className="flex items-center px-1.5 text-xs whitespace-nowrap">
      {column}
    </span>
    <ChipDivider />
    <span className="text-muted-foreground flex items-center px-1.5 text-xs whitespace-nowrap">
      {operator}
    </span>
    {value !== null && (
      <>
        <ChipDivider />
        <span className="flex items-center px-1.5 text-xs whitespace-nowrap">
          {value}
        </span>
      </>
    )}
    {children && (
      <>
        <ChipDivider />
        <span className="text-muted-foreground flex items-center px-1">
          {children}
        </span>
      </>
    )}
  </Chip>
)
