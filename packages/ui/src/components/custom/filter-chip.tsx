import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ComponentProps } from 'react'

import { chipSegmentVariants } from './filter-chip.utils'

export const Chip = (props: ComponentProps<'div'>) => (
  <div
    {...props}
    className="ring-foreground/4 bg-chip flex h-5 shrink-0 items-stretch overflow-hidden rounded-md shadow-2xs ring"
  />
)

export const ChipDivider = () => (
  <span aria-hidden className="bg-border w-px shrink-0" />
)

/** A read-only picture of the table toolbar's chip. */
export const FilterChip = ({
  column,
  operator,
  removable,
  value,
}: {
  column: string
  operator: string
  removable?: boolean
  value: string | null
}) => (
  <Chip>
    <span className={chipSegmentVariants({ part: 'column' })}>{column}</span>
    <ChipDivider />
    <span className={chipSegmentVariants({ part: 'operator' })}>
      {operator}
    </span>
    {value !== null && (
      <>
        <ChipDivider />
        <span className={chipSegmentVariants({ part: 'value' })}>
          <span className="truncate">{value}</span>
        </span>
      </>
    )}
    {removable && (
      <>
        <ChipDivider />
        <span className={chipSegmentVariants({ part: 'icon' })}>
          <HugeiconsIcon
            icon={Cancel01Icon}
            strokeWidth={2}
            className="size-3.5"
          />
        </span>
      </>
    )}
  </Chip>
)
