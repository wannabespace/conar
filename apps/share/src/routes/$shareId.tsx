import { Alert02Icon, LayoutTable02Icon } from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { TableSkeleton } from '@tamery/table'
import { Button } from '@tamery/ui/components/button'
import { FilterChip } from '@tamery/ui/components/custom/filter-chip'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import { Skeleton } from '@tamery/ui/components/skeleton'
import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'
import type { ReactNode } from 'react'
import { Suspense, useDeferredValue } from 'react'

import { PasswordForm } from '~/components/password-form'
import { ShareGrid, shareSearch } from '~/components/share-grid'
import { StatusPage } from '~/components/status-page'
import { TopBar } from '~/components/top-bar'
import { shareInfoQueryOptions, shareRowsQueryOptions } from '~/lib/share-rows'

const toSort = ({ order, sort }: typeof shareSearch.infer) =>
  sort
    ? ({ column: sort, direction: order === 'desc' ? 'DESC' : 'ASC' } as const)
    : null

const useShareRows = () => {
  const { shareId } = Route.useParams()
  const search = Route.useSearch()
  const shownSearch = useDeferredValue(search)
  const query = useSuspenseInfiniteQuery(
    shareRowsQueryOptions({ id: shareId, sort: toSort(shownSearch) })
  )
  return { ...query, search, sorting: search !== shownSearch }
}

const UpdatedAt = () => {
  const { data } = useShareRows()
  const [first] = data.pages
  return (
    first?.status === 'ready' && (
      <p className="text-muted-foreground text-xs">
        {`Updated ${formatDistanceToNow(first.fetchedAt, { addSuffix: true })}`}
      </p>
    )
  )
}

const TableEmpty = ({
  children,
  description,
  icon,
  title,
}: {
  children?: ReactNode
  description: string
  icon: IconSvgElement
  title: string
}) => (
  <Empty size="sm">
    <EmptyHeader>
      <EmptyMedia variant="muted">
        <HugeiconsIcon icon={icon} strokeWidth={2} />
      </EmptyMedia>
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyDescription>{description}</EmptyDescription>
    </EmptyHeader>
    {children}
  </Empty>
)

const ShareTable = () => {
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
      <TableEmpty
        icon={Alert02Icon}
        title="This table cannot be loaded right now"
        description="The database behind this link is not answering. Try again in a little while."
      >
        <EmptyContent>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </EmptyContent>
      </TableEmpty>
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
        <TableEmpty
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

const SharePage = () => {
  const { shareId } = Route.useParams()
  const { data: info } = useSuspenseQuery(shareInfoQueryOptions(shareId))

  if (info.status === 'locked') {
    return <PasswordForm shareId={shareId} message={info.message} />
  }
  if (info.status !== 'ready') {
    return <StatusPage status={info.status} />
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-5xl flex-col gap-6 px-4 pt-4 pb-10 sm:px-6">
      <TopBar />
      <header className="flex shrink-0 flex-col gap-2 px-4">
        <h1
          data-mask
          className="text-3xl font-semibold tracking-tight text-balance"
        >
          {info.name}
        </h1>
        {info.description && (
          <p data-mask className="text-muted-foreground max-w-2xl text-sm">
            {info.description}
          </p>
        )}
        <Suspense fallback={<Skeleton className="my-0.5 h-3 w-36" />}>
          <UpdatedAt />
        </Suspense>
        {info.filters.length > 0 && (
          <div data-mask className="flex flex-wrap gap-1 pt-1">
            {info.filters.map(({ column, operator, value }) => (
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
      <main className="bg-background ring-foreground/4 relative flex min-h-0 flex-col overflow-hidden rounded-xl ring">
        <Suspense fallback={<TableSkeleton selectable={false} />}>
          <ShareTable />
        </Suspense>
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
    return context.queryClient.ensureQueryData(
      shareInfoQueryOptions(params.shareId)
    )
  },
  head: ({ loaderData }) => ({
    meta:
      loaderData?.status === 'ready'
        ? [
            { title: `${loaderData.name} · Tamery` },
            ...(loaderData.description
              ? [{ content: loaderData.description, name: 'description' }]
              : []),
            { content: loaderData.name, property: 'og:title' },
          ]
        : [],
  }),
  component: SharePage,
})
