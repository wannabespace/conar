import { silently } from '@tamery/shared/utils'
import { TableSkeleton } from '@tamery/table'
import { FilterChip } from '@tamery/ui/components/custom/filter-chip'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { type } from 'arktype'
import { Suspense } from 'react'

import { StatusPage } from '~/components/status-page'
import { TopBar } from '~/components/top-bar'
import { SHARE_LOCKED } from '~/lib/share'
import { shareInfoQueryOptions, shareRowsQueryOptions } from '~/lib/share-rows'

import { PasswordForm } from './-components/password-form'
import { ShareTable } from './-components/share-table'
import { UpdatedAt } from './-components/updated-at'

const uuid = type('string.uuid')

const SharePage = () => {
  const { shareId } = Route.useParams()
  const { data: info } = useSuspenseQuery(shareInfoQueryOptions(shareId))

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
  loader: ({ context, params }) => {
    if (!uuid.allows(params.shareId)) {
      throw notFound()
    }
    void silently(() =>
      context.queryClient.infiniteQuery({
        ...shareRowsQueryOptions(params.shareId),
        staleTime: 'static',
      })
    )
    return context.queryClient.query({
      ...shareInfoQueryOptions(params.shareId),
      staleTime: 'static',
    })
  },
  head: ({ loaderData }) => ({
    meta: loaderData
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
  errorComponent: ({ error }) =>
    error instanceof Error && error.message === SHARE_LOCKED ? (
      <PasswordForm />
    ) : (
      <StatusPage status="unavailable" />
    ),
})
