import {
  ArrowUpDownIcon,
  Cancel01Icon,
  CommandIcon,
  HashtagIcon,
  MoreHorizontalIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { FilterChip } from '@tamery/ui/components/custom/filter-chip'
import { Kbd } from '@tamery/ui/components/kbd'

const FILTERS = [
  { column: 'total', operator: 'over', value: '200' },
  { column: 'users.plan', operator: 'is', value: 'pro' },
]

const Count = ({ count, icon }: { count: number; icon: IconSvgElement }) => (
  <Button variant="outline">
    <HugeiconsIcon
      icon={icon}
      strokeWidth={2}
      className="text-muted-foreground/60"
    />
    <span className="text-2xs font-normal tabular-nums">{count}</span>
  </Button>
)

export const Toolbar = () => (
  <div className="flex shrink-0 items-start gap-2 px-3 py-2">
    <Count count={14} icon={HashtagIcon} />
    <div className="bg-input ring-foreground/4 flex min-h-8 min-w-0 flex-1 items-center gap-1 rounded-xl border border-transparent py-0.75 pr-1.5 pl-2 shadow-xs ring">
      <HugeiconsIcon
        icon={Search01Icon}
        strokeWidth={2}
        className="text-muted-foreground mr-1 size-4 shrink-0"
      />
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        {FILTERS.map((filter) => (
          <FilterChip key={filter.column} {...filter}>
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
          </FilterChip>
        ))}
        <span className="text-muted-foreground truncate text-sm">
          Filter or ask AI…
        </span>
      </div>
      <Kbd>
        <HugeiconsIcon icon={CommandIcon} strokeWidth={2} />F
      </Kbd>
    </div>
    <div className="flex shrink-0 items-center gap-1">
      <Count count={1} icon={ArrowUpDownIcon} />
      <Button variant="outline" size="icon">
        <HugeiconsIcon
          icon={MoreHorizontalIcon}
          strokeWidth={2}
          className="text-muted-foreground/60"
        />
      </Button>
    </div>
  </div>
)
