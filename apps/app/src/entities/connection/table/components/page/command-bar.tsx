import NumberFlow from '@number-flow/react'
import {
  RiCheckLine,
  RiCodeSSlashLine,
  RiDownloadLine,
  RiLoopLeftLine,
  RiMoreLine,
  RiSeedlingLine,
} from '@remixicon/react'
import type { ActiveFilter } from '@tamery/shared/filters'
import { pick } from '@tamery/shared/utils/helpers'
import { Badge } from '@tamery/ui/components/badge'
import { Button } from '@tamery/ui/components/button'
import { ContentSwitch } from '@tamery/ui/components/custom/content-switch'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { Popover, PopoverContent, PopoverTrigger } from '@tamery/ui/components/popover'
import { Separator } from '@tamery/ui/components/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import { ExportData } from '~/components/export-data'
import {
  resourceConstraintsQueryOptions,
  resourceEnumsQueryOptions,
  resourceRowsQuery,
  resourceRowsQueryInfiniteOptions,
  resourceTableColumnsQueryOptions,
  resourceTablesAndSchemasQueryOptions,
  resourceTableTotalQueryOptions,
} from '~/entities/connection/queries'
import { connectionResourceToQueryParams } from '~/entities/connection/runtime'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { useRefreshHotkey } from '~/hooks/use-refresh-hotkey'
import { queryClient } from '~/main'

import { useTableColumns } from '../../columns'
import { useTablePageStore } from '../../store'
import { HeaderActionsColumns } from '../header/header-actions-columns'
import { HeaderActionsCopy } from '../header/header-actions-copy'
import { HeaderActionsDelete } from '../header/header-actions-delete'
import { HeaderActionsFilters } from '../header/header-actions-filters'
import { HeaderActionsOrder } from '../header/header-actions-order'
import { HeaderActionsSeed } from '../header/header-actions-seed'
import { HeaderSearch } from '../header/header-search'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

// Matches the w-56 layout slot the search overlay rests on
const SEARCH_REST_WIDTH = 224

function OverflowRow(props: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="sm"
      {...props}
      className={cn(
        `
          h-7 w-full justify-start gap-2 rounded-md px-2 text-sm
          font-normal
        `,
        props.className,
      )}
    />
  )
}

