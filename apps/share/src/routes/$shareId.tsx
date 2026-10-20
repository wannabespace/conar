import { LayoutTable02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { TableSkeleton } from '@tamery/table'
import { FilterChip } from '@tamery/ui/components/custom/filter-chip'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'
import { useDeferredValue } from 'react'

import { PasswordForm } from '~/components/password-form'
import { ShareGrid, shareSearch } from '~/components/share-grid'
import {
  SHARE_HEADER_CLASS,
  SHARE_PAGE_CLASS,
  SHARE_TABLE_CLASS,
  ShareSkeleton,
} from '~/components/share-skeleton'
import { StatusPage } from '~/components/status-page'
import { TopBar } from '~/components/top-bar'
import { shareRowsQueryOptions } from '~/lib/share-rows'

const toSort = ({ order, sort }: typeof shareSearch.infer) =>
  sort
    ? ({ column: sort, direction: order === 'desc' ? 'DESC' : 'ASC' } as const)
    : null

const SharePage = () => {
  const { shareId } = Route.useParams()
  const search = Route.useSearch()
  const shownSearch = useDeferredValue(search)
  const { data, fetchNextPage, hasNextPage, isFetching } =
    useSuspenseInfiniteQuery(
      shareRowsQueryOptions({ id: shareId, sort: toSort(shownSearch) })
    )
  const [first] = data.pages

  if (first?.status === 'locked') {
    return <PasswordForm shareId={shareId} message={first.message} />
  }
  if (first?.status !== 'ready') {
    return <StatusPage status={first?.status ?? 'unavailable'} />
  }

  const rows = data.pages.flatMap((page) =>
    page.status === 'ready'
      ? page.rows.map((row) =>
          Object.fromEntries(first.columns.map(({ id }, i) => [id, row[i]]))
        )
      : []
  )

  return (
    <div className={SHARE_PAGE_CLASS}>
      <TopBar />
      <header className={SHARE_HEADER_CLASS}>
        <h1
          data-mask
          className="text-3xl font-semibold tracking-tight text-balance"
        >
          {first.name}
        </h1>
        {first.description && (
          <p data-mask className="text-muted-foreground max-w-2xl text-sm">
            {first.description}
          </p>
        )}
        <p className="text-muted-foreground text-xs">
          {`Updated ${formatDistanceToNow(first.fetchedAt, { addSuffix: true })}`}
        </p>
        {first.filters.length > 0 && (
          <div data-mask className="flex flex-wrap gap-1 pt-1">
            {first.filters.map(({ column, operator, value }) => (
              <FilterChip
                key={`${column}-${operator}-${value}`}
                column={column}
                operator={operator}
                value={value}
              />
            ))}
          </div>
        )}
      </header>
      <main className={SHARE_TABLE_CLASS}>
        {rows.length === 0 ? (
          <Empty size="sm">
            <EmptyHeader>
              <EmptyMedia variant="muted">
                <HugeiconsIcon icon={LayoutTable02Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No rows</EmptyTitle>
              <EmptyDescription>
                Nothing in this table matches.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
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
        {search !== shownSearch && (
          <div className="bg-background animate-in fade-in fill-mode-both absolute inset-0 delay-150 duration-150">
            <TableSkeleton selectable={false} />
          </div>
        )}
      </main>
    </div>
  )
}

export const Route = createFileRoute('/$shareId')({
  validateSearch: shareSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps, params }) => {
    void context.queryClient.ensureInfiniteQueryData(
      shareRowsQueryOptions({ id: params.shareId, sort: toSort(deps) })
    )
  },
  pendingComponent: ShareSkeleton,
  component: SharePage,
})
