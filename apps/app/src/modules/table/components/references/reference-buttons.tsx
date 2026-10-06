import {
  ArrowDownLeft01Icon,
  ArrowUpRight01Icon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { PopoverTrigger } from '@tamery/ui/components/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { getRouteApi } from '@tanstack/react-router'
import { useRef } from 'react'

import { resourceRowsQueryInfiniteOptions } from '~/core/queries/rows/list'
import type { Column } from '~/core/table/cell/utils'
import { queryClient } from '~/lib/query-client'

import type { Hop } from './hops'
import { followReference, matchQuery } from './hops'
import { ReferencePeek } from './reference-peek'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const ReferenceTrigger = ({
  hop,
  icon,
  label,
}: {
  hop: Hop
  icon: IconSvgElement
  label: string
}) => {
  const { connectionResource } = useRouteContext()

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <PopoverTrigger
            payload={hop}
            render={
              <Button
                data-reference
                variant="ghost-row"
                size="icon-2xs"
                tabIndex={-1}
                aria-label={label}
                onDoubleClick={(event) => event.stopPropagation()}
                onPointerEnter={() => {
                  if (hop.kind === 'rows') {
                    queryClient.prefetchInfiniteQuery(
                      resourceRowsQueryInfiniteOptions(
                        matchQuery(connectionResource, hop)
                      )
                    )
                  }
                }}
              />
            }
          />
        }
      >
        <HugeiconsIcon
          icon={icon}
          strokeWidth={2}
          className="text-muted-foreground size-3"
        />
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}

export const ReferenceButtons = ({
  column,
  value,
}: {
  column: Column
  value: unknown
}) => {
  const ref = useRef<HTMLSpanElement>(null)
  const references = column.references ?? []
  if (
    value === null ||
    value === undefined ||
    (!column.foreign && references.length === 0)
  ) {
    return null
  }

  return (
    <ReferencePeek
      anchor={() => ref.current?.closest('[role="gridcell"]') ?? null}
    >
      <span ref={ref} className="ml-auto flex shrink-0">
        {column.foreign && (
          <ReferenceTrigger
            hop={followReference(column.foreign, value)}
            icon={ArrowUpRight01Icon}
            label={`Show the referenced ${column.foreign.table} row`}
          />
        )}
        {references.length > 0 && (
          <ReferenceTrigger
            hop={{ kind: 'references', references, value }}
            icon={ArrowDownLeft01Icon}
            label={`Show rows pointing here from ${references.length} table${references.length === 1 ? '' : 's'}`}
          />
        )}
      </span>
    </ReferencePeek>
  )
}
