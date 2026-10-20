import { LayoutTable02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { FilterChip } from '@tamery/ui/components/custom/filter-chip'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'

import { PasswordForm } from '~/components/password-form'
import { ShareGrid, shareSearch } from '~/components/share-grid'
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
  const { data, fetchNextPage, hasNextPage, isFetching } =
    useSuspenseInfiniteQuery(
      shareRowsQueryOptions({ id: shareId, sort: toSort(search) })
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
    <div className="mx-auto flex h-dvh w-full max-w-5xl flex-col gap-6 px-4 pt-4 pb-10 sm:px-6">
      <TopBar />
      <header className="flex shrink-0 flex-col gap-2 px-4">
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
          {`${plural(first.columns.length, 'column')} · `}
          <Tooltip>
            <TooltipTrigger render={<span />}>
              {hasNextPage
                ? `${rows.length}+ rows`
                : plural(rows.length, 'row')}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {`Updated ${formatDistanceToNow(first.fetchedAt, { addSuffix: true })}`}
            </TooltipContent>
          </Tooltip>
        </p>
        {first.filters.length > 0 && (
          <div data-mask className="flex flex-wrap gap-1 pt-1">
            {first.filters.map(({ column, operator, value }) => (
              <FilterChip
                key={`${column}-${operator}-${value}`}
                column={column}
                operator={operator}
                value={value ?? undefined}
              />
            ))}
          </div>
        )}
      </header>
      <main className="bg-background ring-foreground/4 flex min-h-0 flex-col overflow-hidden rounded-xl ring">
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
            isFetching={isFetching}
            onEndReached={() => hasNextPage && fetchNextPage()}
            rows={rows}
            search={search}
          />
        )}
      </main>
    </div>
  )
}

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? '' : 's'}`

export const Route = createFileRoute('/$shareId')({
  validateSearch: shareSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps, params }) => {
    const data = await context.queryClient.infiniteQuery({
      ...shareRowsQueryOptions({ id: params.shareId, sort: toSort(deps) }),
      staleTime: 'static',
    })
    return data.pages[0] ?? null
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
