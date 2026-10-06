import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@tamery/ui/components/collapsible'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { Popover, PopoverContent } from '@tamery/ui/components/popover'
import { cn } from '@tamery/ui/lib/utils'
import type { RefObject } from 'react'

import {
  getDisplayValue,
  isNested,
} from '~/core/transformers/value-transformer'

export const JsonTree = ({
  defaultOpen,
  value,
}: {
  defaultOpen?: boolean
  value: object
}) => (
  <Collapsible defaultOpen={defaultOpen}>
    <CollapsibleTrigger variant="disclosure" className="group">
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        strokeWidth={2}
        className="size-3 transition-transform duration-200 group-data-panel-open:rotate-90"
      />
      {Array.isArray(value) ? `Array (${value.length})` : 'Object'}
    </CollapsibleTrigger>
    <CollapsibleContent variant="disclosure" className="mt-1 ml-1.5">
      <dl className="grid grid-cols-[minmax(4rem,max-content)_minmax(0,1fr)] gap-x-4 gap-y-1">
        {Object.entries(value).map(([key, entry]) => (
          <div key={key} className="col-span-2 grid grid-cols-subgrid">
            <dt data-mask className="text-muted-foreground truncate">
              {key}
            </dt>
            <dd className="min-w-0">
              {isNested(entry) ? (
                <JsonTree value={entry} />
              ) : (
                <span
                  data-mask
                  className={cn(
                    'wrap-break-word whitespace-pre-wrap',
                    entry === null && 'text-muted-foreground/60'
                  )}
                >
                  {getDisplayValue(entry, Infinity)}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </CollapsibleContent>
  </Collapsible>
)

export const JsonPeek = ({
  anchor,
  column,
  onClose,
  value,
}: {
  anchor: RefObject<HTMLElement | null>
  column: string
  onClose: () => void
  value: object
}) => (
  <Popover open onOpenChange={(open) => !open && onClose()}>
    <PopoverContent
      anchor={anchor}
      align="start"
      padding="none"
      className="w-md overflow-hidden"
      // React bubbles portal events to the grid, whose context menu would open over the popover.
      onContextMenu={(event) => event.stopPropagation()}
    >
      <div className="flex h-9 shrink-0 items-center border-b px-4 text-xs">
        <span data-mask className="truncate font-medium">
          {column}
        </span>
      </div>
      <ScrollArea className="scroll-fade max-h-[min(32rem,60vh)] min-h-0">
        <div className="px-4 py-3 text-xs select-text">
          <JsonTree defaultOpen value={value} />
        </div>
      </ScrollArea>
    </PopoverContent>
  </Popover>
)
