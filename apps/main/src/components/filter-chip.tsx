import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

export interface Filter {
  column: string
  operator: string
  value: string
}

const Divider = () => <span className="bg-border w-px shrink-0" />

export const FilterChip = ({ column, operator, value }: Filter) => (
  <span className="ring-foreground/4 bg-chip flex h-5 shrink-0 items-stretch overflow-hidden rounded-md text-xs whitespace-nowrap shadow-2xs ring">
    <span className="flex items-center px-1.5">{column}</span>
    <Divider />
    <span className="text-muted-foreground flex items-center px-1.5">
      {operator}
    </span>
    <Divider />
    <span className="flex items-center px-1.5">{value}</span>
    <Divider />
    <span className="text-muted-foreground flex items-center px-1">
      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5" />
    </span>
  </span>
)
