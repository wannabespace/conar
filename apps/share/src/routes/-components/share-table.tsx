import { LayoutTable02Icon } from '@hugeicons/core-free-icons'
import { TableSkeleton } from '@tamery/table'
import { Button } from '@tamery/ui/components/button'
import { IconEmpty } from '@tamery/ui/components/custom/icon-empty'
import { Spinner } from '@tamery/ui/components/spinner'

import { posthog } from '~/lib/posthog'

import { useShareRows } from '../-lib/use-share-rows'
import { ShareGrid } from './share-grid'

export const ShareTable = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchNextPageError,
    search,
    sorting,
  } = useShareRows()
  const columns = data.pages[0]?.columns ?? []
  const rows = data.pages.flatMap((page) =>
    page.rows.map((row) =>
      Object.fromEntries(columns.map(({ id }, i) => [id, row[i]]))
    )
  )

  return (
    <>
      {rows.length === 0 ? (
        <IconEmpty
          icon={LayoutTable02Icon}
          title="No rows"
          description="Nothing in this table matches."
        />
      ) : (
        <ShareGrid
          columns={columns}
          footer={
            hasNextPage && (
              <div className="pointer-events-none sticky left-0 flex h-80 w-[100cqw] items-center justify-center">
                {isFetchNextPageError ? (
                  <Button
                    variant="outline"
                    className="pointer-events-auto"
                    onClick={() => {
                      void posthog.capture('share_page_retried')
                      void fetchNextPage()
                    }}
                  >
                    Try again
                  </Button>
                ) : (
                  <Spinner />
                )}
              </div>
            )
          }
          isFetching={isFetching}
          onEndReached={() =>
            hasNextPage && !isFetchNextPageError && fetchNextPage()
          }
          orderBy={data.pages[0]?.orderBy ?? {}}
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
