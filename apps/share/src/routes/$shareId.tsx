import {
  ArrowRight01Icon,
  Download04Icon,
  HashtagIcon,
  LayoutTable02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { shareRefreshLabels } from '@tamery/shared/enums/share-refresh'
import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { Button } from '@tamery/ui/components/button'
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

import { PasswordForm } from '~/components/password-form'
import { ShareGrid, shareSearch } from '~/components/share-grid'
import { StatusPage } from '~/components/status-page'
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
    <div className="flex h-dvh flex-col">
      <header className="border-b-border bg-card flex h-10 shrink-0 items-center gap-1.5 border-b px-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <a
                href={import.meta.env.VITE_PUBLIC_MAIN_URL}
                aria-label="Tamery"
                className="hover:bg-accent shrink-0 rounded-md p-1.5"
              />
            }
          >
            <AppLogo className="text-primary size-4" />
          </TooltipTrigger>
          <TooltipContent side="bottom">Made with Tamery</TooltipContent>
        </Tooltip>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className="text-muted-foreground/40 size-3.5 shrink-0"
        />
        <HugeiconsIcon
          icon={LayoutTable02Icon}
          strokeWidth={2}
          className="text-primary size-3.5 shrink-0"
        />
        <h1 data-mask className="shrink-0 truncate text-sm font-medium">
          {first.name}
        </h1>
        {first.description && (
          <p
            data-mask
            className="text-muted-foreground min-w-0 truncate text-sm"
          >
            {first.description}
          </p>
        )}
        <span className="text-muted-foreground ml-auto shrink-0 px-2 text-xs">
          {shareRefreshLabels[first.refresh]}
        </span>
      </header>
      <div className="flex min-h-0 flex-1 p-2">
        <main className="bg-background ring-foreground/4 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl ring">
          <div className="flex shrink-0 items-center gap-2 px-3 py-2">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    disabled
                    focusableWhenDisabled
                    className="disabled:opacity-100"
                  />
                }
              >
                <HugeiconsIcon
                  icon={HashtagIcon}
                  strokeWidth={2}
                  className="text-muted-foreground/60"
                />
                <span className="text-2xs font-normal tabular-nums">
                  {hasNextPage ? `${rows.length}+` : rows.length}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {hasNextPage
                  ? `${rows.length} rows loaded; scroll for more.`
                  : `${rows.length} rows`}
              </TooltipContent>
            </Tooltip>
            <div
              data-mask
              className="flex min-w-0 flex-1 flex-wrap items-center gap-1"
            >
              {first.filters.map(({ column, operator, value }) => (
                <FilterChip
                  key={`${column}-${operator}-${value}`}
                  column={column}
                  operator={operator}
                  value={value ?? undefined}
                />
              ))}
            </div>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Download CSV"
                    render={
                      <a
                        href={`/csv/${shareId}?${new URLSearchParams(
                          search.sort
                            ? {
                                order: search.order ?? 'asc',
                                sort: search.sort,
                              }
                            : {}
                        )}`}
                        download
                        aria-label="Download CSV"
                      />
                    }
                  />
                }
              >
                <HugeiconsIcon
                  icon={Download04Icon}
                  strokeWidth={2}
                  className="text-muted-foreground/60"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">Download CSV</TooltipContent>
            </Tooltip>
          </div>
          {rows.length === 0 ? (
            <div className="flex min-h-0 flex-1 border-t">
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
            </div>
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
    </div>
  )
}

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
