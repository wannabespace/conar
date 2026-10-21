import { LayoutTable02Icon } from '@hugeicons/core-free-icons'
import { TableSkeleton } from '@tamery/table'
import { Button } from '@tamery/ui/components/button'
import { EmptyContent } from '@tamery/ui/components/empty'

import { useShareRows } from '~/hooks/use-share-rows'

import { EmptyState } from './empty-state'
import { ShareGrid } from './share-grid'
import { STATUSES } from './status-page'

export const ShareTable = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    refetch,
    search,
    sorting,
  } = useShareRows()
  const [first] = data.pages

  if (first?.status !== 'ready') {
    return (
      <EmptyState size="sm" {...STATUSES.unavailable}>
        <EmptyContent>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </EmptyContent>
      </EmptyState>
    )
  }

  const rows = data.pages.flatMap((page) =>
    page.status === 'ready'
      ? page.rows.map((row) =>
          Object.fromEntries(first.columns.map(({ id }, i) => [id, row[i]]))
        )
      : []
  )

  return (
    <>
      {rows.length === 0 ? (
        <EmptyState
          size="sm"
          icon={LayoutTable02Icon}
          title="No rows"
          description="Nothing in this table matches."
        />
      ) : (
        <ShareGrid
          columns={first.columns}
          hasNextPage={hasNextPage}
          isFetching={isFetching}
          onEndReached={() => hasNextPage && fetchNextPage()}
          orderBy={first.orderBy}
          rows={rows}
          search={search}
        />
      )}
      {sorting && (
        <div className="bg-background animate-in fade-in fill-mode-both absolute inset-0 delay-150 duration-150">
          <TableSkeleton selectable={false} />
        </div>
      )}
    </>
  )
}
