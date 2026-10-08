import {
  ArrowDownLeft01Icon,
  ArrowUpRight01Icon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { getRouteApi } from '@tanstack/react-router'

import { matchingRowsQueryOptions } from '~/core/queries/rows/list'
import type { Column } from '~/core/table/cell/utils'
import { queryClient } from '~/lib/query-client'
import { plural } from '~/utils/plural'

import type { Hop } from './hops'
import { followReference } from './hops'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export type OpenPeek = (anchor: Element, hop: Hop) => void

const ReferenceTrigger = ({
  hop,
  icon,
  label,
  onPeek,
}: {
  hop: Hop
  icon: IconSvgElement
  label: string
  onPeek: OpenPeek
}) => {
  const { connectionResource } = useRouteContext()

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost-row"
            size="icon-2xs"
            tabIndex={-1}
            aria-label={label}
            onClick={({ currentTarget }) =>
              onPeek(
                currentTarget.closest('[role="gridcell"]') ?? currentTarget,
                hop
              )
            }
            onDoubleClick={(event) => event.stopPropagation()}
            onPointerEnter={() => {
              if (hop.kind === 'rows') {
                queryClient.prefetchInfiniteQuery(
                  matchingRowsQueryOptions({ connectionResource, ...hop })
                )
              }
            }}
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
  onPeek,
  value,
}: {
  column: Column
  onPeek: OpenPeek
  value: unknown
}) => {
  const references = column.references ?? []
  if (
    value === null ||
    value === undefined ||
    (!column.foreign && references.length === 0)
  ) {
    return null
  }

  return (
    <span className="ml-auto flex shrink-0">
      {column.foreign && (
        <ReferenceTrigger
          hop={followReference(column.foreign, value)}
          icon={ArrowUpRight01Icon}
          label={`Show the referenced ${column.foreign.table} row`}
          onPeek={onPeek}
        />
      )}
      {references.length > 0 && (
        <ReferenceTrigger
          hop={{ kind: 'references', references, value }}
          icon={ArrowDownLeft01Icon}
          label={`Show rows pointing here from ${plural(references.length, 'table')}`}
          onPeek={onPeek}
        />
      )}
    </span>
  )
}
