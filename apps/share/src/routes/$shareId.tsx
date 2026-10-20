import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Download04Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { shareRefreshLabels } from '@tamery/shared/enums/share-refresh'
import { Button } from '@tamery/ui/components/button'
import { FilterChip } from '@tamery/ui/components/custom/filter-chip'
import { createFileRoute, Link } from '@tanstack/react-router'

import { PasswordForm } from '~/components/password-form'
import { ShareTable, shareSearch } from '~/components/share-table'
import { StatusPage } from '~/components/status-page'
import { getShare } from '~/lib/share'

const SharePage = () => {
  const share = Route.useLoaderData()
  const { shareId } = Route.useParams()
  const search = Route.useSearch()
  const page = search.page ?? 1

  if (share.status === 'locked') {
    return <PasswordForm shareId={shareId} message={share.message} />
  }
  if (share.status !== 'ready') {
    return <StatusPage status={share.status} />
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1
          data-mask
          className="text-2xl font-semibold tracking-tight text-balance"
        >
          {share.name}
        </h1>
        {share.description && (
          <p data-mask className="text-muted-foreground max-w-2xl text-sm">
            {share.description}
          </p>
        )}
        {share.filters.length > 0 && (
          <div data-mask className="flex flex-wrap gap-1.5">
            {share.filters.map(({ column, operator, value }) => (
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
      <ShareTable columns={share.columns} rows={share.rows} search={search} />
      <footer className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          render={
            <a
              href={`/csv/${shareId}?${new URLSearchParams(
                search.sort
                  ? { order: search.order ?? 'asc', sort: search.sort }
                  : {}
              )}`}
              download
              aria-label="Download CSV"
            />
          }
        >
          <HugeiconsIcon icon={Download04Icon} strokeWidth={2} />
          Download CSV
        </Button>
        <span className="text-muted-foreground text-xs">
          {shareRefreshLabels[share.refresh]}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-muted-foreground text-xs tabular-nums">
            {`Page ${page}`}
          </span>
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="Previous page"
            disabled={page === 1}
            render={
              <Link
                to="."
                search={{ ...search, page: page === 2 ? undefined : page - 1 }}
              />
            }
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="Next page"
            disabled={!share.hasMore}
            render={<Link to="." search={{ ...search, page: page + 1 }} />}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </Button>
        </div>
      </footer>
      <a
        href={import.meta.env.VITE_PUBLIC_MAIN_URL}
        className="text-muted-foreground hover:text-foreground mt-auto self-center pt-6 text-xs"
      >
        Made with Tamery
      </a>
    </main>
  )
}

export const Route = createFileRoute('/$shareId')({
  validateSearch: shareSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps: { order, page = 1, sort }, params }) =>
    getShare({
      data: {
        id: params.shareId,
        page,
        sort: sort
          ? { column: sort, direction: order === 'desc' ? 'DESC' : 'ASC' }
          : null,
      },
    }),
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
