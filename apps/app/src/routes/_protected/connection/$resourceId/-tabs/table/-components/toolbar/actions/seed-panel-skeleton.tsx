import { pseudoRandom } from '@tamery/shared/utils/helpers'
import { Skeleton } from '@tamery/ui/components/skeleton'

import { SidebarButton } from '~/components/sidebar-link'
import type { Column } from '~/entities/connection/components/table/cell/utils'

const GENERATOR_ROWS = 8

// The column names are already in hand, so only the inspector — which waits on
// the generators chunk — stands in as skeleton; the list swaps in place.
export const SeedPanelSkeleton = ({ columns }: { columns: Column[] }) => (
  <div className="flex min-h-0 flex-1">
    <div className="no-scrollbar flex w-72 shrink-0 flex-col gap-px overflow-hidden border-r p-2">
      {columns.map((column, index) => (
        <SidebarButton key={column.id} disabled active={index === 0}>
          <span data-mask className="min-w-0 flex-1 truncate text-left">
            {column.id}
          </span>
        </SidebarButton>
      ))}
    </div>
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-9 shrink-0 items-center justify-between border-b px-3">
        <Skeleton className="h-2.5 w-24 rounded-full" />
        <Skeleton className="h-2.5 w-14 rounded-full" />
      </div>
      <div className="flex h-9 shrink-0 items-center border-b px-3">
        <Skeleton className="h-2.5 w-28 rounded-full" />
      </div>
      <div className="flex flex-col gap-px p-1">
        {Array.from({ length: GENERATOR_ROWS }, (_, index) => (
          <div
            // oxlint-disable-next-line react/no-array-index-key
            key={index}
            className="flex h-7 items-center px-2"
          >
            <Skeleton
              className="h-2.5 rounded-full"
              style={{ width: `${30 + pseudoRandom(index) * 40}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  </div>
)