export function CommandBar({ table, schema }: { table: string; schema: string }) {
  const { connectionResource } = useRouteContext()
  const barRef = useRef<HTMLDivElement>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [expandedWidth, setExpandedWidth] = useState(SEARCH_REST_WIDTH)

  // The focused search overlay spans the bar edge-to-edge; keep its pixel
  // target in sync with the bar's size (sidebar fold, window resize)
  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return

    const observer = new ResizeObserver(() => {
      setExpandedWidth(bar.clientWidth - 12)
    })
    observer.observe(bar)

    return () => observer.disconnect()
  }, [])
  const columns = useTableColumns()
  const store = useTablePageStore()
  const connectionStore = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(connectionStore, { selector: state => state.showSystem })
  const { data: tablesAndSchemas } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem }),
  )
  const tableType =
    tablesAndSchemas?.schemas.find(s => s.name === schema)?.tables?.find(t => t.name === table)
      ?.type ?? 'table'
  const { filters, exact, orderBy, selected } = useSubscription(store, {
    selector: state => pick(state, ['filters', 'orderBy', 'exact', 'selected']),
  })
  const { data: total, isLoading: isTotalLoading } = useQuery(
    resourceTableTotalQueryOptions({
      connectionResource,
      table,
      schema,
      query: { filters, exact },
    }),
  )

  const {
    isFetching,
    dataUpdatedAt,
    refetch,
    data: rows = [],
    isPending,
  } = useInfiniteQuery(
    resourceRowsQueryInfiniteOptions({
      connectionResource,
      table,
      schema,
      query: { filters, orderBy },
    }),
  )

  async function handleRefresh() {
    refetch()
    queryClient.invalidateQueries(
      resourceTableColumnsQueryOptions({ connectionResource, table, schema }),
    )
    queryClient.invalidateQueries(
      resourceTableTotalQueryOptions({
        connectionResource,
        table,
        schema,
        query: { filters, exact },
      }),
    )
    queryClient.invalidateQueries(resourceConstraintsQueryOptions({ connectionResource }))
    queryClient.invalidateQueries(resourceEnumsQueryOptions({ connectionResource }))
  }

  useRefreshHotkey(handleRefresh, isFetching)

  const getAllData = async ({ filters: exportFilters }: { filters?: ActiveFilter[] }) => {
    const data: Record<string, unknown>[] = []
    const limit = 1000
    let offset = 0

    const queryParams = await connectionResourceToQueryParams(connectionResource)

    while (true) {
      // Sequential by design: paginated fetch — each batch depends on the previous offset
      // oxlint-disable-next-line no-await-in-loop
      const batch = await resourceRowsQuery({
        schema,
        table,
        limit,
        offset,
        query: {
          orderBy,
          filters: exportFilters || filters,
          filtersConcatOperator: exportFilters ? 'OR' : 'AND',
        },
      }).run(queryParams)

      data.push(...batch)

      if (batch.length < limit) {
        break
      }

      offset += limit
    }

    return data
  }

  const getLimitedData = async ({
    limit,
    filters: exportFilters,
  }: {
    limit: number
    filters?: ActiveFilter[]
  }) =>
    resourceRowsQuery({
      schema,
      table,
      limit,
      offset: 0,
      query: {
        orderBy,
        filters: exportFilters || filters,
        filtersConcatOperator: exportFilters ? 'OR' : 'AND',
      },
    }).run(await connectionResourceToQueryParams(connectionResource))

  const getData = async ({ limit, filters }: { limit?: number; filters?: ActiveFilter[] }) => {
    return limit ? getLimitedData({ limit, filters }) : getAllData({ filters })
  }

  return (
    <div
      ref={barRef}
      className={`
        pointer-events-auto relative flex w-full max-w-3xl items-center gap-2
        rounded-xl border bg-background/80 py-1.5 pr-1.5 pl-3 shadow-lg
        backdrop-blur-xl
      `}
    >
      <motion.div
        className="flex min-w-0 flex-1 items-center gap-2"
        initial={false}
        animate={{ opacity: isSearchFocused ? 0 : 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {selected.length === 0 ? (
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-sm leading-tight">
              <span className="text-muted-foreground">{schema}.</span>
              <span data-mask className="font-semibold">
                {table}
              </span>
            </h2>
            {tableType !== 'table' && (
              <Badge variant="secondary" className="h-4.5 shrink-0 px-1.5 text-2xs uppercase">
                {tableType === 'view' ? 'view' : 'mat. view'}
              </Badge>
            )}
            <Separator orientation="vertical" className="h-3.5! shrink-0" />
            <Tooltip>
              <TooltipTrigger
                className="
                    shrink-0 cursor-default text-2xs whitespace-nowrap
                    text-muted-foreground tabular-nums
                  "
                onClick={() =>
                  store.set(state => ({ ...state, exact: true }) satisfies typeof state)
                }
              >
                {total?.count === undefined ? (
                  <span>{columns.length} cols · …</span>
                ) : (
                  <>
                    {columns.length} cols ·{' '}
                    <NumberFlow
                      value={total.count}
                      className={cn(
                        'tabular-nums',
                        isTotalLoading && 'animate-pulse text-muted-foreground/50',
                      )}
                      prefix={total.isEstimated ? '~' : ''}
                      suffix={total.count === 1 ? ' row' : ' rows'}
                    />
                  </>
                )}
              </TooltipTrigger>
              <TooltipContent side="top">
                {!exact && total?.isEstimated ? 'Click to get the exact count.' : 'Table size'}
                <p className="text-xs opacity-70">
                  Updated: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'never'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary tabular-nums">
              {selected.length} selected
            </span>
          </div>
        )}
        {tableType === 'table' && <HeaderActionsDelete table={table} schema={schema} />}
      </motion.div>
      <motion.div
        className="flex shrink-0 items-center gap-1"
        initial={false}
        animate={{ opacity: isSearchFocused ? 0 : 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <HeaderActionsColumns />
        <HeaderActionsFilters />
        <HeaderActionsOrder />
        <Popover>
          <Tooltip>
            <TooltipTrigger
              render={<PopoverTrigger render={<Button variant="outline" size="icon" />} />}
            >
              <RiMoreLine />
            </TooltipTrigger>
            <TooltipContent side="top">More actions</TooltipContent>
          </Tooltip>
          <PopoverContent
            side="top"
            align="end"
            className="
                w-44 gap-0 rounded-2xl p-1
                **:data-[slot=popover-viewport]:p-0
              "
          >
            <OverflowRow onClick={handleRefresh} disabled={isFetching}>
              <LoadingContent loading={isFetching} className="size-4">
                <ContentSwitch
                  activeContent={<RiCheckLine className="text-success" />}
                  active={isFetching}
                >
                  <RiLoopLeftLine className="size-4 text-muted-foreground" />
                </ContentSwitch>
              </LoadingContent>
              Refresh
            </OverflowRow>
            {tableType === 'table' && (
              <HeaderActionsSeed
                table={table}
                schema={schema}
                trigger={
                  <OverflowRow>
                    <RiSeedlingLine className="size-4 text-muted-foreground" />
                    Seed data…
                  </OverflowRow>
                }
              />
            )}
            <ExportData
              selected={selected}
              filename={`${schema}_${table}`}
              getData={getData}
              trigger={({ isExporting }) => (
                <OverflowRow disabled={isExporting || rows?.length === 0 || isPending}>
                  <LoadingContent loading={isExporting} className="size-4">
                    <RiDownloadLine className="size-4 text-muted-foreground" />
                  </LoadingContent>
                  Download…
                </OverflowRow>
              )}
            />
            {tableType === 'table' && (
              <HeaderActionsCopy
                table={table}
                trigger={
                  <OverflowRow>
                    <RiCodeSSlashLine className="size-4 text-muted-foreground" />
                    Code…
                  </OverflowRow>
                }
              />
            )}
          </PopoverContent>
        </Popover>
      </motion.div>
      {/* Layout slot the search overlay rests on — the real input floats above */}
      <div aria-hidden className="h-8 w-56 shrink-0" />
      {/* Right-anchored overlay: grows leftward across the whole bar on focus.
          A single measured width animation — interruptible, no flex fighting,
          and the input's content never distorts */}
      <motion.div
        className="absolute inset-y-1.5 right-1.5 z-10"
        initial={false}
        animate={{ width: isSearchFocused ? expandedWidth : SEARCH_REST_WIDTH }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        onFocusCapture={() => setIsSearchFocused(true)}
        onBlurCapture={e => {
          if (!e.currentTarget.contains(e.relatedTarget)) setIsSearchFocused(false)
        }}
        onKeyDownCapture={e => {
          if (e.key === 'Escape') (e.target as HTMLElement).blur()
        }}
      >
        <HeaderSearch table={table} schema={schema} />
      </motion.div>
    </div>
  )
}
