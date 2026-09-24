import {
  AiIdeaIcon,
  Alert02Icon,
  FileExportIcon,
  StopIcon,
  PlayIcon,
  TableIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { SearchInput } from '@tamery/ui/components/custom/search-input'
import { Ctrl } from '@tamery/ui/components/custom/shortcuts'
import {
  createPopoverHandle,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@tamery/ui/components/popover'
import { Spinner } from '@tamery/ui/components/spinner'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@tamery/ui/components/tabs'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useDeferredValue, useState } from 'react'

import type { ExportDataProps } from '~/components/export-data'
import { ExportData } from '~/components/export-data'
import { PaneEmpty } from '~/components/pane-empty'
import type { ResultSet } from '~/entities/connection/queries/connection/custom'

import { useRunnerActions } from '../-lib/actions'
import type { RunnerResult } from '../-lib/run'
import { runnerResultsOptions } from '../-lib/run'
import { useRunnerTab } from '../-lib/store'
import { RunnerResultsTable } from './runner-results-table'

const { useRouteContext } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

const running = (
  <div className="flex h-full flex-col items-center justify-center gap-2">
    <Spinner className="text-muted-foreground size-6" />
    <span className="text-muted-foreground text-xs">Running…</span>
  </div>
)

const uniqueColumns = (columns: string[]) => {
  const seen = new Map<string, number>()
  return columns.map((name) => {
    const count = (seen.get(name) ?? 0) + 1
    seen.set(name, count)
    return count === 1 ? name : `${name} (${count})`
  })
}

const ResultError = ({
  result,
}: {
  result: RunnerResult & { error: string }
}) => {
  const { fixWithAi } = useRunnerActions()

  return (
    <PaneEmpty
      icon={Alert02Icon}
      title="The statement failed"
      description={result.error}
    >
      <Button size="sm" variant="outline" onClick={() => fixWithAi(result)}>
        <HugeiconsIcon icon={AiIdeaIcon} strokeWidth={2} />
        Fix with AI
        <span className="text-muted-foreground flex items-center">
          <Ctrl className="size-2.5" userAgent={navigator.userAgent} />
          <span className="text-2xs">I</span>
        </span>
      </Button>
    </PaneEmpty>
  )
}

const gridOf = (set: ResultSet | null, needle: string) => {
  const columns = uniqueColumns(set?.columns ?? [])
  const records = (set?.rows ?? []).map((row) =>
    Object.fromEntries(columns.map((column, index) => [column, row[index]]))
  )
  return {
    columns,
    rows: needle
      ? records.filter((row) =>
          JSON.stringify(Object.values(row)).toLowerCase().includes(needle)
        )
      : records,
  }
}

const ResultBody = ({
  result,
  columns,
  rows,
}: {
  result: RunnerResult
  columns: string[]
  rows: Record<string, unknown>[]
}) => {
  const { connection } = useRouteContext()

  if (result.pending) {
    return running
  }
  if (result.stopped) {
    return (
      <PaneEmpty
        icon={StopIcon}
        title="Stopped"
        description="The run was stopped before this statement finished"
      />
    )
  }
  if (result.error !== null) {
    return <ResultError result={{ ...result, error: result.error }} />
  }
  if (!result.set || result.set.columns.length === 0) {
    const affected = result.set?.affectedRows ?? null
    return (
      <PaneEmpty
        icon={TableIcon}
        title={
          affected === null
            ? 'Statement finished'
            : `${affected} ${affected === 1 ? 'row' : 'rows'} affected`
        }
        description="The statement returned no result set"
      />
    )
  }
  if (rows.length === 0 && result.set.rows.length > 0) {
    return (
      <PaneEmpty
        icon={TableIcon}
        title="Nothing matches"
        description="No row contains the search text"
      />
    )
  }
  return (
    <RunnerResultsTable
      columns={columns}
      rows={rows}
      connectionType={connection.type}
    />
  )
}

const ResultMeta = ({
  result: { duration, pending, set, stopped },
}: {
  result: RunnerResult
}) =>
  stopped || pending ? null : (
    <span className="text-2xs text-muted-foreground flex items-center gap-1.5 tabular-nums">
      {set && set.columns.length > 0 && (
        <>
          <span>
            <NumberFlow value={set.rows.length} />
            {set.truncated && '+'}
          </span>
          {set.rows.length === 1 ? 'row' : 'rows'}
          <span className="text-muted-foreground/40">·</span>
        </>
      )}
      {duration.toFixed(0)} ms
    </span>
  )

export const RunnerResults = () => {
  const tab = useRunnerTab()
  const { data: run } = useQuery(runnerResultsOptions(tab))
  const results = run?.results ?? []
  const [picked, setPicked] = useState({ index: 0, run: '' })
  const [search, setSearch] = useState('')
  // oxlint-disable-next-line react/hook-use-state -- a stable handle per mount, never set
  const [statementPopover] = useState(createPopoverHandle<string>)
  const activeIndex =
    picked.run === run?.id
      ? Math.min(picked.index, Math.max(0, results.length - 1))
      : 0
  const active = String(activeIndex)
  const result = results[activeIndex]
  const needle = useDeferredValue(search).trim().toLowerCase()
  const { columns, rows } = gridOf(result?.set ?? null, needle)

  if (!result) {
    return (
      <div className="flex h-full flex-col">
        <PaneEmpty
          icon={PlayIcon}
          title="No results yet"
          description="Run a statement to see its rows here"
        />
      </div>
    )
  }

  const getData: ExportDataProps['getData'] = ({ limit }) =>
    Promise.resolve(limit ? rows.slice(0, limit) : rows)

  return (
    <Tabs
      value={active}
      onValueChange={(value) =>
        setPicked({ index: Number(value), run: run?.id ?? '' })
      }
      className="size-full gap-0"
    >
      <div className="flex h-8 shrink-0 items-center gap-2 border-b pr-1 pl-3">
        {results.length > 1 ? (
          <TabsList
            variant="bar"
            className="no-scrollbar -ml-3 h-full shrink-0 overflow-x-auto after:hidden data-[variant=bar]:w-auto"
          >
            {results.map((item, index) => (
              <PopoverTrigger
                key={`${item.start}:${index}`}
                handle={statementPopover}
                payload={item.source}
                openOnHover
                delay={300}
                render={
                  <TabsTrigger
                    value={String(index)}
                    className={cn(
                      'flex-none tabular-nums transition-none',
                      item.error !== null && 'text-destructive',
                      (item.stopped || item.pending) && 'text-muted-foreground'
                    )}
                  />
                }
              >
                {index + 1}
              </PopoverTrigger>
            ))}
            <Popover handle={statementPopover}>
              {({ payload }) => (
                <PopoverContent
                  side="top"
                  align="start"
                  padding="none"
                  morph
                  className="max-w-lg min-w-64"
                >
                  {typeof payload === 'string' && (
                    <CodeBlock
                      className="max-h-80 px-3 py-2.5"
                      code={payload}
                      language="sql"
                      size="xs"
                      wrap
                    />
                  )}
                </PopoverContent>
              )}
            </Popover>
          </TabsList>
        ) : (
          <span className="text-sm font-medium">Results</span>
        )}
        <ResultMeta result={result} />
        {run?.running && <Spinner className="text-muted-foreground size-3" />}
        <div className="ml-auto flex items-center gap-1">
          {result.set && result.set.rows.length > 0 && (
            <SearchInput
              size="xs"
              className="w-40"
              placeholder="Search rows"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onClear={() => setSearch('')}
            />
          )}
          <ExportData
            getData={getData}
            filename="runner_results"
            tooltip="Export results"
            // oxlint-disable-next-line react/no-unstable-nested-components
            trigger={({ isExporting }) => (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Export results"
                className="text-muted-foreground hover:text-foreground"
                disabled={isExporting || rows.length === 0}
              >
                <LoadingContent loading={isExporting}>
                  <HugeiconsIcon icon={FileExportIcon} strokeWidth={2} />
                </LoadingContent>
              </Button>
            )}
          />
        </div>
      </div>
      <TabsContent
        key={`${run?.id}:${active}`}
        value={active}
        className="flex min-h-0 flex-1 flex-col"
      >
        <ResultBody result={result} columns={columns} rows={rows} />
      </TabsContent>
    </Tabs>
  )
}
